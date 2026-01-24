import { NextResponse } from 'next/server'
import {
  getSupabaseRouteClientWithAuth,
  getSupabaseAdminClient
} from '@/app/lib/supabaseServer'
import { sendInvitationRejectedEmail } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseRouteClientWithAuth(request)
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { invitationId, reason } = await request.json()

    if (!invitationId) {
      return NextResponse.json(
        { error: 'Invitation ID is required' },
        { status: 400 }
      )
    }

    const admin = getSupabaseAdminClient()

    // Get invitation details
    const { data: invitation, error: invitationError } = await admin
      .from('invitations')
      .select(`
        id,
        organization_id,
        email,
        role,
        status,
        data,
        organizations!inner (
          id,
          name
        )
      `)
      .eq('id', invitationId)
      .single()

    if (invitationError || !invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      )
    }

    // Verify user is admin/owner of the organization
    const { data: membership } = await admin
      .from('organization_users')
      .select('role')
      .eq('organization_id', invitation.organization_id)
      .eq('user_id', user.id)
      .in('role', ['owner', 'admin'])
      .single()

    if (!membership) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Check if invitation is still pending
    if (invitation.status !== 'pending') {
      return NextResponse.json(
        { error: 'Invitation is no longer pending' },
        { status: 400 }
      )
    }

    // Update invitation status to rejected
    const { error: updateError } = await admin
      .from('invitations')
      .update({ 
        status: 'rejected',
        rejected_by: user.id,
        rejected_at: new Date().toISOString(),
        rejection_reason: reason || null
      })
      .eq('id', invitationId)

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 400 }
      )
    }

    // Find the user by email to send notification
    const { data: invitedUsers, error: userError } = await admin.auth.admin.listUsers()
    const targetUser = invitedUsers?.users?.find(
      (u) => u.email?.toLowerCase() === invitation.email.toLowerCase()
    )

    // Create rejection notification for the applicant (if user exists)
    if (targetUser) {
      try {
        const organizationName = (invitation.organizations as any)?.name || 'la organización'
        const rejectionMessage = reason 
          ? `Tu solicitud para unirte a ${organizationName} ha sido rechazada. Motivo: ${reason}`
          : `Tu solicitud para unirte a ${organizationName} ha sido rechazada.`
        
        await admin.from('notifications').insert({
          user_id: targetUser.id,
          organization_id: invitation.organization_id,
          type: 'invitation_rejected',
          title: 'Solicitud rechazada',
          message: rejectionMessage,
          data: {
            invitation_id: invitation.id,
            organization_id: invitation.organization_id,
            organization_name: organizationName,
            rejected_by: user.id,
            rejection_reason: reason,
            role: invitation.role
          }
        })
      } catch (notifError) {
        console.error('Failed to create rejection notification:', notifError)
      }
    }

    // Mark related admin notifications as read
    try {
      await admin
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('type', 'join_request')
        .eq('user_id', user.id)
        .contains('data', { invitation_id: invitation.id })
    } catch (readError) {
      console.error('Failed to mark admin notifications as read:', readError)
    }

    // Send rejection email to applicant (non-blocking)
    try {
      const organizationName = (invitation.organizations as any)?.name || 'la organización'
      
      await sendInvitationRejectedEmail({
        email: invitation.email,
        organizationName,
        organizationId: invitation.organization_id,
        reason: reason || undefined,
        invitationId: invitation.id,
      })
    } catch (emailError) {
      // Don't block the rejection if email fails
      console.error('Failed to send rejection email:', emailError)
    }

    return NextResponse.json({
      success: true,
      message: `Solicitud rechazada. ${invitation.data?.full_name || invitation.email} ha sido notificado.`
    })
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || 'Unexpected error' },
      { status: 500 }
    )
  }
}