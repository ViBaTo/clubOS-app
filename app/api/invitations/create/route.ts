import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/app/lib/supabaseServer';

export async function POST(request: NextRequest) {
  try {
    console.log('🔵 Starting invitation creation...');
    
    const body = await request.json();
    console.log('📦 Request body:', JSON.stringify(body, null, 2));
    
    const { accessCode, userEmail, fullName, role, message } = body;

    // Validate required fields
    if (!accessCode || !userEmail || !fullName || !role) {
      console.error('❌ Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const admin = getSupabaseAdminClient();
    console.log('✅ Supabase admin client created');
    
    // Validate organization exists and is active
    console.log('🔍 Looking for organization with access code:', accessCode);
    const { data: organization, error: orgError } = await admin
      .from('organizations')
      .select('id, name, access_code')
      .eq('access_code', accessCode.toUpperCase())
      .eq('status', 'active')
      .single();

    if (orgError || !organization) {
      console.error('❌ Organization not found:', orgError);
      return NextResponse.json(
        { error: 'Club not found or inactive' },
        { status: 404 }
      );
    }

    console.log('✅ Organization found:', organization.name);

    // Map Spanish role to database enum
    const roleMap: Record<string, string> = {
      'Gestor': 'admin',
      'Profesor/Entrenador': 'staff',
      'Administración': 'admin',
      'Recepción': 'member',
      'Financiero': 'member',
      'Propietario': 'owner'
    };

    const dbRole = roleMap[role] || 'member';
    console.log('🎭 Role mapping:', role, '→', dbRole);

    // Check for existing user to use as invited_by
    console.log('👤 Finding organization admin for invited_by...');
    const { data: adminUsers } = await admin
      .from('organization_users')
      .select('user_id')
      .eq('organization_id', organization.id)
      .in('role', ['owner', 'admin'])
      .limit(1);

    const invitedBy = adminUsers && adminUsers.length > 0 ? adminUsers[0].user_id : null;
    
    if (!invitedBy) {
      console.error('❌ No admin found to serve as inviter');
      return NextResponse.json(
        { error: 'Organization has no admins' },
        { status: 500 }
      );
    }

    console.log('✅ Using admin user as inviter:', invitedBy);

    // Check for duplicate pending invitations
    console.log('🔍 Checking for existing invitations...');
    const { data: existingInvitation } = await admin
      .from('invitations')
      .select('id, status')
      .eq('email', userEmail.toLowerCase())
      .eq('organization_id', organization.id)
      .in('status', ['pending', 'accepted'])
      .maybeSingle();

    if (existingInvitation) {
      const statusText = existingInvitation.status === 'pending' 
        ? 'Your request is pending approval' 
        : 'Your invitation has already been approved';
      console.log('⚠️ Duplicate invitation found:', existingInvitation.status);
      return NextResponse.json(
        { error: statusText },
        { status: 409 }
      );
    }

    // Generate invitation token
    const token = crypto.randomUUID();
    
    // Set expiration date (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Create invitation (only with columns that exist)
    console.log('💾 Creating invitation...');
    const invitationData = {
      organization_id: organization.id,
      email: userEmail.toLowerCase(),
      role: dbRole,
      status: 'pending',
      invited_by: invitedBy,
      token,
      expires_at: expiresAt.toISOString(),
    };
    
    console.log('💾 Inserting invitation data:', JSON.stringify(invitationData, null, 2));
    const { data: invitation, error: invitationError } = await admin
      .from('invitations')
      .insert(invitationData)
      .select()
      .single();

    if (invitationError) {
      console.error('❌ Failed to create invitation:', invitationError);
      return NextResponse.json(
        { 
          error: 'Error al crear invitación', 
          details: invitationError.message 
        },
        { status: 500 }
      );
    }

    console.log('✅ Invitation created:', invitation.id);

    // Create notifications for organization admins (non-blocking)
    console.log('📢 Creating admin notifications...');
    try {
      const { data: admins } = await admin
        .from('organization_users')
        .select('user_id, role')
        .eq('organization_id', organization.id)
        .in('role', ['owner', 'admin']);

      if (admins && admins.length > 0) {
        const title = 'Nueva solicitud de acceso al club';
        const notifMessage = `${fullName} solicita unirse a ${organization.name}${
          role && role !== 'member' ? ` como ${role}` : ''
        }${message ? `: ${message}` : ''}`;

        const notifications = admins.map((adminUser) => ({
          user_id: adminUser.user_id,
          organization_id: organization.id,
          type: 'join_request',
          title,
          message: notifMessage,
          data: JSON.stringify({
            invitation_id: invitation.id,
            applicant_email: userEmail,
            applicant_name: fullName,
            organization_id: organization.id,
            organization_name: organization.name,
            role_requested: role,
            message,
            access_code: accessCode
          })
        }));

        await admin.from('notifications').insert(notifications);
        console.log('✅ Admin notifications created');
      }
    } catch (notifError) {
      console.error('⚠️ Failed to create notifications (non-blocking):', notifError);
    }

    // Send emails (non-blocking)
    console.log('📧 Attempting to send emails...');
    try {
      // Try to import email functions
      const emailModule = await import('@/lib/email').catch(() => null);
      
      if (emailModule) {
        const { sendInvitationReceivedEmail, sendAdminNotificationEmail } = emailModule;

        // Send confirmation to applicant
        await sendInvitationReceivedEmail({
          email: userEmail,
          organizationName: organization.name,
          organizationId: organization.id,
          role: role,
          invitationId: invitation.id,
        }).catch(err => console.error('Email to applicant failed:', err));

        // Get admin emails and send notifications
        const { data: adminUsers } = await admin
          .from('organization_users')
          .select('users(email)')
          .eq('organization_id', organization.id)
          .in('role', ['owner', 'admin']);

        if (adminUsers && adminUsers.length > 0) {
          const approvalLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/configuracion/solicitudes-acceso`;
          
          for (const adminUser of adminUsers) {
            const adminEmail = (adminUser as any).users?.email;
            if (adminEmail) {
              await sendAdminNotificationEmail({
                adminEmail,
                applicantName: fullName,
                applicantEmail: userEmail,
                role: role,
                message: message || undefined,
                organizationName: organization.name,
                organizationId: organization.id,
                approvalLink,
                invitationId: invitation.id,
              }).catch(err => console.error(`Email to admin ${adminEmail} failed:`, err));
            }
          }
        }

        console.log('✅ Emails sent (or attempted)');
      } else {
        console.log('⚠️ Email module not available, skipping emails');
      }
    } catch (emailError) {
      console.error('⚠️ Email error (non-blocking):', emailError);
    }

    console.log('🎉 Invitation process completed successfully');
    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        organization: {
          id: organization.id,
          name: organization.name
        },
        status: invitation.status,
        message: 'Solicitud enviada correctamente. El administrador revisará tu solicitud y te notificará por email.'
      }
    });

  } catch (error: any) {
    console.error('💥 CRITICAL ERROR in /api/invitations/create:');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}