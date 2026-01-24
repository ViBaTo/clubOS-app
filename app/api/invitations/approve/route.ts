import { NextRequest, NextResponse } from 'next/server';
import {
  getSupabaseRouteClientWithAuth,
  getSupabaseAdminClient
} from '@/app/lib/supabaseServer';
import { sendInvitationApprovedEmail } from '@/lib/email';
import { getAppUrl } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    console.log('🔵 Starting invitation approval...');
    
    // Verify admin permissions
    const supabase = getSupabaseRouteClientWithAuth(request);
    const {
      data: { user: sessionUser }
    } = await supabase.auth.getUser();

    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { invitationId } = await request.json();
    
    if (!invitationId) {
      console.error('❌ Missing invitation ID');
      return NextResponse.json({ error: 'Invitation ID required' }, { status: 400 });
    }

    console.log('🔍 Processing invitation:', invitationId);

    // Use admin client for privileged operations
    const admin = getSupabaseAdminClient();
    
    // Get invitation details
    const { data: invitation, error: invError } = await admin
      .from('invitations')
      .select(`
        id,
        organization_id,
        email,
        role,
        status,
        token,
        expires_at,
        organizations!inner (
          id,
          name
        )
      `)
      .eq('id', invitationId)
      .single();

    if (invError || !invitation) {
      console.error('❌ Invitation not found:', invError);
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    // Verify user has admin permissions for this organization
    const { data: membership } = await admin
      .from('organization_users')
      .select('role')
      .eq('organization_id', invitation.organization_id)
      .eq('user_id', sessionUser.id)
      .in('role', ['owner', 'admin'])
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    if (invitation.status !== 'pending') {
      console.log('⚠️ Invitation not pending:', invitation.status);
      return NextResponse.json({ 
        error: 'Invitation is no longer pending' 
      }, { status: 400 });
    }

    // Check if invitation has expired
    if (new Date() > new Date(invitation.expires_at)) {
      await admin
        .from('invitations')
        .update({ status: 'expired' })
        .eq('id', invitationId);

      return NextResponse.json({ error: 'Invitation has expired' }, { status: 400 });
    }

    console.log('✅ Invitation found:', invitation.email);

    // Check if user already exists in Auth
    const { data: existingUsers } = await admin.auth.admin.listUsers();
    const existingAuthUser = existingUsers?.users?.find(
      (u) => u.email?.toLowerCase() === invitation.email.toLowerCase()
    );

    let authUserId: string;

    if (existingAuthUser) {
      console.log('👤 Auth user already exists:', existingAuthUser.id);
      authUserId = existingAuthUser.id;
      
      // Check if user is already a member of this organization
      const { data: existingMember } = await admin
        .from('organization_users')
        .select('id')
        .eq('organization_id', invitation.organization_id)
        .eq('user_id', existingAuthUser.id)
        .single();

      if (existingMember) {
        // Update invitation status to accepted
        await admin
          .from('invitations')
          .update({ 
            status: 'accepted',
            auth_user_id: existingAuthUser.id,
            accepted_at: new Date().toISOString()
          })
          .eq('id', invitationId);

        return NextResponse.json({
          error: 'User is already a member of this organization'
        }, { status: 409 });
      }
    } else {
      // Create new Auth user with invitation metadata
      console.log('👤 Creating new Supabase Auth user...');
      const { data: authData, error: authError } = await admin.auth.admin.createUser({
        email: invitation.email,
        email_confirm: false, // User must verify email
        user_metadata: {
          invitation_id: invitation.id,
          role: invitation.role,
          organization_id: invitation.organization_id,
          name: invitation.email.split('@')[0], // Default name from email
          invited: true,
          organization_name: (invitation.organizations as any)?.name
        }
      });

      if (authError || !authData.user) {
        console.error('❌ Failed to create Auth user:', authError);
        
        // Check if user already registered
        if (authError?.message?.includes('already registered')) {
          return NextResponse.json({ 
            error: 'Este correo ya está registrado en el sistema' 
          }, { status: 409 });
        }
        
        return NextResponse.json({ 
          error: 'Error al crear usuario', 
          details: authError?.message 
        }, { status: 500 });
      }

      console.log('✅ Auth user created:', authData.user.id);
      authUserId = authData.user.id;
    }

    // Create organization membership
    console.log('🏢 Creating organization membership...');
    const { error: membershipError } = await admin
      .from('organization_users')
      .insert({
        organization_id: invitation.organization_id,
        user_id: authUserId,
        role: invitation.role || 'member',
        invitation_id: invitation.id,
        joined_via: 'invitation'
      });

    if (membershipError) {
      console.error('❌ Failed to create membership:', membershipError);
      return NextResponse.json({
        error: membershipError.message
      }, { status: 400 });
    }

    // Update invitation status
    console.log('📝 Updating invitation status...');
    const { error: updateError } = await admin
      .from('invitations')
      .update({ 
        status: 'accepted',
        auth_user_id: authUserId,
        accepted_at: new Date().toISOString()
      })
      .eq('id', invitationId);

    if (updateError) {
      console.error('❌ Failed to update invitation:', updateError);
      return NextResponse.json({
        error: updateError.message
      }, { status: 400 });
    }

    // Create success notification for the new member
    try {
      const organizationName = (invitation.organizations as any)?.name || 'la organización';
      
      await admin.from('notifications').insert({
        user_id: authUserId,
        organization_id: invitation.organization_id,
        type: 'invitation_approved',
        title: '¡Solicitud aprobada!',
        message: `Tu solicitud para unirte a ${organizationName} ha sido aprobada. Ya tienes acceso completo.`,
        data: JSON.stringify({
          invitation_id: invitation.id,
          organization_id: invitation.organization_id,
          organization_name: organizationName,
          approved_by: sessionUser.id,
          role: invitation.role
        })
      });

      console.log('✅ Approval notification created');
    } catch (notifError) {
      console.error('⚠️ Failed to create approval notification:', notifError);
    }

    // Mark related admin notifications as read
    try {
      await admin
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('type', 'join_request')
        .eq('user_id', sessionUser.id)
        .like('data', `%"invitation_id":"${invitation.id}"%`);

      console.log('✅ Admin notifications marked as read');
    } catch (readError) {
      console.error('⚠️ Failed to mark admin notifications as read:', readError);
    }

    // Send approval email (non-blocking)
    try {
      console.log('📧 Sending approval email...');
      const organizationName = (invitation.organizations as any)?.name || 'la organización';
      const baseUrl = getAppUrl(request);
      
      await sendInvitationApprovedEmail({
        email: invitation.email,
        organizationName,
        organizationId: invitation.organization_id,
        role: invitation.role || 'member',
        loginLink: `${baseUrl}/login`,
        invitationId: invitation.id,
      });

      console.log('✅ Approval email sent');
    } catch (emailError) {
      console.error('⚠️ Email failed (non-blocking):', emailError);
    }

    console.log('🎉 Invitation approval completed successfully');
    return NextResponse.json({
      success: true,
      message: `Solicitud aprobada. ${invitation.email} ahora es miembro de la organización y recibirá un correo de verificación.`,
      user: {
        id: authUserId,
        email: invitation.email
      }
    });

  } catch (error: any) {
    console.error('💥 CRITICAL ERROR in invitation approval:', error);
    console.error('Error stack:', error.stack);
    
    return NextResponse.json({
      error: 'Error interno del servidor',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}