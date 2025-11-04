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

    // Parse request body
    const body = await request.json()
    const { staffId, phone, specialties, role } = body

    if (!staffId) {
      return NextResponse.json({ error: 'Staff ID is required' }, { status: 400 })
    }

    // Get staff record
    const { data: staffRecord, error: staffError } = await adminClient
      .from('club_staff')
      .select('id, email, full_name, role, status, organization_id, user_id')
      .eq('id', staffId)
      .eq('organization_id', orgUser.organization_id)
      .single()

    if (staffError || !staffRecord) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 })
    }

    // Check permissions for different update types
    const isSelfUpdate = staffRecord.user_id === user.id
    const isAdminOrOwner = ['owner', 'admin'].includes(orgUser.role)

    // Anyone can update their own phone and specialties
    // Only admin/owner can change roles or update other users
    if (!isSelfUpdate && !isAdminOrOwner) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Role changes require admin/owner permissions
    if (role && role !== staffRecord.role && !isAdminOrOwner) {
      return NextResponse.json({ 
        error: 'Only administrators can change roles' 
      }, { status: 403 })
    }

    // Validate role if provided
    if (role && !['gestor', 'admin', 'profesor'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Validate phone number if provided
    if (phone && !/^[\+]?[1-9][\d]{0,15}$/.test(phone.replace(/[\s\-\(\)]/g, ''))) {
      return NextResponse.json({ error: 'Invalid phone number format' }, { status: 400 })
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (phone !== undefined) {
      updateData.phone = phone || null
    }

    if (specialties !== undefined) {
      updateData.specialties = Array.isArray(specialties) ? specialties : []
    }

    if (role && isAdminOrOwner) {
      updateData.role = role
    }

    // Update staff record
    const { data: updatedRecord, error: updateError } = await adminClient
      .from('club_staff')
      .update(updateData)
      .eq('id', staffId)
      .select('*')
      .single()

    if (updateError) {
      return NextResponse.json({ 
        error: `Failed to update staff member: ${updateError.message}` 
      }, { status: 500 })
    }

    // If role was changed and user has an account, update organization_users table
    if (role && staffRecord.user_id && isAdminOrOwner) {
      const roleMapping = {
        'gestor': 'owner' as const,
        'admin': 'admin' as const, 
        'profesor': 'staff' as const
      }

      const { error: orgRoleError } = await adminClient
        .from('organization_users')
        .update({
          role: roleMapping[role as keyof typeof roleMapping],
          updated_at: new Date().toISOString()
        })
        .eq('user_id', staffRecord.user_id)
        .eq('organization_id', orgUser.organization_id)

      if (orgRoleError) {
        console.error('Failed to update organization role:', orgRoleError)
        // Don't fail the request, but log the error
      }
    }

    // Prepare response with changes summary
    const changes: string[] = []
    if (phone !== undefined && phone !== staffRecord.phone) {
      changes.push(phone ? `Phone updated to ${phone}` : 'Phone removed')
    }
    if (specialties !== undefined) {
      changes.push('Specialties updated')
    }
    if (role && role !== staffRecord.role) {
      changes.push(`Role changed from ${staffRecord.role} to ${role}`)
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: changes.length > 0 
        ? `Staff member updated: ${changes.join(', ')}`
        : 'No changes made',
      updated_staff: {
        id: updatedRecord.id,
        email: updatedRecord.email,
        full_name: updatedRecord.full_name,
        phone: updatedRecord.phone,
        role: updatedRecord.role,
        specialties: updatedRecord.specialties,
        status: updatedRecord.status,
        updated_at: updatedRecord.updated_at
      },
      changes_made: changes
    })

  } catch (error: any) {
    console.error('Update staff error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}