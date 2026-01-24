import { NextResponse } from 'next/server'
import { getSupabaseRouteClientWithAuth, getSupabaseAdminClient } from '@/app/lib/supabaseServer'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabaseRouteClientWithAuth(request)
    const adminClient = getSupabaseAdminClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's primary organization
    const { data: orgUsers, error: orgError } = await supabase
      .from('organization_users')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .order('is_primary', { ascending: false })
      .limit(1)

    if (orgError || !orgUsers || orgUsers.length === 0) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }
    
    const orgUser = orgUsers[0]
    const { id: staffId } = await params

    if (!staffId) {
      return NextResponse.json({ error: 'Staff ID is required' }, { status: 400 })
    }

    // Get staff record
    const { data: staffRecord, error: staffError } = await adminClient
      .from('club_staff')
      .select(`
        id,
        email,
        full_name,
        phone,
        role,
        specialties,
        status,
        organization_id,
        user_id,
        invited_at,
        activated_at,
        first_login_completed,
        created_at,
        updated_at,
        organizations!inner (
          name,
          slug
        )
      `)
      .eq('id', staffId)
      .eq('organization_id', orgUser.organization_id)
      .single()

    if (staffError || !staffRecord) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 })
    }

    // Check if user can view this staff member
    const isSelf = staffRecord.user_id === user.id
    const canViewAll = ['owner', 'admin'].includes(orgUser.role)

    if (!isSelf && !canViewAll) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Return staff details
    return NextResponse.json({
      success: true,
      staff: {
        id: staffRecord.id,
        email: staffRecord.email,
        full_name: staffRecord.full_name,
        phone: staffRecord.phone,
        role: staffRecord.role,
        specialties: staffRecord.specialties || [],
        status: staffRecord.status,
        organization: {
          id: staffRecord.organization_id,
          name: (staffRecord.organizations as any).name,
          slug: (staffRecord.organizations as any).slug
        },
        user_id: staffRecord.user_id,
        invited_at: staffRecord.invited_at,
        activated_at: staffRecord.activated_at,
        first_login_completed: staffRecord.first_login_completed,
        created_at: staffRecord.created_at,
        updated_at: staffRecord.updated_at,
        has_account: !!staffRecord.user_id,
        is_self: isSelf
      },
      permissions: {
        can_edit_basic: isSelf || canViewAll,
        can_change_role: canViewAll,
        can_deactivate: canViewAll && !isSelf,
        can_delete: canViewAll && !isSelf
      }
    })

  } catch (error: any) {
    console.error('Get staff details error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabaseRouteClientWithAuth(request)
    const adminClient = getSupabaseAdminClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's primary organization
    const { data: orgUsers, error: orgError } = await supabase
      .from('organization_users')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .order('is_primary', { ascending: false })
      .limit(1)

    if (orgError || !orgUsers || orgUsers.length === 0) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }
    
    const orgUser = orgUsers[0]

    // Check if user has permission to delete staff (admin or owner)
    if (!['owner', 'admin'].includes(orgUser.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { id: staffId } = await params

    if (!staffId) {
      return NextResponse.json({ error: 'Staff ID is required' }, { status: 400 })
    }

    // Get staff record
    const { data: staffRecord, error: staffError } = await adminClient
      .from('club_staff')
      .select('id, email, full_name, role, status, organization_id, user_id')
      .eq('id', staffId)
      .eq('organization_id', orgUser.organization_id)
      .single()

    if (staffError || !staffRecord) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 })
    }

    // Prevent self-deletion
    if (staffRecord.user_id === user.id) {
      return NextResponse.json({ 
        error: 'You cannot delete yourself' 
      }, { status: 400 })
    }

    // Remove from organization_users table first (if exists) to revoke access
    if (staffRecord.user_id) {
      const { error: removeAccessError } = await adminClient
        .from('organization_users')
        .delete()
        .eq('user_id', staffRecord.user_id)
        .eq('organization_id', orgUser.organization_id)

      if (removeAccessError) {
        console.error('Failed to remove organization access:', removeAccessError)
        // Continue with deletion even if org access removal failed
      }
    }

    // Delete the staff record (works for any status: pending, active, or inactive)
    const { error: deleteError } = await adminClient
      .from('club_staff')
      .delete()
      .eq('id', staffId)
      .eq('organization_id', orgUser.organization_id)

    if (deleteError) {
      return NextResponse.json({ 
        error: `Failed to delete staff member: ${deleteError.message}` 
      }, { status: 500 })
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: `${staffRecord.full_name} has been permanently deleted from your team. You can re-invite them if needed.`,
      deleted_staff: {
        id: staffRecord.id,
        email: staffRecord.email,
        full_name: staffRecord.full_name,
        role: staffRecord.role,
        status: staffRecord.status,
        deleted_at: new Date().toISOString()
      }
    })

  } catch (error: any) {
    console.error('Delete staff error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}