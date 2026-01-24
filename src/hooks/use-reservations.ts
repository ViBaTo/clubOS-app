"use client"

import { useState, useEffect, useCallback } from 'react'
import { getSupabaseClient } from '@/app/lib/supabaseClient'
import type { ReservationDB, ReservationStatus, CreateReservationRequest } from '@/src/types/calendar'

interface UseReservationsOptions {
  startDate?: string
  endDate?: string
  facilityId?: string
  clientId?: string
  status?: ReservationStatus
  autoFetch?: boolean
}

interface UseReservationsReturn {
  reservations: ReservationDB[]
  loading: boolean
  error: string | null
  fetchReservations: () => Promise<void>
  createReservation: (data: CreateReservationRequest) => Promise<ReservationDB | null>
  updateReservation: (id: string, data: Partial<CreateReservationRequest & { status?: ReservationStatus }>) => Promise<ReservationDB | null>
  cancelReservation: (id: string, reason?: string) => Promise<boolean>
  deleteReservation: (id: string) => Promise<boolean>
  confirmReservation: (id: string) => Promise<ReservationDB | null>
  refetch: () => Promise<void>
}

export function useReservations(options: UseReservationsOptions = {}): UseReservationsReturn {
  const [reservations, setReservations] = useState<ReservationDB[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { startDate, endDate, facilityId, clientId, status, autoFetch = true } = options

  const fetchReservations = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const supabase = getSupabaseClient()
      const session = (await supabase.auth.getSession()).data.session
      const token = session?.access_token

      const params = new URLSearchParams()
      if (startDate) params.append('start_date', startDate)
      if (endDate) params.append('end_date', endDate)
      if (facilityId) params.append('facility_id', facilityId)
      if (clientId) params.append('client_id', clientId)
      if (status) params.append('status', status)

      const url = `/api/reservations${params.toString() ? '?' + params.toString() : ''}`
      
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || 'Failed to fetch reservations')
      }

      setReservations(json.reservations || [])
    } catch (e: any) {
      setError(e.message || 'Error fetching reservations')
      console.error('Error fetching reservations:', e)
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate, facilityId, clientId, status])

  const createReservation = async (data: CreateReservationRequest): Promise<ReservationDB | null> => {
    try {
      const supabase = getSupabaseClient()
      const session = (await supabase.auth.getSession()).data.session
      const token = session?.access_token

      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(data)
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || 'Failed to create reservation')
      }

      setReservations(prev => [...prev, json.reservation])
      return json.reservation
    } catch (e: any) {
      setError(e.message || 'Error creating reservation')
      console.error('Error creating reservation:', e)
      return null
    }
  }

  const updateReservation = async (
    id: string, 
    data: Partial<CreateReservationRequest & { status?: ReservationStatus }>
  ): Promise<ReservationDB | null> => {
    try {
      const supabase = getSupabaseClient()
      const session = (await supabase.auth.getSession()).data.session
      const token = session?.access_token

      const res = await fetch(`/api/reservations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(data)
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || 'Failed to update reservation')
      }

      setReservations(prev => prev.map(r => r.id === id ? json.reservation : r))
      return json.reservation
    } catch (e: any) {
      setError(e.message || 'Error updating reservation')
      console.error('Error updating reservation:', e)
      return null
    }
  }

  const cancelReservation = async (id: string, reason?: string): Promise<boolean> => {
    try {
      const supabase = getSupabaseClient()
      const session = (await supabase.auth.getSession()).data.session
      const token = session?.access_token

      const res = await fetch(`/api/reservations/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ cancellation_reason: reason })
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || 'Failed to cancel reservation')
      }

      setReservations(prev => prev.map(r => r.id === id ? json.reservation : r))
      return true
    } catch (e: any) {
      setError(e.message || 'Error cancelling reservation')
      console.error('Error cancelling reservation:', e)
      return false
    }
  }

  const deleteReservation = async (id: string): Promise<boolean> => {
    try {
      const supabase = getSupabaseClient()
      const session = (await supabase.auth.getSession()).data.session
      const token = session?.access_token

      const res = await fetch(`/api/reservations/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      })

      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error || 'Failed to delete reservation')
      }

      setReservations(prev => prev.filter(r => r.id !== id))
      return true
    } catch (e: any) {
      setError(e.message || 'Error deleting reservation')
      console.error('Error deleting reservation:', e)
      return false
    }
  }

  const confirmReservation = async (id: string): Promise<ReservationDB | null> => {
    return updateReservation(id, { status: 'confirmed' })
  }

  useEffect(() => {
    if (autoFetch) {
      fetchReservations()
    }
  }, [autoFetch, fetchReservations])

  return {
    reservations,
    loading,
    error,
    fetchReservations,
    createReservation,
    updateReservation,
    cancelReservation,
    deleteReservation,
    confirmReservation,
    refetch: fetchReservations
  }
}
