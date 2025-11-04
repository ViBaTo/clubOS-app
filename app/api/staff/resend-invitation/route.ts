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
        specialties,
        organization_id,
        status,
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

    // Check if staff member is in pending status
    if (staffRecord.status !== 'pending') {
      return NextResponse.json({ 
        error: 'Can only resend invitations for pending staff members' 
      }, { status: 400 })
    }

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
      welcome_message: 'Your invitation has been resent'
    }

    // Get app URL from environment
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Resend invitation using Supabase Auth
    const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
      staffRecord.email,
      {
        redirectTo: `${appUrl}/auth/callback`,
        data: inviteMetadata
      }
    )

    if (inviteError) {
      if (
        inviteError.status === 422 ||
        inviteError.message?.includes('already been registered')
      ) {
        return NextResponse.json({
          error: 'This user already has an account. Ask them to log in or reset their password instead of resending the invite.'
        }, { status: 409 })
      }
      return NextResponse.json({ 
        error: `Failed to resend invitation: ${inviteError.message}` 
      }, { status: 500 })
    }

    // Update the invited_at timestamp
    const { error: updateError } = await adminClient
      .from('club_staff')
      .update({
        invited_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', staffId)

    if (updateError) {
      console.error('Failed to update invitation timestamp:', updateError)
      // Don't fail the request since the invitation was sent
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: `Invitation resent successfully to ${staffRecord.email}`,
      staff: {
        id: staffRecord.id,
        email: staffRecord.email,
        full_name: staffRecord.full_name,
        role: staffRecord.role,
        status: staffRecord.status,
        invited_at: new Date().toISOString()
      },
      invitation: {
        user: inviteData.user,
        sent_at: new Date().toISOString()
      }
    })

  } catch (error: any) {
    console.error('Resend invitation error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}