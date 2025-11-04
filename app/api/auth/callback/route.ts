import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSupabaseAdminClient } from '@/app/lib/supabaseServer'

export async function POST(request: NextRequest) {
  try {
    const { access_token, refresh_token } = await request.json()

    if (!access_token || !refresh_token) {
      return NextResponse.json(
        { error: 'Missing tokens' },
        { status: 400 }
      )
    }

    // Create Supabase client with the provided session
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Set the session on the server
    const { data, error } = await supabase.auth.setSession({
      access_token,
      refresh_token
    })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    // Create response that will set the HTTP-only cookies
    const response = NextResponse.json({ success: true })
    
    // Set the auth cookies manually for the middleware
    const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL!.split('.')[0].split('//')[1]
    const cookieName = `sb-${projectRef}-auth-token`
    
    const cookieValue = JSON.stringify({
      access_token,
      refresh_token,
      expires_at: data.session?.expires_at,
      user: data.session?.user
    })

    response.cookies.set(cookieName, cookieValue, {
      httpOnly: false, // Needs to be accessible by client
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })

    return response
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const code = url.searchParams.get('code')
    const error = url.searchParams.get('error')
    const errorDescription = url.searchParams.get('error_description')
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Handle error from Supabase
    if (error) {
      console.error('Supabase auth error:', { error, errorDescription })
      const encodedError = encodeURIComponent(errorDescription || error)
      return NextResponse.redirect(`${appUrl}/login?error=${encodedError}`)
    }

    // Handle missing code
    if (!code) {
      return NextResponse.redirect(`${appUrl}/login?error=missing_code`)
    }

    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Exchange code for session
    const { data: { session, user }, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (sessionError || !session || !user) {
      console.error('Failed to exchange code for session:', sessionError)
      return NextResponse.redirect(`${appUrl}/login?error=session_failed`)
    }

    // Check if this is a staff invitation by looking at user metadata
    const userMetadata = user.user_metadata || {}
    const isStaffInvitation = userMetadata.organization_id && userMetadata.role

    if (isStaffInvitation) {
      // This is a staff invitation - the database trigger should have already:
      // 1. Updated club_staff record status to 'active'
      // 2. Set user_id and activated_at
      // 3. Added to organization_users table
      
      console.log('Staff invitation accepted:', {
        userId: user.id,
        email: user.email,
        organizationId: userMetadata.organization_id,
        role: userMetadata.role
      })
    }

    // Determine redirect URL based on user type
    let redirectUrl = `${appUrl}/`
    
    if (isStaffInvitation) {
      // Redirect to home page where welcome modal will show
      redirectUrl = `${appUrl}/`
    }

    // Create response with redirect
    const response = NextResponse.redirect(redirectUrl)
    
    // Set the auth cookies for the session
    const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL!.split('.')[0].split('//')[1]
    const cookieName = `sb-${projectRef}-auth-token`
    
    const cookieValue = JSON.stringify({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: session.expires_at,
      user: session.user
    })

    response.cookies.set(cookieName, cookieValue, {
      httpOnly: false, // Needs to be accessible by client
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    })

    return response

  } catch (error) {
    console.error('Auth callback error:', error)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    return NextResponse.redirect(`${appUrl}/login?error=callback_failed`)
  }
}