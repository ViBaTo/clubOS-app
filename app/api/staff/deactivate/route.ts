import { NextResponse } from 'next/server'
import { getSupabaseRouteClientWithAuth, getSupabaseAdminClient } from '@/app/lib/supabaseServer'

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseRouteClientWithAuth(request)
    const adminClient = getSupabaseAdminClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's organization and verify permissions
    const { data: orgUser, error: orgError } = await supabase
      .from('organization_users')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .single()

    if (orgError || !orgUser) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // Check if user has permission to manage staff (admin or owner)
    if (!['owner', 'admin'].includes(orgUser.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Parse request body
    const body = await request.json()
    const { staffId } = body

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

    // Check if staff member is active
    if (staffRecord.status !== 'active') {
      return NextResponse.json({ 
        error: 'Can only deactivate active staff members' 
      }, { status: 400 })
    }

    // Prevent self-deactivation
    if (staffRecord.user_id === user.id) {
      return NextResponse.json({ 
        error: 'You cannot deactivate yourself' 
      }, { status: 400 })
    }

    // Update staff status to inactive
    const { error: updateError } = await adminClient
      .from('club_staff')
      .update({
        status: 'inactive',
        updated_at: new Date().toISOString()
      })
      .eq('id', staffId)

    if (updateError) {
      return NextResponse.json({ 
        error: `Failed to deactivate staff member: ${updateError.message}` 
      }, { status: 500 })
    }

    // Remove from organization_users table to revoke access
    if (staffRecord.user_id) {
      const { error: removeAccessError } = await adminClient
        .from('organization_users')
        .delete()
        .eq('user_id', staffRecord.user_id)
        .eq('organization_id', orgUser.organization_id)

      if (removeAccessError) {
        console.error('Failed to remove organization access:', removeAccessError)
        // Don't fail the request, but log the error
        // The staff is still deactivated even if org access removal failed
      }
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: `${staffRecord.full_name} has been deactivated and access revoked`,
      deactivated_staff: {
        id: staffRecord.id,
        email: staffRecord.email,
        full_name: staffRecord.full_name,
        role: staffRecord.role,
        previous_status: 'active',
        new_status: 'inactive',
        deactivated_at: new Date().toISOString()
      }
    })

  } catch (error: any) {
    console.error('Deactivate staff error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}