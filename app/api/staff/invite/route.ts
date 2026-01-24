import { NextResponse } from 'next/server'
import { getSupabaseRouteClientWithAuth, getSupabaseAdminClient } from '@/app/lib/supabaseServer'
import { getAppUrl } from '@/lib/utils'

export async function POST(request: Request) {
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

    // Get app URL from environment or request headers
    const appUrl = getAppUrl(request)

    // Check if user already exists in Supabase Auth
    let existingAuthUser: any = null
    try {
      const { data: userData } = await adminClient.auth.admin.getUserByEmail(email)
      existingAuthUser = userData?.user
    } catch (e) {
      // User doesn't exist, which is fine
      console.log('User does not exist in Auth, will create new invitation')
    }
    
    let inviteData: any = null
    let inviteError: any = null

    if (existingAuthUser) {
      // User already exists - update their metadata and add to organization
      console.log('User already exists in Auth, updating metadata and organization access...')
      
      // Update user metadata with invitation info
      const { error: updateError } = await adminClient.auth.admin.updateUserById(
        existingAuthUser.id,
        {
          user_metadata: {
            ...existingAuthUser.user_metadata,
            ...inviteMetadata
          }
        }
      )

      if (updateError) {
        console.error('Failed to update user metadata:', updateError)
      }

      // Add user to organization_users if not already there
      const { data: existingOrgUser } = await adminClient
        .from('organization_users')
        .select('id')
        .eq('user_id', existingAuthUser.id)
        .eq('organization_id', orgUser.organization_id)
        .maybeSingle()

      if (!existingOrgUser) {
        const roleMapping = {
          'gestor': 'owner' as const,
          'admin': 'admin' as const,
          'profesor': 'staff' as const
        }

        await adminClient
          .from('organization_users')
          .insert({
            organization_id: orgUser.organization_id,
            user_id: existingAuthUser.id,
            role: roleMapping[role as keyof typeof roleMapping] || 'staff'
          })
      }

      // Update staff record to link to existing user
      await adminClient
        .from('club_staff')
        .update({
          user_id: existingAuthUser.id,
          status: 'active',
          activated_at: new Date().toISOString()
        })
        .eq('id', staffRecord.id)

      // Generate magic link for existing user
      const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
        type: 'magiclink',
        email: email,
        options: {
          redirectTo: `${appUrl}/auth/callback`
        }
      })

      if (linkError) {
        console.error('Failed to generate magic link:', linkError)
        // Don't fail - the user can still log in normally
      } else {
        inviteData = { user: existingAuthUser, link: linkData }
        console.log('Magic link generated for existing user')
      }
    } else {
      // New user - send invitation using Supabase Auth
      const result = await adminClient.auth.admin.inviteUserByEmail(
        email,
        {
          redirectTo: `${appUrl}/auth/callback`,
          data: inviteMetadata
        }
      )
      inviteData = result.data
      inviteError = result.error

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
    }

    // Return success response
    const isExistingUser = !!existingAuthUser
    return NextResponse.json({
      success: true,
      message: isExistingUser 
        ? `${fullName} has been re-added to your team. They can log in with their existing account.`
        : `Invitation sent successfully to ${email}`,
      staff: {
        id: staffRecord.id,
        email: staffRecord.email,
        full_name: staffRecord.full_name,
        role: staffRecord.role,
        status: isExistingUser ? 'active' : staffRecord.status,
        invited_at: staffRecord.invited_at,
        user_id: existingAuthUser?.id || inviteData?.user?.id || null
      },
      invitation: {
        user: inviteData?.user || existingAuthUser,
        sent_at: new Date().toISOString(),
        is_existing_user: isExistingUser
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