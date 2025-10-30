// Notification system types for ClubOS
export interface Notification {
  id: string
  user_id: string
  organization_id: string
  type: NotificationType
  title: string
  message: string
  data: NotificationData
  read_at: string | null
  created_at: string
}

export type NotificationType = 
  | 'join_request'
  | 'invitation_approved'
  | 'invitation_rejected'
  | 'member_joined'
  | 'system_announcement'
  | 'payment_reminder'
  | 'class_cancelled'

export interface NotificationData {
  // Common fields
  organization_id?: string
  organization_name?: string
  
  // Join request specific
  invitation_id?: string
  applicant_id?: string
  applicant_email?: string
  applicant_name?: string
  role_requested?: string
  message?: string
  access_code?: string
  
  // Approval/Rejection specific
  approved_by?: string
  rejected_by?: string
  rejection_reason?: string
  role?: string
  
  // General purpose
  [key: string]: any
}

export interface NotificationListResponse {
  unreadCount: number
  items: Notification[]
}

export interface UnreadCountResponse {
  unreadCount: number
  types?: string[] | null
}

export interface MarkReadRequest {
  notificationId?: string
  notificationIds?: string[]
  markAllAsRead?: boolean
}

export interface MarkReadResponse {
  success: boolean
  message: string
}

// Invitation related types
export interface Invitation {
  id: string
  organization_id: string
  email: string
  role: string
  status: InvitationStatus
  token: string
  expires_at: string
  created_at: string
  data: InvitationData
  // Relations
  organizations?: {
    id: string
    name: string
  }
}

export type InvitationStatus = 'pending' | 'accepted' | 'rejected' | 'expired'

export interface InvitationData {
  full_name?: string
  phone?: string
  message?: string
  access_code?: string
}

export interface InvitationListResponse {
  invitations: FormattedInvitation[]
  totalCount: number
  hasMore?: boolean
}

export interface FormattedInvitation {
  id: string
  organizationId: string
  organizationName?: string
  email: string
  role: string
  status: InvitationStatus
  createdAt: string
  expiresAt: string
  applicantName: string
  phone: string | null
  message: string | null
  accessCode: string | null
  isExpired: boolean
}

export interface CreateInvitationRequest {
  accessCode: string
  role?: string
  message?: string
  userEmail?: string
  userId?: string
  fullName?: string
  phone?: string
}

export interface CreateInvitationResponse {
  success: boolean
  invitation: {
    id: string
    organization: {
      id: string
      name: string
    }
    status: string
    message: string
  }
}

export interface ApproveInvitationRequest {
  invitationId: string
}

export interface RejectInvitationRequest {
  invitationId: string
  reason?: string
}

export interface InvitationActionResponse {
  success: boolean
  message: string
}

// Organization validation types
export interface ValidateCodeRequest {
  accessCode: string
}

export interface ValidateCodeResponse {
  valid: boolean
  organization?: {
    id: string
    name: string
    clubType: string
    accessCode: string
  }
  error?: string
}