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
      .from('calendar_events')
      .select(`
        *,
        instructor:club_staff!calendar_events_instructor_id_fkey(id, full_name, email, avatar_url, specialties, phone),
        facility:facilities!calendar_events_facility_id_fkey(id, name, sport, location_type, capacity),
        client:clients!calendar_events_client_id_fkey(id, full_name, email, phone, avatar_url),
        participants:event_participants(
          id,
          status,
          registered_at,
          attended_at,
          client:clients(id, full_name, email, avatar_url, phone)
        ),
        recurrence:event_recurrence(*)
      `)
      .eq('id', id)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    return NextResponse.json({ event: data })
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
      title,
      description,
      start_time,
      end_time,
      event_type,
      status,
      instructor_id,
      facility_id,
      client_id,
      price,
      max_participants,
      color,
      notes,
      metadata,
      recurrence,
      update_series // If true, update all events in a recurring series
    } = body

    const updatePayload: Record<string, any> = {}
    if (title !== undefined) updatePayload.title = title
    if (description !== undefined) updatePayload.description = description
    if (start_time !== undefined) updatePayload.start_time = start_time
    if (end_time !== undefined) updatePayload.end_time = end_time
    if (event_type !== undefined) updatePayload.event_type = event_type
    if (status !== undefined) updatePayload.status = status
    if (instructor_id !== undefined) updatePayload.instructor_id = instructor_id
    if (facility_id !== undefined) updatePayload.facility_id = facility_id
    if (client_id !== undefined) updatePayload.client_id = client_id
    if (price !== undefined) updatePayload.price = price
    if (max_participants !== undefined) updatePayload.max_participants = max_participants
    if (color !== undefined) updatePayload.color = color
    if (notes !== undefined) updatePayload.notes = notes
    if (metadata !== undefined) updatePayload.metadata = metadata

    // Update the event
    const { data: eventData, error: eventError } = await supabase
      .from('calendar_events')
      .update(updatePayload)
      .eq('id', id)
      .select('*')
      .single()

    if (eventError) {
      return NextResponse.json({ error: eventError.message }, { status: 400 })
    }

    // Update recurrence if provided
    if (recurrence !== undefined) {
      if (recurrence === null) {
        // Remove recurrence
        await supabase
          .from('event_recurrence')
          .delete()
          .eq('event_id', id)
        
        await supabase
          .from('calendar_events')
          .update({ is_recurring: false })
          .eq('id', id)
      } else {
        // Upsert recurrence
        const { error: recurrenceError } = await supabase
          .from('event_recurrence')
          .upsert({
            event_id: id,
            frequency: recurrence.frequency,
            interval_value: recurrence.interval_value || 1,
            days_of_week: recurrence.days_of_week || [],
            end_date: recurrence.end_date || null,
            occurrences: recurrence.occurrences || null,
            exceptions: recurrence.exceptions || []
          }, { onConflict: 'event_id' })

        if (recurrenceError) {
          return NextResponse.json({ error: recurrenceError.message }, { status: 400 })
        }

        await supabase
          .from('calendar_events')
          .update({ is_recurring: true })
          .eq('id', id)
      }
    }

    // Fetch the complete updated event
    const { data: fullEvent } = await supabase
      .from('calendar_events')
      .select(`
        *,
        instructor:club_staff!calendar_events_instructor_id_fkey(id, full_name, email, avatar_url),
        facility:facilities!calendar_events_facility_id_fkey(id, name, sport, location_type),
        client:clients!calendar_events_client_id_fkey(id, full_name, email),
        recurrence:event_recurrence(*)
      `)
      .eq('id', id)
      .single()

    return NextResponse.json({ event: fullEvent })
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

    const { searchParams } = new URL(request.url)
    const deleteSeries = searchParams.get('delete_series') === 'true'

    // Get the event first to check if it's part of a series
    const { data: event } = await supabase
      .from('calendar_events')
      .select('parent_event_id, is_recurring')
      .eq('id', id)
      .single()

    if (deleteSeries && event?.is_recurring) {
      // Delete all child events first
      await supabase
        .from('calendar_events')
        .delete()
        .eq('parent_event_id', id)
    }

    // Delete the event
    const { error } = await supabase
      .from('calendar_events')
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
