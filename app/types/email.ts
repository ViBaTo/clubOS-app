export interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
}

export interface BaseEmailData {
  email: string
  organizationName: string
  organizationId: string
}

export interface InvitationReceivedEmailData extends BaseEmailData {
  role: string
  invitationId: string
}

export interface AdminNotificationEmailData {
  adminEmail: string
  applicantName: string
  applicantEmail: string
  role: string
  message?: string
  organizationName: string
  organizationId: string
  approvalLink: string
  invitationId: string
}

export interface InvitationApprovedEmailData extends BaseEmailData {
  role: string
  loginLink: string
  invitationId: string
}

export interface InvitationRejectedEmailData extends BaseEmailData {
  reason?: string
  invitationId: string
}

// Email log types for Supabase integration
export interface EmailLogData {
  organizationId: string
  recipientEmail: string
  emailType: EmailType
  subject: string
  invitationId?: string
  errorMessage?: string
}

export type EmailType = 
  | 'invitation_received'
  | 'admin_notification'
  | 'invitation_approved'
  | 'invitation_rejected'