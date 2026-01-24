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
    const instructorId = searchParams.get('instructor_id')
    const facilityId = searchParams.get('facility_id')
    const eventType = searchParams.get('event_type')
    const status = searchParams.get('status')
    const clientId = searchParams.get('client_id')

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
      .from('calendar_events')
      .select(`
        *,
        instructor:club_staff!calendar_events_instructor_id_fkey(id, full_name, email, avatar_url, specialties),
        facility:facilities!calendar_events_facility_id_fkey(id, name, sport, location_type, capacity),
        client:clients!calendar_events_client_id_fkey(id, full_name, email, phone, avatar_url),
        participants:event_participants(
          id,
          status,
          client:clients(id, full_name, email, avatar_url)
        ),
        recurrence:event_recurrence(*)
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
    if (instructorId) {
      query = query.eq('instructor_id', instructorId)
    }
    if (facilityId) {
      query = query.eq('facility_id', facilityId)
    }
    if (eventType) {
      query = query.eq('event_type', eventType)
    }
    if (status) {
      query = query.eq('status', status)
    }
    if (clientId) {
      query = query.eq('client_id', clientId)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ events: data || [] })
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
      title,
      description,
      start_time,
      end_time,
      event_type,
      status = 'pending',
      instructor_id,
      facility_id,
      client_id,
      price,
      max_participants,
      color,
      notes,
      metadata,
      is_recurring,
      recurrence
    } = body

    // Validate required fields
    if (!title || !start_time || !end_time || !event_type) {
      return NextResponse.json(
        { error: 'title, start_time, end_time, and event_type are required' },
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

    const eventPayload = {
      organization_id: orgUser.organization_id,
      title,
      description: description || null,
      start_time,
      end_time,
      event_type,
      status,
      instructor_id: instructor_id || null,
      facility_id: facility_id || null,
      client_id: client_id || null,
      price: price ?? null,
      max_participants: max_participants ?? null,
      color: color || null,
      notes: notes || null,
      metadata: metadata || {},
      is_recurring: is_recurring || false,
      created_by: user.id
    }

    // Insert the event
    const { data: eventData, error: eventError } = await supabase
      .from('calendar_events')
      .insert(eventPayload)
      .select('*')
      .single()

    if (eventError) {
      return NextResponse.json({ error: eventError.message }, { status: 400 })
    }

    // If recurring, create recurrence pattern
    if (is_recurring && recurrence) {
      const { error: recurrenceError } = await supabase
        .from('event_recurrence')
        .insert({
          event_id: eventData.id,
          frequency: recurrence.frequency,
          interval_value: recurrence.interval_value || 1,
          days_of_week: recurrence.days_of_week || [],
          end_date: recurrence.end_date || null,
          occurrences: recurrence.occurrences || null,
          exceptions: recurrence.exceptions || []
        })

      if (recurrenceError) {
        // Rollback: delete the event
        await supabase.from('calendar_events').delete().eq('id', eventData.id)
        return NextResponse.json({ error: recurrenceError.message }, { status: 400 })
      }
    }

    // Fetch the complete event with relations
    const { data: fullEvent } = await supabase
      .from('calendar_events')
      .select(`
        *,
        instructor:club_staff!calendar_events_instructor_id_fkey(id, full_name, email, avatar_url),
        facility:facilities!calendar_events_facility_id_fkey(id, name, sport, location_type),
        client:clients!calendar_events_client_id_fkey(id, full_name, email),
        recurrence:event_recurrence(*)
      `)
      .eq('id', eventData.id)
      .single()

    return NextResponse.json({ event: fullEvent }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || 'Unexpected error' },
      { status: 500 }
    )
  }
}
