'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import type { Invitation } from '@/app/types/notifications'

const MaterialIcon = ({
  name,
  className = '',
  filled = false
}: {
  name: string
  className?: string
  filled?: boolean
}) => (
  <span
    className={cn(
      'material-symbols-outlined select-none',
      filled && 'material-symbols-filled',
      className
    )}
    style={{ fontVariationSettings: filled ? "'FILL' 1" : "'FILL' 0" }}
  >
    {name}
  </span>
)

interface InvitationDetailModalProps {
  invitation: Invitation | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onApprove: (invitationId: string) => Promise<void>
  onReject: (invitationId: string, reason?: string) => Promise<void>
}

export function InvitationDetailModal({
  invitation,
  open,
  onOpenChange,
  onApprove,
  onReject
}: InvitationDetailModalProps) {
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  if (!invitation) return null

  const handleApprove = async () => {
    setIsProcessing(true)
    try {
      await onApprove(invitation.id)
      setShowApproveDialog(false)
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to approve invitation:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = async () => {
    setIsProcessing(true)
    try {
      await onReject(invitation.id, rejectReason.trim() || undefined)
      setShowRejectDialog(false)
      setRejectReason('')
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to reject invitation:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pendiente</Badge>
      case 'approved':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Aprobada</Badge>
      case 'rejected':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Rechazada</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getUserInitials = (email: string) => {
    const parts = email.split('@')[0].split('.')
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return email.substring(0, 2).toUpperCase()
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center">
                <MaterialIcon name="person_add" className="text-blue-500 text-lg" />
              </div>
              Solicitud de acceso
            </DialogTitle>
            <DialogDescription>
              Revisa los detalles de la solicitud y toma una decisión
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Status and Date */}
            <div className="flex items-center justify-between">
              {getStatusBadge(invitation.status)}
              <span className="text-sm text-muted-foreground">
                Enviada el {formatDate(invitation.created_at)}
              </span>
            </div>

            {/* User Info */}
            <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
              <Avatar className="h-12 w-12">
                <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${invitation.user_email}`} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getUserInitials(invitation.user_email)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium">
                    {invitation.user_full_name || 'Usuario'}
                  </h3>
                  {invitation.user_phone && (
                    <Badge variant="outline" className="text-xs">
                      <MaterialIcon name="phone" className="mr-1 text-xs" />
                      {invitation.user_phone}
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MaterialIcon name="mail" className="text-sm" />
                  {invitation.user_email}
                </div>
              </div>
            </div>

            {/* Organization Info */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Organización solicitada</Label>
              <div className="p-3 bg-muted/30 rounded-md">
                <p className="font-medium">{invitation.organization_name}</p>
                {invitation.organization_id && (
                  <p className="text-sm text-muted-foreground mt-1">
                    ID: {invitation.organization_id}
                  </p>
                )}
              </div>
            </div>

            {/* Message from User */}
            {invitation.message && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Mensaje del solicitante</Label>
                <div className="p-3 bg-muted/30 rounded-md">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {invitation.message}
                  </p>
                </div>
              </div>
            )}

            {/* Additional Info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-xs text-muted-foreground">ID de solicitud</Label>
                <p className="font-mono text-xs bg-muted/30 px-2 py-1 rounded mt-1">
                  {invitation.id}
                </p>
              </div>
              {invitation.updated_at && invitation.updated_at !== invitation.created_at && (
                <div>
                  <Label className="text-xs text-muted-foreground">Última actualización</Label>
                  <p className="text-xs mt-1">
                    {formatDate(invitation.updated_at)}
                  </p>
                </div>
              )}
            </div>

            {/* Rejection Reason (if rejected) */}
            {invitation.status === 'rejected' && invitation.rejection_reason && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-red-600">Razón del rechazo</Label>
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-800">
                    {invitation.rejection_reason}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          {invitation.status === 'pending' && (
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setShowRejectDialog(true)}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <MaterialIcon name="cancel" className="mr-2 text-lg" />
                Rechazar
              </Button>
              <Button
                onClick={() => setShowApproveDialog(true)}
                className="bg-[#14B8A6] hover:bg-[#14B8A6]/90"
              >
                <MaterialIcon name="check_circle" className="mr-2 text-lg" />
                Aprobar solicitud
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve Confirmation Dialog */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <MaterialIcon name="check_circle" className="text-green-500 text-xl" />
              Aprobar solicitud
            </AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres aprobar la solicitud de acceso de{' '}
              <strong>{invitation.user_full_name || invitation.user_email}</strong>?
              <br /><br />
              El usuario recibirá una notificación y tendrá acceso completo a la organización.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApprove}
              disabled={isProcessing}
              className="bg-[#14B8A6] hover:bg-[#14B8A6]/90"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Aprobando...
                </>
              ) : (
                <>
                  <MaterialIcon name="check_circle" className="mr-2 text-lg" />
                  Aprobar
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Confirmation Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <MaterialIcon name="cancel" className="text-red-500 text-xl" />
              Rechazar solicitud
            </AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres rechazar la solicitud de acceso de{' '}
              <strong>{invitation.user_full_name || invitation.user_email}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-2">
            <Label htmlFor="reject-reason" className="text-sm">
              Razón del rechazo (opcional)
            </Label>
            <Textarea
              id="reject-reason"
              placeholder="Explica brevemente por qué se rechaza esta solicitud..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="resize-none"
              rows={3}
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel 
              disabled={isProcessing}
              onClick={() => {
                setRejectReason('')
                setShowRejectDialog(false)
              }}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              disabled={isProcessing}
              className="bg-red-600 hover:bg-red-700"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Rechazando...
                </>
              ) : (
                <>
                  <MaterialIcon name="cancel" className="mr-2 text-lg" />
                  Rechazar
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}