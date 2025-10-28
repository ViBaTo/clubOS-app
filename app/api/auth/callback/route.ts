import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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