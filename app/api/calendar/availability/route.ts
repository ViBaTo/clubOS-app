import { NextResponse } from 'next/server'
import { getSupabaseRouteClientWithAuth } from '@/app/lib/supabaseServer'

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
      instructor_id, 
      start_time, 
      end_time, 
      exclude_event_id 
    } = body

    if (!start_time || !end_time) {
      return NextResponse.json(
        { error: 'start_time and end_time are required' },
        { status: 400 }
      )
    }

    const results: {
      facility_available?: boolean
      instructor_available?: boolean
    } = {}

    // Check facility availability if facility_id provided
    if (facility_id) {
      const { data: facilityAvailable, error: facilityError } = await supabase.rpc(
        'check_facility_availability',
        {
          p_facility_id: facility_id,
          p_start_time: start_time,
          p_end_time: end_time,
          p_exclude_event_id: exclude_event_id || null,
          p_exclude_reservation_id: null
        }
      )

      if (facilityError) {
        return NextResponse.json({ error: facilityError.message }, { status: 400 })
      }

      results.facility_available = facilityAvailable
    }

    // Check instructor availability if instructor_id provided
    if (instructor_id) {
      const { data: instructorAvailable, error: instructorError } = await supabase.rpc(
        'check_instructor_availability',
        {
          p_instructor_id: instructor_id,
          p_start_time: start_time,
          p_end_time: end_time,
          p_exclude_event_id: exclude_event_id || null
        }
      )

      if (instructorError) {
        return NextResponse.json({ error: instructorError.message }, { status: 400 })
      }

      results.instructor_available = instructorAvailable
    }

    // Overall availability
    const available = 
      (results.facility_available === undefined || results.facility_available) &&
      (results.instructor_available === undefined || results.instructor_available)

    return NextResponse.json({ 
      available,
      ...results
    })
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || 'Unexpected error' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const supabase = getSupabaseRouteClientWithAuth(request)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const instructorId = searchParams.get('instructor_id')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    if (!instructorId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'instructor_id, start_date, and end_date are required' },
        { status: 400 }
      )
    }

    // Get instructor schedule
    const { data, error } = await supabase.rpc('get_instructor_schedule', {
      p_instructor_id: instructorId,
      p_start_date: startDate,
      p_end_date: endDate
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ schedule: data || [] })
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || 'Unexpected error' },
      { status: 500 }
    )
  }
}
