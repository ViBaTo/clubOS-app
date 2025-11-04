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

    // Check if user has permission to invite (admin or owner)
    if (!['owner', 'admin'].includes(orgUser.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Parse request body
    const body = await request.json()
    const { fullName, email, role, phone, specialties, welcomeMessage } = body

    // Validate required fields
    if (!fullName || !email || !role) {
      return NextResponse.json({ 
        error: 'Missing required fields: fullName, email, role' 
      }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // Validate role
    if (!['gestor', 'admin', 'profesor'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Check if email already exists in this organization
    const { data: existingStaff, error: checkError } = await adminClient
      .from('club_staff')
      .select('id, email, status')
      .eq('organization_id', orgUser.organization_id)
      .eq('email', email.toLowerCase())
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (existingStaff) {
      return NextResponse.json({ 
        error: 'This email is already associated with a team member in your organization' 
      }, { status: 409 })
    }

    // Get organization details for invitation
    const { data: organization, error: orgDetailsError } = await adminClient
      .from('organizations')
      .select('name, slug')
      .eq('id', orgUser.organization_id)
      .single()

    if (orgDetailsError || !organization) {
      return NextResponse.json({ error: 'Organization details not found' }, { status: 404 })
    }

    // Get inviter's name (fallback to email prefix if no profiles table)
    const inviterName = user.email?.split('@')[0] || 'Team Admin'

    // Create staff record
    const { data: staffRecord, error: staffError } = await adminClient
      .from('club_staff')
      .insert({
        organization_id: orgUser.organization_id,
        email: email.toLowerCase(),
        full_name: fullName,
        phone: phone || null,
        role: role,
        specialties: specialties || [],
        status: 'pending',
        added_by: user.id,
        invited_at: new Date().toISOString()
      })
      .select('*')
      .single()

    if (staffError) {
      console.error('Staff record creation error:', {
        message: staffError.message,
        code: staffError.code,
        details: staffError.details,
        hint: staffError.hint
      })
      // Check if table doesn't exist
      if (staffError.message.includes('does not exist') || staffError.code === '42P01') {
        return NextResponse.json({ 
          error: 'Staff management system not set up. Please run database migration.',
          code: 'MIGRATION_REQUIRED',
          migration_file: '002_add_club_staff_table.sql'
        }, { status: 400 })
      }
      return NextResponse.json({ 
        error: `Failed to create staff record: ${staffError.message}` 
      }, { status: 500 })
    }

    // Prepare invitation metadata
    const inviteMetadata = {
      organization_id: orgUser.organization_id,
      organization_name: organization.name,
      organization_slug: organization.slug,
      role: role,
      invited_by_name: inviterName,
      invited_by_email: user.email,
      full_name: fullName,
      welcome_message: welcomeMessage || null
    }

    // Get app URL from environment
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Send invitation using Supabase Auth
    const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
      email,
      {
        redirectTo: `${appUrl}/auth/callback`,
        data: inviteMetadata
      }
    )

    if (inviteError) {
      console.error('Supabase invitation error:', {
        message: inviteError.message,
        status: inviteError.status,
        statusText: inviteError.statusText,
        error: inviteError
      })
      // If invitation fails, clean up the staff record
      await adminClient
        .from('club_staff')
        .delete()
        .eq('id', staffRecord.id)

      return NextResponse.json({ 
        error: `Failed to send invitation: ${inviteError.message}` 
      }, { status: 500 })
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: `Invitation sent successfully to ${email}`,
      staff: {
        id: staffRecord.id,
        email: staffRecord.email,
        full_name: staffRecord.full_name,
        role: staffRecord.role,
        status: staffRecord.status,
        invited_at: staffRecord.invited_at
      },
      invitation: {
        user: inviteData.user,
        sent_at: new Date().toISOString()
      }
    })

  } catch (error: any) {
    console.error('Staff invitation error:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      details: error.details
    })
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}