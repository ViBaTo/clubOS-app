import { NextResponse } from 'next/server'
import { getSupabaseRouteClientWithAuth } from '@/app/lib/supabaseServer'

export async function GET(request: Request) {
  try {
    const supabase = getSupabaseRouteClientWithAuth(request)
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      return NextResponse.json({ 
        error: 'Auth error',
        details: userError.message 
      }, { status: 401 })
    }
    
    if (!user) {
      return NextResponse.json({ 
        error: 'No user found',
        message: 'Not authenticated' 
      }, { status: 401 })
    }

    // Check organization association
    const { data: orgUser, error: orgError } = await supabase
      .from('organization_users')
      .select('organization_id, role, organizations(name, slug)')
      .eq('user_id', user.id)
      .single()

    // Check if club_staff table exists and if user is in it
    const { data: staffRecord, error: staffError } = await supabase
      .from('club_staff')
      .select('*')
      .eq('email', user.email)
      .single()

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      },
      organization: orgUser ? {
        id: orgUser.organization_id,
        role: orgUser.role,
        name: orgUser.organizations?.name
      } : null,
      organization_error: orgError?.message || null,
      staff_record: staffRecord || null,
      staff_error: staffError?.message || null
    })

  } catch (error: any) {
    return NextResponse.json({
      error: 'Debug error',
      message: error.message
    }, { status: 500 })
  }
}