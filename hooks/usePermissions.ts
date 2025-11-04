'use client'

import { useState, useEffect } from 'react'
import { getSupabaseClient } from '@/app/lib/supabaseClient'

interface UserPermissions {
  // Staff management permissions
  canInviteStaff: boolean
  canManageStaff: boolean
  canViewAllStaff: boolean
  canEditStaffRoles: boolean
  
  // Organization permissions
  isOwner: boolean
  isAdmin: boolean
  isStaff: boolean
  
  // General permissions
  canManageOrganization: boolean
  canViewAnalytics: boolean
  canManageMembers: boolean
  
  // User info
  userId: string | null
  userRole: 'owner' | 'admin' | 'staff' | null
  organizationId: string | null
}

interface UsePermissionsReturn extends UserPermissions {
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function usePermissions(): UsePermissionsReturn {
  const [permissions, setPermissions] = useState<UserPermissions>({
    canInviteStaff: false,
    canManageStaff: false,
    canViewAllStaff: false,
    canEditStaffRoles: false,
    isOwner: false,
    isAdmin: false,
    isStaff: false,
    canManageOrganization: false,
    canViewAnalytics: false,
    canManageMembers: false,
    userId: null,
    userRole: null,
    organizationId: null
  })
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPermissions = async () => {
    try {
      setLoading(true)
      setError(null)

      const supabase = getSupabaseClient()
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        setPermissions(prev => ({ ...prev, userId: null, userRole: null }))
        return
      }

      // Get user's organization role
      const { data: orgUser, error: orgError } = await supabase
        .from('organization_users')
        .select('organization_id, role, is_primary')
        .eq('user_id', user.id)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(1)
        .single()

      if (orgError || !orgUser) {
        // User not part of any organization
        setPermissions(prev => ({
          ...prev,
          userId: user.id,
          userRole: null,
          organizationId: null
        }))
        return
      }

      const role = orgUser.role as 'owner' | 'admin' | 'staff'
      
      // Calculate permissions based on role
      const isOwner = role === 'owner'
      const isAdmin = role === 'admin'
      const isStaff = role === 'staff'

      const newPermissions: UserPermissions = {
        // Staff management permissions
        canInviteStaff: isOwner || isAdmin,
        canManageStaff: isOwner || isAdmin,
        canViewAllStaff: isOwner || isAdmin,
        canEditStaffRoles: isOwner || isAdmin,
        
        // Organization permissions  
        isOwner,
        isAdmin,
        isStaff,
        
        // General permissions
        canManageOrganization: isOwner,
        canViewAnalytics: isOwner || isAdmin,
        canManageMembers: isOwner || isAdmin,
        
        // User info
        userId: user.id,
        userRole: role,
        organizationId: orgUser.organization_id
      }

      setPermissions(newPermissions)

    } catch (err: any) {
      console.error('Failed to fetch permissions:', err)
      setError(err.message || 'Failed to load permissions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPermissions()
  }, [])

  return {
    ...permissions,
    loading,
    error,
    refresh: fetchPermissions
  }
}

// Hook for checking specific permissions
export function useHasPermission(permission: keyof UserPermissions): boolean {
  const permissions = usePermissions()
  return permissions[permission] as boolean
}

// Hook for role checking
export function useUserRole(): {
  role: 'owner' | 'admin' | 'staff' | null
  isOwner: boolean
  isAdmin: boolean
  isStaff: boolean
  loading: boolean
} {
  const { userRole, isOwner, isAdmin, isStaff, loading } = usePermissions()
  
  return {
    role: userRole,
    isOwner,
    isAdmin, 
    isStaff,
    loading
  }
}