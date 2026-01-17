import { NextResponse } from 'next/server'
import { mockDataStore, mockOrganization, mockCurrentUser } from '@/src/data/mock-data'

export async function GET(request: Request) {
  try {
    // Parse URL parameters
    const url = new URL(request.url)
    const status = url.searchParams.get('status') // all, active, pending, inactive
    const search = url.searchParams.get('search') // search query
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100)
    const offset = parseInt(url.searchParams.get('offset') || '0')

    let staffList = [...mockDataStore.staff]

    // Apply status filter
    if (status && status !== 'all') {
      staffList = staffList.filter(s => s.status === status)
    }

    // Apply search filter
    if (search) {
      const query = search.toLowerCase()
      staffList = staffList.filter(s => 
        s.full_name.toLowerCase().includes(query) ||
        s.email.toLowerCase().includes(query)
      )
    }

    // Sort by invited_at descending
    staffList.sort((a, b) => new Date(b.invited_at).getTime() - new Date(a.invited_at).getTime())

    const totalStaff = staffList.length

    // Apply pagination
    const paginatedStaff = staffList.slice(offset, offset + limit)

    // Transform the data for response
    const staff = paginatedStaff.map((member) => ({
      id: member.id,
      email: member.email,
      full_name: member.full_name,
      phone: member.phone,
      role: member.role,
      specialties: member.specialties || [],
      status: member.status,
      organization: {
        id: mockOrganization.id,
        name: mockOrganization.name,
        slug: mockOrganization.slug
      },
      user_id: member.user_id,
      invited_at: member.invited_at,
      activated_at: member.activated_at,
      first_login_completed: member.first_login_completed,
      created_at: member.created_at,
      updated_at: member.updated_at,
      has_account: !!member.user_id,
      is_self: member.user_id === mockCurrentUser.id,
      avatar: member.avatar,
    }))

    // Calculate summary statistics
    const allStaff = mockDataStore.staff
    const activeCount = allStaff.filter(s => s.status === 'active').length
    const pendingCount = allStaff.filter(s => s.status === 'pending').length
    const inactiveCount = allStaff.filter(s => s.status === 'inactive').length

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
        total: allStaff.length,
        active: activeCount,
        pending: pendingCount,
        inactive: inactiveCount
      },
      permissions: {
        can_invite: true,
        can_manage: true,
        user_role: mockCurrentUser.role
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
