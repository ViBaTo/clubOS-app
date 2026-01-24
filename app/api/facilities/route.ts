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
    const activeOnly = searchParams.get('active') === 'true'
    const sport = searchParams.get('sport')
    const locationType = searchParams.get('location_type')

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
      .from('facilities')
      .select('*')
      .eq('organization_id', orgUser.organization_id)
      .order('name', { ascending: true })

    if (activeOnly) {
      query = query.eq('is_active', true)
    }
    if (sport) {
      query = query.eq('sport', sport)
    }
    if (locationType) {
      query = query.eq('location_type', locationType)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ facilities: data || [] })
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
    const { name, sport, facility_type, capacity, location_type, attributes, is_active } = body

    if (!name || !sport) {
      return NextResponse.json(
        { error: 'name and sport are required' },
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

    // Check permission (owner, admin, staff)
    if (!['owner', 'admin', 'staff'].includes(orgUser.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const insertPayload = {
      organization_id: orgUser.organization_id,
      name,
      sport,
      facility_type: facility_type || 'cancha',
      capacity: capacity ?? null,
      location_type: location_type || 'interior',
      attributes: attributes || {},
      is_active: is_active ?? true
    }

    const { data, error } = await supabase
      .from('facilities')
      .insert(insertPayload)
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ facility: data }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || 'Unexpected error' },
      { status: 500 }
    )
  }
}
