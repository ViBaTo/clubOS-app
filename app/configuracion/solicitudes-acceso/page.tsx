'use client'

import { useEffect, useState } from 'react'
import { useCurrentUser } from '@/app/lib/auth'
import { useRouter } from 'next/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { InvitationDetailModal } from '@/components/invitations/InvitationDetailModal'
import {
  Search,
  Filter,
  Check,
  X,
  Eye,
  Clock,
  AlertTriangle,
  Loader2,
  Mail,
  Phone,
  User,
  Building
} from 'lucide-react'
import type {
  FormattedInvitation,
  InvitationListResponse,
  InvitationActionResponse,
  Invitation
} from '@/app/types/notifications'

export default function SolicitudesAccesoPage() {
  const { user, loading } = useCurrentUser()
  const router = useRouter()
  const { toast } = useToast()
  
  const [invitations, setInvitations] = useState<FormattedInvitation[]>([])
  const [filteredInvitations, setFilteredInvitations] = useState<FormattedInvitation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedInvitation, setSelectedInvitation] = useState<FormattedInvitation | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)

  // Convert FormattedInvitation to Invitation for modal
  const convertToInvitation = (formatted: FormattedInvitation): Invitation => ({
    id: formatted.id,
    organization_id: formatted.organizationId,
    email: formatted.email,
    role: formatted.role,
    status: formatted.status,
    token: '', // Not needed for display
    expires_at: formatted.expiresAt,
    created_at: formatted.createdAt,
    updated_at: formatted.createdAt, // Use created_at as fallback
    user_email: formatted.email,
    user_full_name: formatted.applicantName,
    user_phone: formatted.phone,
    message: formatted.message,
    organization_name: formatted.organizationName || '',
    rejection_reason: null, // Would be set if rejected
    data: {
      full_name: formatted.applicantName,
      phone: formatted.phone,
      message: formatted.message,
      access_code: formatted.accessCode
    },
    organizations: formatted.organizationName ? {
      id: formatted.organizationId,
      name: formatted.organizationName
    } : undefined
  })

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  // Load pending invitations
  const loadInvitations = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/invitations/pending', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })

      if (response.ok) {
        const data: InvitationListResponse = await response.json()
        setInvitations(data.invitations || [])
        setTotalCount(data.totalCount || 0)
      } else {
        toast({
          title: 'Error al cargar solicitudes',
          description: 'No se pudieron cargar las solicitudes pendientes'
        })
      }
    } catch (error) {
      console.error('Failed to load invitations:', error)
      toast({
        title: 'Error de conexión',
        description: 'No se pudo conectar con el servidor'
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Filter invitations based on search
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredInvitations(invitations)
    } else {
      const filtered = invitations.filter(invitation =>
        invitation.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invitation.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invitation.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (invitation.message && invitation.message.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      setFilteredInvitations(filtered)
    }
  }, [invitations, searchTerm])

  // Load invitations on mount
  useEffect(() => {
    loadInvitations()
  }, [user])

  // Approve invitation
  const handleApprove = async (invitationId: string) => {
    setActionLoading(invitationId)
    
    try {
      const response = await fetch('/api/invitations/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ invitationId })
      })

      const result: InvitationActionResponse = await response.json()

      if (response.ok) {
        toast({
          title: '¡Solicitud aprobada!',
          description: result.message
        })
        
        // Remove from list
        setInvitations(prev => prev.filter(inv => inv.id !== invitationId))
        
        // Close modal if open
        if (selectedInvitation?.id === invitationId) {
          setSelectedInvitation(null)
        }
      } else {
        toast({
          title: 'Error al aprobar',
          description: result.message || 'No se pudo aprobar la solicitud'
        })
      }
    } catch (error) {
      console.error('Failed to approve invitation:', error)
      toast({
        title: 'Error de conexión',
        description: 'No se pudo procesar la solicitud'
      })
    } finally {
      setActionLoading(null)
    }
  }

  // Reject invitation
  const handleReject = async (invitationId: string, reason?: string) => {
    setActionLoading(invitationId)
    
    try {
      const response = await fetch('/api/invitations/reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ invitationId, reason })
      })

      const result: InvitationActionResponse = await response.json()

      if (response.ok) {
        toast({
          title: 'Solicitud rechazada',
          description: result.message
        })
        
        // Remove from list
        setInvitations(prev => prev.filter(inv => inv.id !== invitationId))
        
        // Close modal
        if (selectedInvitation?.id === invitationId) {
          setSelectedInvitation(null)
        }
      } else {
        toast({
          title: 'Error al rechazar',
          description: result.message || 'No se pudo rechazar la solicitud'
        })
      }
    } catch (error) {
      console.error('Failed to reject invitation:', error)
      toast({
        title: 'Error de conexión',
        description: 'No se pudo procesar la solicitud'
      })
    } finally {
      setActionLoading(null)
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Get status badge
  const getStatusBadge = (invitation: FormattedInvitation) => {
    if (invitation.isExpired) {
      return (
        <Badge variant="secondary" className="bg-red-100 text-red-800">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Expirado
        </Badge>
      )
    }
    return (
      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
        <Clock className="w-3 h-3 mr-1" />
        Pendiente
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#14B8A6]" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-foreground">
          Solicitudes de Acceso
        </h1>
        <p className="text-muted-foreground">
          Gestiona las solicitudes pendientes de acceso al club
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#14B8A6]">{totalCount}</div>
            <p className="text-xs text-muted-foreground">
              Solicitudes esperando revisión
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Este Mes</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {invitations.filter(inv => 
                new Date(inv.createdAt).getMonth() === new Date().getMonth()
              ).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Solicitudes recibidas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiradas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {invitations.filter(inv => inv.isExpired).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Requieren atención
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg">Solicitudes Pendientes</CardTitle>
              <CardDescription>
                {filteredInvitations.length} de {invitations.length} solicitudes
              </CardDescription>
            </div>
            <Button onClick={loadInvitations} variant="outline" size="sm">
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Filter className="h-4 w-4 mr-2" />
              )}
              Actualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search Bar */}
          <div className="flex items-center space-x-2 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por email, nombre o rol..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Invitations Table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-[#14B8A6]" />
              <span className="ml-2 text-muted-foreground">Cargando solicitudes...</span>
            </div>
          ) : filteredInvitations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {invitations.length === 0 ? (
                <div className="space-y-2">
                  <Building className="h-12 w-12 mx-auto text-muted-foreground/50" />
                  <p className="text-lg font-medium">No hay solicitudes pendientes</p>
                  <p className="text-sm">Las nuevas solicitudes aparecerán aquí</p>
                </div>
              ) : (
                <p>No se encontraron solicitudes que coincidan con la búsqueda</p>
              )}
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Solicitante</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvitations.map((invitation) => (
                    <TableRow key={invitation.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{invitation.applicantName}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {invitation.email}
                          </div>
                          {invitation.phone && (
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {invitation.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{invitation.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatDate(invitation.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(invitation)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedInvitation(invitation)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => handleApprove(invitation.id)}
                            disabled={actionLoading === invitation.id || invitation.isExpired}
                          >
                            {actionLoading === invitation.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => {
                              setSelectedInvitation(invitation)
                              setShowRejectModal(true)
                            }}
                            disabled={actionLoading === invitation.id}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invitation Detail Modal */}
      <InvitationDetailModal
        invitation={selectedInvitation ? convertToInvitation(selectedInvitation) : null}
        open={!!selectedInvitation}
        onOpenChange={(open) => !open && setSelectedInvitation(null)}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </div>
  )
}