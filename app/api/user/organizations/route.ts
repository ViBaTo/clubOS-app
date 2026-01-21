import { NextResponse } from 'next/server'
import { getSupabaseRouteClientWithAuth } from '@/app/lib/supabaseServer'

export async function GET(request: Request) {
  try {
    const supabase = getSupabaseRouteClientWithAuth(request)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all organizations the user belongs to
    const { data: orgUsers, error: orgError } = await supabase
      .from('organization_users')
      .select(`
        id,
        role,
        is_primary,
        joined_via,
        created_at,
        organization:organizations(
          id,
          name,
          slug,
          club_type,
          club_logo,
          status,
          access_code
        )
      `)
      .eq('user_id', user.id)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: true })

    if (orgError) {
      console.error('Error fetching organizations:', orgError)
      return NextResponse.json({ error: 'Failed to fetch organizations' }, { status: 500 })
    }

    // Get user profile info
    const userProfile = {
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario',
      avatar_url: user.user_metadata?.avatar_url || null,
      created_at: user.created_at
    }

    // Format organizations
    const organizations = (orgUsers || []).map(ou => ({
      id: ou.organization?.id,
      name: ou.organization?.name,
      slug: ou.organization?.slug,
      club_type: ou.organization?.club_type,
      club_logo: ou.organization?.club_logo,
      status: ou.organization?.status,
      access_code: ou.organization?.access_code,
      role: ou.role,
      is_primary: ou.is_primary,
      joined_via: ou.joined_via,
      joined_at: ou.created_at
    })).filter(org => org.id) // Filter out any null organizations

    return NextResponse.json({
      user: userProfile,
      organizations,
      total: organizations.length
    })

  } catch (error) {
    console.error('Error in user organizations API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Set primary organization
export async function PUT(request: Request) {
  try {
    const supabase = getSupabaseRouteClientWithAuth(request)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { organization_id } = body

    if (!organization_id) {
      return NextResponse.json({ error: 'organization_id is required' }, { status: 400 })
    }

    // First, set all user's organizations to not primary
    await supabase
      .from('organization_users')
      .update({ is_primary: false })
      .eq('user_id', user.id)

    // Then set the selected one as primary
    const { error: updateError } = await supabase
      .from('organization_users')
      .update({ is_primary: true })
      .eq('user_id', user.id)
      .eq('organization_id', organization_id)

    if (updateError) {
      console.error('Error updating primary organization:', updateError)
      return NextResponse.json({ error: 'Failed to update primary organization' }, { status: 500 })
    }

    return NextResponse.json({ success: true, organization_id })

  } catch (error) {
    console.error('Error in update primary organization:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
