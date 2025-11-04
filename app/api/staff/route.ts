import { NextResponse } from 'next/server'
import { getSupabaseRouteClientWithAuth, getSupabaseAdminClient } from '@/app/lib/supabaseServer'

export async function GET(request: Request) {
  try {
    const supabase = getSupabaseRouteClientWithAuth(request)
    const adminClient = getSupabaseAdminClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.log('Staff API Auth Error:', { userError: userError?.message, hasUser: !!user })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's organization
    const { data: orgUser, error: orgError } = await supabase
      .from('organization_users')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .single()

    if (orgError || !orgUser) {
      console.log('Staff API Org Error:', { 
        userId: user.id, 
        orgError: orgError?.message, 
        hasOrgUser: !!orgUser 
      })
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // Parse URL parameters
    const url = new URL(request.url)
    const status = url.searchParams.get('status') // all, active, pending, inactive
    const search = url.searchParams.get('search') // search query
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100)
    const offset = parseInt(url.searchParams.get('offset') || '0')

    // Build query
    let query = adminClient
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
      .eq('organization_id', orgUser.organization_id)
      .order('invited_at', { ascending: false })

    // Apply status filter
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    // Apply search filter
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: staffData, error: staffError } = await query

    if (staffError) {
      // Check if table doesn't exist
      if (staffError.message.includes('does not exist') || staffError.code === '42P01') {
        return NextResponse.json({ 
          error: 'Staff management system not set up. Please run database migration.',
          code: 'MIGRATION_REQUIRED',
          migration_file: '002_add_club_staff_table.sql'
        }, { status: 400 })
      }
      return NextResponse.json({ 
        error: `Failed to fetch staff: ${staffError.message}` 
      }, { status: 500 })
    }

    // Get total count for pagination
    let countQuery = adminClient
      .from('club_staff')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgUser.organization_id)

    if (status && status !== 'all') {
      countQuery = countQuery.eq('status', status)
    }

    if (search) {
      countQuery = countQuery.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      console.error('Failed to get staff count:', countError)
    }

    // Transform the data for response
    const staff = staffData.map((member: any) => ({
      id: member.id,
      email: member.email,
      full_name: member.full_name,
      phone: member.phone,
      role: member.role,
      specialties: member.specialties || [],
      status: member.status,
      organization: {
        id: member.organization_id,
        name: member.organizations.name,
        slug: member.organizations.slug
      },
      user_id: member.user_id,
      invited_at: member.invited_at,
      activated_at: member.activated_at,
      first_login_completed: member.first_login_completed,
      created_at: member.created_at,
      updated_at: member.updated_at,
      has_account: !!member.user_id,
      is_self: member.user_id === user.id
    }))

    // Calculate summary statistics
    const totalStaff = count || 0
    const activeCount = staff.filter(s => s.status === 'active').length
    const pendingCount = staff.filter(s => s.status === 'pending').length
    const inactiveCount = staff.filter(s => s.status === 'inactive').length

    return NextResponse.json({
      success: true,
      staff,
      pagination: {
        total: totalStaff,
        limit,
        offset,
        has_more: totalStaff > offset + limit
      },
      summary: {
        total: totalStaff,
        active: activeCount,
        pending: pendingCount,
        inactive: inactiveCount
      },
      permissions: {
        can_invite: ['owner', 'admin'].includes(orgUser.role),
        can_manage: ['owner', 'admin'].includes(orgUser.role),
        user_role: orgUser.role
      }
    })

  } catch (error: any) {
    console.error('Get staff list error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}