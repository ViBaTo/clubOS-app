import { NextResponse } from 'next/server'
import { getSupabaseRouteClientWithAuth } from '@/app/lib/supabaseServer'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = getSupabaseRouteClientWithAuth(request)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('reservations')
      .select(`
        *,
        facility:facilities(id, name, sport, location_type, capacity),
        client:clients(id, full_name, email, phone, avatar_url),
        payment:payments(id, amount, payment_method, status, payment_date)
      `)
      .eq('id', id)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    return NextResponse.json({ reservation: data })
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || 'Unexpected error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = getSupabaseRouteClientWithAuth(request)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      facility_id,
      start_time,
      end_time,
      status,
      price,
      payment_status,
      notes
    } = body

    const updatePayload: Record<string, any> = {}
    if (facility_id !== undefined) updatePayload.facility_id = facility_id
    if (start_time !== undefined) updatePayload.start_time = start_time
    if (end_time !== undefined) updatePayload.end_time = end_time
    if (status !== undefined) {
      updatePayload.status = status
      if (status === 'confirmed') {
        updatePayload.confirmed_at = new Date().toISOString()
      } else if (status === 'cancelled') {
        updatePayload.cancelled_at = new Date().toISOString()
      }
    }
    if (price !== undefined) updatePayload.price = price
    if (payment_status !== undefined) updatePayload.payment_status = payment_status
    if (notes !== undefined) updatePayload.notes = notes

    const { data, error } = await supabase
      .from('reservations')
      .update(updatePayload)
      .eq('id', id)
      .select(`
        *,
        facility:facilities(id, name, sport, location_type),
        client:clients(id, full_name, email, phone)
      `)
      .single()

    if (error) {
      if (error.message.includes('not available')) {
        return NextResponse.json({ error: 'Facility is not available at the specified time' }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ reservation: data })
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || 'Unexpected error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = getSupabaseRouteClientWithAuth(request)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check user role
    const { data: orgUser } = await supabase
      .from('organization_users')
      .select('role')
      .eq('user_id', user.id)
      .order('is_primary', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!orgUser || !['owner', 'admin'].includes(orgUser.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { error } = await supabase
      .from('reservations')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || 'Unexpected error' },
      { status: 500 }
    )
  }
}

// Cancel reservation (soft delete)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = getSupabaseRouteClientWithAuth(request)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { cancellation_reason } = body

    const { data, error } = await supabase
      .from('reservations')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: cancellation_reason || null
      })
      .eq('id', id)
      .select(`
        *,
        facility:facilities(id, name),
        client:clients(id, full_name, email)
      `)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ reservation: data })
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || 'Unexpected error' },
      { status: 500 }
    )
  }
}
