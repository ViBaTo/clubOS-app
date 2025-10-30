import { NextResponse } from 'next/server'
import {
  getSupabaseRouteClientWithAuth,
  getSupabaseAdminClient
} from '@/app/lib/supabaseServer'

export async function GET(request: Request) {
  try {
    const supabase = getSupabaseRouteClientWithAuth(request)
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const organizationId = url.searchParams.get('organizationId')
    const limit = parseInt(url.searchParams.get('limit') || '50')

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    const admin = getSupabaseAdminClient()

    // Verify user is admin/owner of the organization
    const { data: membership } = await admin
      .from('organization_users')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .in('role', ['owner', 'admin'])
      .single()

    if (!membership) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Get pending invitations for the organization
    const { data: invitations, error: invitationsError } = await admin
      .from('invitations')
      .select(`
        id,
        email,
        role,
        status,
        created_at,
        expires_at,
        data,
        token
      `)
      .eq('organization_id', organizationId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (invitationsError) {
      return NextResponse.json(
        { error: invitationsError.message },
        { status: 400 }
      )
    }

    // Format the response
    const formattedInvitations = invitations.map(invitation => ({
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      status: invitation.status,
      createdAt: invitation.created_at,
      expiresAt: invitation.expires_at,
      applicantName: invitation.data?.full_name || invitation.email,
      phone: invitation.data?.phone || null,
      message: invitation.data?.message || null,
      accessCode: invitation.data?.access_code || null,
      isExpired: new Date() > new Date(invitation.expires_at)
    }))

    // Get count of all pending invitations
    const { count: totalCount } = await admin
      .from('invitations')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('status', 'pending')

    return NextResponse.json({
      invitations: formattedInvitations,
      totalCount: totalCount || 0,
      hasMore: formattedInvitations.length >= limit
    })
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || 'Unexpected error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseRouteClientWithAuth(request)
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { organizationIds } = await request.json()

    if (!organizationIds || !Array.isArray(organizationIds)) {
      return NextResponse.json(
        { error: 'Organization IDs array is required' },
        { status: 400 }
      )
    }

    const admin = getSupabaseAdminClient()

    // Verify user is admin/owner of all requested organizations
    const { data: memberships } = await admin
      .from('organization_users')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .in('organization_id', organizationIds)
      .in('role', ['owner', 'admin'])

    const validOrgIds = memberships?.map(m => m.organization_id) || []
    
    if (validOrgIds.length === 0) {
      return NextResponse.json({
        invitations: [],
        totalCount: 0
      })
    }

    // Get pending invitations for all valid organizations
    const { data: invitations, error: invitationsError } = await admin
      .from('invitations')
      .select(`
        id,
        organization_id,
        email,
        role,
        status,
        created_at,
        expires_at,
        data,
        organizations!inner (
          id,
          name
        )
      `)
      .in('organization_id', validOrgIds)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(100)

    if (invitationsError) {
      return NextResponse.json(
        { error: invitationsError.message },
        { status: 400 }
      )
    }

    // Format the response
    const formattedInvitations = invitations.map(invitation => ({
      id: invitation.id,
      organizationId: invitation.organization_id,
      organizationName: (invitation.organizations as any)?.name,
      email: invitation.email,
      role: invitation.role,
      status: invitation.status,
      createdAt: invitation.created_at,
      expiresAt: invitation.expires_at,
      applicantName: invitation.data?.full_name || invitation.email,
      phone: invitation.data?.phone || null,
      message: invitation.data?.message || null,
      accessCode: invitation.data?.access_code || null,
      isExpired: new Date() > new Date(invitation.expires_at)
    }))

    // Get total count
    const { count: totalCount } = await admin
      .from('invitations')
      .select('*', { count: 'exact', head: true })
      .in('organization_id', validOrgIds)
      .eq('status', 'pending')

    return NextResponse.json({
      invitations: formattedInvitations,
      totalCount: totalCount || 0
    })
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || 'Unexpected error' },
      { status: 500 }
    )
  }
}