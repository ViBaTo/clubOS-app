import { Resend } from 'resend'
import { getSupabaseAdminClient } from '@/app/lib/supabaseServer'
import type {
  EmailResult,
  InvitationReceivedEmailData,
  AdminNotificationEmailData,
  InvitationApprovedEmailData,
  InvitationRejectedEmailData
} from '@/app/types/email'
import InvitationReceivedEmail from '@/emails/InvitationReceived'
import AdminNotificationEmail from '@/emails/AdminNotification'
import InvitationApprovedEmail from '@/emails/InvitationApproved'
import InvitationRejectedEmail from '@/emails/InvitationRejected'

// Initialize Resend with fallback handling
const resendApiKey = process.env.RESEND_API_KEY
if (!resendApiKey && process.env.NODE_ENV !== 'development') {
  throw new Error('RESEND_API_KEY is required in production')
}

const resend = resendApiKey ? new Resend(resendApiKey) : null
const isDevelopment = process.env.NODE_ENV === 'development'

// Email configuration (fallback to defaults)
const EMAIL_FROM = process.env.EMAIL_FROM || 'clubos@vibato.io'
const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || 'ClubOS'
const EMAIL_NOREPLY = process.env.EMAIL_NOREPLY || 'noreply@vibato.io'

/**
 * Send confirmation email to applicant when invitation is received
 */
export async function sendInvitationReceivedEmail(data: InvitationReceivedEmailData): Promise<EmailResult> {
  const subject = `Solicitud de acceso recibida - ${data.organizationName}`
  
  if (isDevelopment || !resend) {
    console.log('📧 [DEV] Invitation Received Email:', { 
      to: data.email, 
      subject,
      organization: data.organizationName,
      role: data.role
    })
    return { success: true, messageId: 'dev-mode' }
  }

  try {
    const result = await resend.emails.send({
      from: `${EMAIL_FROM_NAME} <${EMAIL_NOREPLY}>`,
      to: data.email,
      subject,
      react: InvitationReceivedEmail(data),
    })

    // Log success to Supabase
    await logEmailSent({
      organizationId: data.organizationId,
      recipientEmail: data.email,
      emailType: 'invitation_received',
      subject,
      invitationId: data.invitationId,
    })

    return { success: true, messageId: result.data?.id }
  } catch (error: any) {
    console.error('Invitation received email failed:', error)
    
    // Log failure to Supabase
    await logEmailFailed({
      organizationId: data.organizationId,
      recipientEmail: data.email,
      emailType: 'invitation_received',
      subject,
      errorMessage: error.message,
      invitationId: data.invitationId,
    })

    return { success: false, error: error.message }
  }
}

/**
 * Send notification email to admin when new invitation is created
 */
export async function sendAdminNotificationEmail(data: AdminNotificationEmailData): Promise<EmailResult> {
  const subject = `Nueva solicitud de acceso - ${data.organizationName}`
  
  if (isDevelopment || !resend) {
    console.log('📧 [DEV] Admin Notification Email:', { 
      to: data.adminEmail, 
      subject,
      applicant: data.applicantEmail,
      organization: data.organizationName
    })
    return { success: true, messageId: 'dev-mode' }
  }

  try {
    const result = await resend.emails.send({
      from: `${EMAIL_FROM_NAME} <${EMAIL_NOREPLY}>`,
      to: data.adminEmail,
      subject,
      react: AdminNotificationEmail(data),
    })

    // Log success to Supabase
    await logEmailSent({
      organizationId: data.organizationId,
      recipientEmail: data.adminEmail,
      emailType: 'admin_notification',
      subject,
      invitationId: data.invitationId,
    })

    return { success: true, messageId: result.data?.id }
  } catch (error: any) {
    console.error('Admin notification email failed:', error)
    
    // Log failure to Supabase
    await logEmailFailed({
      organizationId: data.organizationId,
      recipientEmail: data.adminEmail,
      emailType: 'admin_notification',
      subject,
      errorMessage: error.message,
      invitationId: data.invitationId,
    })

    return { success: false, error: error.message }
  }
}

/**
 * Send approval confirmation email to applicant
 */
export async function sendInvitationApprovedEmail(data: InvitationApprovedEmailData): Promise<EmailResult> {
  const subject = `¡Solicitud aprobada! - ${data.organizationName}`
  
  if (isDevelopment || !resend) {
    console.log('📧 [DEV] Invitation Approved Email:', { 
      to: data.email, 
      subject,
      organization: data.organizationName,
      role: data.role
    })
    return { success: true, messageId: 'dev-mode' }
  }

  try {
    const result = await resend.emails.send({
      from: `${EMAIL_FROM_NAME} <${EMAIL_NOREPLY}>`,
      to: data.email,
      subject,
      react: InvitationApprovedEmail(data),
    })

    // Log success to Supabase
    await logEmailSent({
      organizationId: data.organizationId,
      recipientEmail: data.email,
      emailType: 'invitation_approved',
      subject,
      invitationId: data.invitationId,
    })

    return { success: true, messageId: result.data?.id }
  } catch (error: any) {
    console.error('Invitation approved email failed:', error)
    
    // Log failure to Supabase
    await logEmailFailed({
      organizationId: data.organizationId,
      recipientEmail: data.email,
      emailType: 'invitation_approved',
      subject,
      errorMessage: error.message,
      invitationId: data.invitationId,
    })

    return { success: false, error: error.message }
  }
}

/**
 * Send rejection notification email to applicant
 */
export async function sendInvitationRejectedEmail(data: InvitationRejectedEmailData): Promise<EmailResult> {
  const subject = `Solicitud de acceso - ${data.organizationName}`
  
  if (isDevelopment || !resend) {
    console.log('📧 [DEV] Invitation Rejected Email:', { 
      to: data.email, 
      subject,
      organization: data.organizationName,
      reason: data.reason
    })
    return { success: true, messageId: 'dev-mode' }
  }

  try {
    const result = await resend.emails.send({
      from: `${EMAIL_FROM_NAME} <${EMAIL_NOREPLY}>`,
      to: data.email,
      subject,
      react: InvitationRejectedEmail(data),
    })

    // Log success to Supabase
    await logEmailSent({
      organizationId: data.organizationId,
      recipientEmail: data.email,
      emailType: 'invitation_rejected',
      subject,
      invitationId: data.invitationId,
    })

    return { success: true, messageId: result.data?.id }
  } catch (error: any) {
    console.error('Invitation rejected email failed:', error)
    
    // Log failure to Supabase
    await logEmailFailed({
      organizationId: data.organizationId,
      recipientEmail: data.email,
      emailType: 'invitation_rejected',
      subject,
      errorMessage: error.message,
      invitationId: data.invitationId,
    })

    return { success: false, error: error.message }
  }
}

/**
 * Log successful email delivery to Supabase
 */
async function logEmailSent(data: {
  organizationId: string
  recipientEmail: string
  emailType: string
  subject: string
  invitationId?: string
}) {
  try {
    const supabase = getSupabaseAdminClient()
    const { error } = await supabase.rpc('log_email_sent', {
      p_organization_id: data.organizationId,
      p_recipient_email: data.recipientEmail,
      p_email_type: data.emailType,
      p_subject: data.subject,
      p_invitation_id: data.invitationId || null,
    })

    if (error) {
      console.error('Failed to log email success:', error)
    }
  } catch (error) {
    console.error('Failed to log email success:', error)
  }
}

/**
 * Log failed email delivery to Supabase
 */
async function logEmailFailed(data: {
  organizationId: string
  recipientEmail: string
  emailType: string
  subject: string
  errorMessage: string
  invitationId?: string
}) {
  try {
    const supabase = getSupabaseAdminClient()
    const { error } = await supabase.rpc('log_email_failed', {
      p_organization_id: data.organizationId,
      p_recipient_email: data.recipientEmail,
      p_email_type: data.emailType,
      p_subject: data.subject,
      p_error_message: data.errorMessage,
      p_invitation_id: data.invitationId || null,
    })

    if (error) {
      console.error('Failed to log email failure:', error)
    }
  } catch (error) {
    console.error('Failed to log email failure:', error)
  }
}