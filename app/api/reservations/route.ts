import { NextResponse } from 'next/server'
import { getSupabaseRouteClientWithAuth } from '@/app/lib/supabaseServer'

export async function GET(request: Request) {
  try {
    const supabase = getSupabaseRouteClientWithAuth(request)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const facilityId = searchParams.get('facility_id')
    const clientId = searchParams.get('client_id')
    const status = searchParams.get('status')

    // Get user's organization
    const { data: orgUser } = await supabase
      .from('organization_users')
      .select('organization_id')
      .eq('user_id', user.id)
      .order('is_primary', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!orgUser?.organization_id) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 })
    }

    let query = supabase
      .from('reservations')
      .select(`
        *,
        facility:facilities(id, name, sport, location_type, capacity),
        client:clients(id, full_name, email, phone, avatar_url),
        payment:payments(id, amount, payment_method, status)
      `)
      .eq('organization_id', orgUser.organization_id)
      .order('start_time', { ascending: true })

    // Apply filters
    if (startDate) {
      query = query.gte('start_time', startDate)
    }
    if (endDate) {
      query = query.lte('start_time', endDate)
    }
    if (facilityId) {
      query = query.eq('facility_id', facilityId)
    }
    if (clientId) {
      query = query.eq('client_id', clientId)
    }
    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ reservations: data || [] })
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || 'Unexpected error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseRouteClientWithAuth(request)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      facility_id,
      client_id,
      start_time,
      end_time,
      price,
      notes
    } = body

    // Validate required fields
    if (!facility_id || !client_id || !start_time || !end_time) {
      return NextResponse.json(
        { error: 'facility_id, client_id, start_time, and end_time are required' },
        { status: 400 }
      )
    }

    // Get user's organization
    const { data: orgUser } = await supabase
      .from('organization_users')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .order('is_primary', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!orgUser?.organization_id) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 })
    }

    // Check permission
    if (!['owner', 'admin', 'staff'].includes(orgUser.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const reservationPayload = {
      organization_id: orgUser.organization_id,
      facility_id,
      client_id,
      start_time,
      end_time,
      price: price ?? null,
      notes: notes || null,
      status: 'pending',
      payment_status: 'pending'
    }

    const { data, error } = await supabase
      .from('reservations')
      .insert(reservationPayload)
      .select(`
        *,
        facility:facilities(id, name, sport, location_type),
        client:clients(id, full_name, email, phone)
      `)
      .single()

    if (error) {
      // Check for conflict error from trigger
      if (error.message.includes('not available')) {
        return NextResponse.json({ error: 'Facility is not available at the specified time' }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ reservation: data }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || 'Unexpected error' },
      { status: 500 }
    )
  }
}
