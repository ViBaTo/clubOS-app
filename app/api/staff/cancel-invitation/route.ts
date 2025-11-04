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

    // Check if user has permission to manage staff (admin or owner)
    if (!['owner', 'admin'].includes(orgUser.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Parse request body
    const body = await request.json()
    const { staffId } = body

    if (!staffId) {
      return NextResponse.json({ error: 'Staff ID is required' }, { status: 400 })
    }

    // Get staff record
    const { data: staffRecord, error: staffError } = await adminClient
      .from('club_staff')
      .select('id, email, full_name, role, status, organization_id')
      .eq('id', staffId)
      .eq('organization_id', orgUser.organization_id)
      .single()

    if (staffError || !staffRecord) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 })
    }

    // Check if staff member is in pending status
    if (staffRecord.status !== 'pending') {
      return NextResponse.json({ 
        error: 'Can only cancel invitations for pending staff members' 
      }, { status: 400 })
    }

    // Note: Supabase Auth does not provide an API to revoke/cancel invitations once sent
    // The invitation link will remain valid until it expires (typically 24 hours)
    // We can only remove our record from the database

    // Delete the staff record from club_staff table
    const { error: deleteError } = await adminClient
      .from('club_staff')
      .delete()
      .eq('id', staffId)
      .eq('organization_id', orgUser.organization_id)
      .eq('status', 'pending') // Double-check status

    if (deleteError) {
      return NextResponse.json({ 
        error: `Failed to cancel invitation: ${deleteError.message}` 
      }, { status: 500 })
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: `Invitation cancelled for ${staffRecord.email}`,
      note: 'The invitation email link may still be active until it expires, but the user will not be able to join the organization.',
      cancelled_staff: {
        id: staffRecord.id,
        email: staffRecord.email,
        full_name: staffRecord.full_name,
        role: staffRecord.role,
        cancelled_at: new Date().toISOString()
      }
    })

  } catch (error: any) {
    console.error('Cancel invitation error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}