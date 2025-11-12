'use client'

import { useState, useEffect, useCallback } from 'react'
import { getSupabaseClient } from '@/app/lib/supabaseClient'

interface StaffInfo {
  id: string
  full_name: string
  role: 'gestor' | 'admin' | 'profesor'
  specialties: string[]
  organization_name: string
  activated_at: string
  first_login_completed: boolean
  password_set_during_onboarding: boolean
}

interface UseNewStaffWelcomeReturn {
  shouldShowWelcome: boolean
  staffInfo: StaffInfo | null
  loading: boolean
  markWelcomeCompleted: () => Promise<void>
  requiresPasswordSetup: boolean
  submitPassword: (password: string) => Promise<void>
}

export function useNewStaffWelcome(): UseNewStaffWelcomeReturn {
  const [shouldShowWelcome, setShouldShowWelcome] = useState(false)
  const [staffInfo, setStaffInfo] = useState<StaffInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [requiresPasswordSetup, setRequiresPasswordSetup] = useState(false)

  useEffect(() => {
    checkNewStaffStatus()
  }, [])

  const checkNewStaffStatus = async () => {
    try {
      const supabase = getSupabaseClient()

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        setLoading(false)
        return
      }

      // Check if user is a staff member
      const { data: staffData, error: staffError } = await supabase
        .from('club_staff')
        .select(`
          id,
          full_name,
          role,
          specialties,
          activated_at,
          first_login_completed,
          password_set_during_onboarding,
          organization_id,
          organizations!inner (
            name
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      if (staffError || !staffData) {
        // User is not a staff member or query failed
        setLoading(false)
        return
      }

      const info: StaffInfo = {
        id: staffData.id,
        full_name: staffData.full_name,
        role: staffData.role,
        specialties: staffData.specialties || [],
        organization_name: (staffData.organizations as any)?.name || 'Your Club',
        activated_at: staffData.activated_at,
        first_login_completed: staffData.first_login_completed || false,
        password_set_during_onboarding: staffData.password_set_during_onboarding || false
      }

      setStaffInfo(info)

      // Determine if password setup is needed
      // Use the explicit password_set_during_onboarding field for reliability
      const needsPassword = !info.password_set_during_onboarding
      setRequiresPasswordSetup(needsPassword)

      // Show welcome if:
      // 1. Password hasn't been set during onboarding (critical requirement)
      // 2. OR first_login_completed is false (haven't finished onboarding)
      const shouldShow = needsPassword || !info.first_login_completed

      setShouldShowWelcome(shouldShow)

      console.log('Staff welcome check:', {
        userId: user.id,
        email: user.email,
        needsPassword,
        firstLoginCompleted: info.first_login_completed,
        passwordSetDuringOnboarding: info.password_set_during_onboarding,
        shouldShow
      })

    } catch (error) {
      console.error('Error checking new staff status:', error)
    } finally {
      setLoading(false)
    }
  }

  const submitPassword = useCallback(async (password: string) => {
    if (!staffInfo) {
      throw new Error('No staff info available')
    }

    const supabase = getSupabaseClient()

    // Update password in Supabase Auth
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      console.error('Failed to update password:', error)
      throw new Error(error.message)
    }

    // Mark password as set in the database
    const { error: updateError } = await supabase
      .from('club_staff')
      .update({
        password_set_during_onboarding: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', staffInfo.id)

    if (updateError) {
      console.error('Failed to update password flag:', updateError)
      // Don't throw here - password was set successfully in auth
      // This is just a tracking field
    }

    console.log('Password updated successfully')
    setRequiresPasswordSetup(false)
    setStaffInfo(prev => prev ? { ...prev, password_set_during_onboarding: true } : null)
  }, [staffInfo])

  const markWelcomeCompleted = async () => {
    if (!staffInfo) return

    if (requiresPasswordSetup) {
      throw new Error('Password setup is required before completing onboarding')
    }

    try {
      const supabase = getSupabaseClient()
      
      // Mark first login as completed
      const { error } = await supabase
        .from('club_staff')
        .update({ 
          first_login_completed: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', staffInfo.id)

      if (!error) {
        setShouldShowWelcome(false)
        setStaffInfo(prev => prev ? { ...prev, first_login_completed: true } : null)
      }
    } catch (error) {
      console.error('Error marking welcome completed:', error)
    }
  }

  return {
    shouldShowWelcome,
    staffInfo,
    loading,
    markWelcomeCompleted,
    requiresPasswordSetup,
    submitPassword
  }
}