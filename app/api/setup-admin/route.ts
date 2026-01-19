import { NextResponse } from 'next/server'
import { getSupabaseRouteClientWithAuth, getSupabaseAdminClient } from '@/app/lib/supabaseServer'

export async function GET(request: Request) {
  try {
    const supabase = getSupabaseRouteClientWithAuth(request)
    const adminClient = getSupabaseAdminClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's organization
    const { data: orgUser, error: orgError } = await supabase
      .from('organization_users')
      .select('organization_id, role, organizations(name)')
      .eq('user_id', user.id)
      .single()

    if (orgError || !orgUser) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // Check if staff record already exists
    const { data: existingStaff, error: existingError } = await adminClient
      .from('club_staff')
      .select('id')
      .eq('email', user.email)
      .eq('organization_id', orgUser.organization_id)
      .single()

    if (existingStaff) {
      return NextResponse.json({ 
        success: true, 
        message: 'Staff record already exists',
        staff_id: existingStaff.id
      })
    }

    // Create staff record for the admin - using only basic required columns
    const staffData = {
      organization_id: orgUser.organization_id,
      email: user.email!,
      full_name: user.email!.split('@')[0], // Default name, can be updated later
      role: 'gestor', // Admin role in staff system
      status: 'active',
      user_id: user.id,
      activated_at: new Date().toISOString()
    }

    const { data: newStaff, error: createError } = await adminClient
      .from('club_staff')
      .insert(staffData)
      .select('id')
      .single()

    if (createError) {
      console.error('Failed to create staff record:', createError)
      return NextResponse.json({ 
        error: `Failed to create staff record: ${createError.message}` 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Admin staff record created successfully',
      staff_id: newStaff.id,
      organization: orgUser.organizations?.name
    })

  } catch (error: any) {
    console.error('Setup admin error:', error)
    return NextResponse.json({
      error: error.message || 'Internal server error'
    }, { status: 500 })
  }
}