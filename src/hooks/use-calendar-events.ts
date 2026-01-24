"use client"

import { useState, useEffect, useCallback } from 'react'
import { getSupabaseClient } from '@/app/lib/supabaseClient'
import type { 
  CalendarEventDB, 
  CalendarEvent, 
  CreateEventRequest, 
  UpdateEventRequest,
  dbEventToLegacy 
} from '@/src/types/calendar'
import { dbEventToLegacy as convertToLegacy } from '@/src/types/calendar'

interface UseCalendarEventsOptions {
  startDate?: string
  endDate?: string
  instructorId?: string
  facilityId?: string
  eventType?: string
  status?: string
  autoFetch?: boolean
}

interface UseCalendarEventsReturn {
  events: CalendarEvent[]
  dbEvents: CalendarEventDB[]
  loading: boolean
  error: string | null
  fetchEvents: () => Promise<void>
  createEvent: (data: CreateEventRequest) => Promise<CalendarEventDB | null>
  updateEvent: (id: string, data: UpdateEventRequest) => Promise<CalendarEventDB | null>
  deleteEvent: (id: string, deleteSeries?: boolean) => Promise<boolean>
  moveEvent: (id: string, newStartTime: string, newEndTime: string) => Promise<boolean>
  refetch: () => Promise<void>
}

export function useCalendarEvents(options: UseCalendarEventsOptions = {}): UseCalendarEventsReturn {
  const [dbEvents, setDbEvents] = useState<CalendarEventDB[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { startDate, endDate, instructorId, facilityId, eventType, status, autoFetch = true } = options

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const supabase = getSupabaseClient()
      const session = (await supabase.auth.getSession()).data.session
      const token = session?.access_token

      const params = new URLSearchParams()
      if (startDate) params.append('start_date', startDate)
      if (endDate) params.append('end_date', endDate)
      if (instructorId) params.append('instructor_id', instructorId)
      if (facilityId) params.append('facility_id', facilityId)
      if (eventType) params.append('event_type', eventType)
      if (status) params.append('status', status)

      const url = `/api/calendar/events${params.toString() ? '?' + params.toString() : ''}`
      
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || 'Failed to fetch events')
      }

      setDbEvents(json.events || [])
    } catch (e: any) {
      setError(e.message || 'Error fetching events')
      console.error('Error fetching calendar events:', e)
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate, instructorId, facilityId, eventType, status])

  const createEvent = async (data: CreateEventRequest): Promise<CalendarEventDB | null> => {
    try {
      const supabase = getSupabaseClient()
      const session = (await supabase.auth.getSession()).data.session
      const token = session?.access_token

      const res = await fetch('/api/calendar/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(data)
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || 'Failed to create event')
      }

      // Add to local state
      setDbEvents(prev => [...prev, json.event])
      return json.event
    } catch (e: any) {
      setError(e.message || 'Error creating event')
      console.error('Error creating event:', e)
      return null
    }
  }

  const updateEvent = async (id: string, data: UpdateEventRequest): Promise<CalendarEventDB | null> => {
    try {
      const supabase = getSupabaseClient()
      const session = (await supabase.auth.getSession()).data.session
      const token = session?.access_token

      const res = await fetch(`/api/calendar/events/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(data)
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || 'Failed to update event')
      }

      // Update local state
      setDbEvents(prev => prev.map(e => e.id === id ? json.event : e))
      return json.event
    } catch (e: any) {
      setError(e.message || 'Error updating event')
      console.error('Error updating event:', e)
      return null
    }
  }

  const deleteEvent = async (id: string, deleteSeries = false): Promise<boolean> => {
    try {
      const supabase = getSupabaseClient()
      const session = (await supabase.auth.getSession()).data.session
      const token = session?.access_token

      const url = deleteSeries 
        ? `/api/calendar/events/${id}?delete_series=true`
        : `/api/calendar/events/${id}`

      const res = await fetch(url, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      })

      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error || 'Failed to delete event')
      }

      // Remove from local state
      setDbEvents(prev => prev.filter(e => e.id !== id))
      return true
    } catch (e: any) {
      setError(e.message || 'Error deleting event')
      console.error('Error deleting event:', e)
      return false
    }
  }

  const moveEvent = async (id: string, newStartTime: string, newEndTime: string): Promise<boolean> => {
    const result = await updateEvent(id, { start_time: newStartTime, end_time: newEndTime })
    return result !== null
  }

  useEffect(() => {
    if (autoFetch) {
      fetchEvents()
    }
  }, [autoFetch, fetchEvents])

  // Convert DB events to legacy format for UI
  const events: CalendarEvent[] = dbEvents.map(convertToLegacy)

  return {
    events,
    dbEvents,
    loading,
    error,
    fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    moveEvent,
    refetch: fetchEvents
  }
}
