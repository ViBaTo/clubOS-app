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
      .select(`
        id, 
        email, 
        full_name, 
        role, 
        status, 
        organization_id, 
        user_id,
        specialties,
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

    // Check if staff member is inactive
    if (staffRecord.status !== 'inactive') {
      return NextResponse.json({ 
        error: 'Can only reactivate inactive staff members' 
      }, { status: 400 })
    }

    let responseMessage = ''
    let statusUpdate: 'active' | 'pending' = 'active'

    // Check if the staff member has a user account
    if (staffRecord.user_id) {
      // User has already signed up, just reactivate
      
      // Update staff status to active
      const { error: updateError } = await adminClient
        .from('club_staff')
        .update({
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', staffId)

      if (updateError) {
        return NextResponse.json({ 
          error: `Failed to reactivate staff member: ${updateError.message}` 
        }, { status: 500 })
      }

      // Restore organization access
      const roleMapping = {
        'gestor': 'owner' as const,
        'admin': 'admin' as const, 
        'profesor': 'staff' as const
      }

      const { error: restoreAccessError } = await adminClient
        .from('organization_users')
        .upsert({
          organization_id: orgUser.organization_id,
          user_id: staffRecord.user_id,
          role: roleMapping[staffRecord.role as keyof typeof roleMapping],
          created_at: new Date().toISOString()
        })

      if (restoreAccessError) {
        console.error('Failed to restore organization access:', restoreAccessError)
        // Don't fail the request, but the user might need to login again
      }

      responseMessage = `${staffRecord.full_name} has been reactivated and access restored`
      
    } else {
      // User never signed up, send new invitation
      statusUpdate = 'pending'

      // Get inviter's name  
      const inviterName = user.email?.split('@')[0] || 'Team Admin'

      // Prepare invitation metadata
      const inviteMetadata = {
        organization_id: orgUser.organization_id,
        organization_name: (staffRecord.organizations as any).name,
        organization_slug: (staffRecord.organizations as any).slug,
        role: staffRecord.role,
        invited_by_name: inviterName,
        invited_by_email: user.email,
        full_name: staffRecord.full_name,
        welcome_message: 'Your account has been reactivated. Please complete your signup.'
      }

      // Get app URL from environment
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

      // Send new invitation using Supabase Auth
      const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
        staffRecord.email,
        {
          redirectTo: `${appUrl}/auth/callback`,
          data: inviteMetadata
        }
      )

      if (inviteError) {
        return NextResponse.json({ 
          error: `Failed to send reactivation invitation: ${inviteError.message}` 
        }, { status: 500 })
      }

      // Update staff status to pending and reset invitation timestamp
      const { error: updateError } = await adminClient
        .from('club_staff')
        .update({
          status: 'pending',
          invited_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', staffId)

      if (updateError) {
        return NextResponse.json({ 
          error: `Failed to update staff record: ${updateError.message}` 
        }, { status: 500 })
      }

      responseMessage = `Reactivation invitation sent to ${staffRecord.email}`
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: responseMessage,
      reactivated_staff: {
        id: staffRecord.id,
        email: staffRecord.email,
        full_name: staffRecord.full_name,
        role: staffRecord.role,
        previous_status: 'inactive',
        new_status: statusUpdate,
        reactivated_at: new Date().toISOString(),
        has_account: !!staffRecord.user_id
      }
    })

  } catch (error: any) {
    console.error('Reactivate staff error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}