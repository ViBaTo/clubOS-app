"use client"

import { useState, useEffect, useCallback } from 'react'
import { getSupabaseClient } from '@/app/lib/supabaseClient'
import type { Facility, LocationType } from '@/src/types/calendar'

interface UseFacilitiesOptions {
  activeOnly?: boolean
  sport?: string
  locationType?: LocationType
  autoFetch?: boolean
}

interface CreateFacilityData {
  name: string
  sport: string
  facility_type?: string
  capacity?: number
  location_type?: LocationType
  attributes?: Record<string, any>
  is_active?: boolean
}

interface UseFacilitiesReturn {
  facilities: Facility[]
  loading: boolean
  error: string | null
  fetchFacilities: () => Promise<void>
  createFacility: (data: CreateFacilityData) => Promise<Facility | null>
  updateFacility: (id: string, data: Partial<CreateFacilityData>) => Promise<Facility | null>
  deleteFacility: (id: string) => Promise<boolean>
  checkAvailability: (facilityId: string, startTime: string, endTime: string) => Promise<boolean>
  getFacilitySchedule: (facilityId: string, startDate: string, endDate: string) => Promise<any[]>
  refetch: () => Promise<void>
}

export function useFacilities(options: UseFacilitiesOptions = {}): UseFacilitiesReturn {
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { activeOnly = true, sport, locationType, autoFetch = true } = options

  const fetchFacilities = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const supabase = getSupabaseClient()
      const session = (await supabase.auth.getSession()).data.session
      const token = session?.access_token

      const params = new URLSearchParams()
      if (activeOnly) params.append('active', 'true')
      if (sport) params.append('sport', sport)
      if (locationType) params.append('location_type', locationType)

      const url = `/api/facilities${params.toString() ? '?' + params.toString() : ''}`
      
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || 'Failed to fetch facilities')
      }

      setFacilities(json.facilities || [])
    } catch (e: any) {
      setError(e.message || 'Error fetching facilities')
      console.error('Error fetching facilities:', e)
    } finally {
      setLoading(false)
    }
  }, [activeOnly, sport, locationType])

  const createFacility = async (data: CreateFacilityData): Promise<Facility | null> => {
    try {
      const supabase = getSupabaseClient()
      const session = (await supabase.auth.getSession()).data.session
      const token = session?.access_token

      const res = await fetch('/api/facilities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(data)
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || 'Failed to create facility')
      }

      setFacilities(prev => [...prev, json.facility])
      return json.facility
    } catch (e: any) {
      setError(e.message || 'Error creating facility')
      console.error('Error creating facility:', e)
      return null
    }
  }

  const updateFacility = async (id: string, data: Partial<CreateFacilityData>): Promise<Facility | null> => {
    try {
      const supabase = getSupabaseClient()
      const session = (await supabase.auth.getSession()).data.session
      const token = session?.access_token

      const res = await fetch(`/api/facilities/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(data)
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || 'Failed to update facility')
      }

      setFacilities(prev => prev.map(f => f.id === id ? json.facility : f))
      return json.facility
    } catch (e: any) {
      setError(e.message || 'Error updating facility')
      console.error('Error updating facility:', e)
      return null
    }
  }

  const deleteFacility = async (id: string): Promise<boolean> => {
    try {
      const supabase = getSupabaseClient()
      const session = (await supabase.auth.getSession()).data.session
      const token = session?.access_token

      const res = await fetch(`/api/facilities/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      })

      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error || 'Failed to delete facility')
      }

      setFacilities(prev => prev.filter(f => f.id !== id))
      return true
    } catch (e: any) {
      setError(e.message || 'Error deleting facility')
      console.error('Error deleting facility:', e)
      return false
    }
  }

  const checkAvailability = async (facilityId: string, startTime: string, endTime: string): Promise<boolean> => {
    try {
      const supabase = getSupabaseClient()
      const session = (await supabase.auth.getSession()).data.session
      const token = session?.access_token

      const res = await fetch(`/api/facilities/${facilityId}/availability`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ start_time: startTime, end_time: endTime })
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || 'Failed to check availability')
      }

      return json.available
    } catch (e: any) {
      console.error('Error checking availability:', e)
      return false
    }
  }

  const getFacilitySchedule = async (facilityId: string, startDate: string, endDate: string): Promise<any[]> => {
    try {
      const supabase = getSupabaseClient()
      const session = (await supabase.auth.getSession()).data.session
      const token = session?.access_token

      const params = new URLSearchParams({ start_date: startDate, end_date: endDate })
      const url = `/api/facilities/${facilityId}/availability?${params.toString()}`

      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || 'Failed to get schedule')
      }

      return json.schedule || []
    } catch (e: any) {
      console.error('Error getting facility schedule:', e)
      return []
    }
  }

  useEffect(() => {
    if (autoFetch) {
      fetchFacilities()
    }
  }, [autoFetch, fetchFacilities])

  return {
    facilities,
    loading,
    error,
    fetchFacilities,
    createFacility,
    updateFacility,
    deleteFacility,
    checkAvailability,
    getFacilitySchedule,
    refetch: fetchFacilities
  }
}
