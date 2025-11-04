'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, MoreVertical, Users, Clock, UserCheck, UserX } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { getSupabaseClient } from '@/app/lib/supabaseClient'
import { useToast } from '@/hooks/use-toast'
import { MigrationRequired } from '@/components/staff/MigrationRequired'
import { EditStaffModal } from '@/components/staff/EditStaffModal'

interface StaffMember {
  id: string
  email: string
  full_name: string
  phone?: string
  role: 'gestor' | 'admin' | 'profesor'
  specialties: string[]
  status: 'pending' | 'active' | 'inactive'
  invited_at: string
  activated_at?: string
  user_id?: string
  is_self?: boolean
}

const roleLabels = {
  gestor: 'Manager',
  admin: 'Admin',
  profesor: 'Instructor'
}

const roleColors = {
  gestor: 'bg-purple-100 text-purple-800 border-purple-200',
  admin: 'bg-blue-100 text-blue-800 border-blue-200',
  profesor: 'bg-green-100 text-green-800 border-green-200'
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  active: 'bg-green-100 text-green-800 border-green-200',
  inactive: 'bg-gray-100 text-gray-800 border-gray-200'
}

const statusLabels = {
  pending: 'Invitation Sent',
  active: 'Active',
  inactive: 'Inactive'
}

export default function TeamPage() {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [filteredStaff, setFilteredStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'inactive'>('all')
  const [userOrganization, setUserOrganization] = useState<string | null>(null)
  const [migrationRequired, setMigrationRequired] = useState(false)
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchStaffData()
  }, [])

  useEffect(() => {
    filterStaff()
  }, [staff, searchQuery, statusFilter])

  const fetchStaffData = async () => {
    try {
      // Use the new API endpoint
      const response = await fetch('/api/staff', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (response.status === 400 && (errorData.code === 'MIGRATION_REQUIRED' || errorData.error?.includes('does not exist'))) {
          // Database table doesn't exist yet - show migration required
          setMigrationRequired(true)
          return
        }
        throw new Error(errorData.error || 'Failed to fetch staff')
      }

      const data = await response.json()
      
      if (data.success) {
        setStaff(data.staff || [])
        // Set user organization from response if available
        if (data.staff.length > 0) {
          setUserOrganization(data.staff[0].organization.id)
        }
      } else {
        throw new Error(data.error || 'Failed to fetch staff')
      }
    } catch (error: any) {
      console.error('Fetch staff error:', error)
      // For database table not existing, show migration required
      if (error.message.includes('does not exist') || error.message.includes('relation') || error.message.includes('column')) {
        setMigrationRequired(true)
      } else {
        toast({ title: 'Error', description: error.message, variant: 'destructive' })
      }
    } finally {
      setLoading(false)
    }
  }

  const filterStaff = () => {
    let filtered = staff

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(member => 
        member.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(member => member.status === statusFilter)
    }

    setFilteredStaff(filtered)
  }

  const handleResendInvitation = async (staffId: string, email: string) => {
    try {
      const response = await fetch('/api/staff/resend-invitation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffId })
      })

      if (response.ok) {
        toast({ title: 'Success', description: `Invitation resent to ${email}` })
        fetchStaffData()
      } else {
        const error = await response.json()
        toast({ title: 'Error', description: error.message, variant: 'destructive' })
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    }
  }

  const handleCancelInvitation = async (staffId: string, email: string) => {
    try {
      const response = await fetch('/api/staff/cancel-invitation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffId })
      })

      if (response.ok) {
        toast({ title: 'Success', description: `Invitation cancelled for ${email}` })
        fetchStaffData()
      } else {
        const error = await response.json()
        toast({ title: 'Error', description: error.message, variant: 'destructive' })
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    }
  }

  const handleDeactivate = async (staffId: string, name: string) => {
    try {
      const response = await fetch('/api/staff/deactivate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffId })
      })

      if (response.ok) {
        toast({ title: 'Success', description: `${name} has been deactivated` })
        fetchStaffData()
      } else {
        const error = await response.json()
        toast({ title: 'Error', description: error.message, variant: 'destructive' })
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    }
  }

  const handleReactivate = async (staffId: string, name: string) => {
    try {
      const response = await fetch('/api/staff/reactivate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffId })
      })

      if (response.ok) {
        toast({ title: 'Success', description: `${name} has been reactivated` })
        fetchStaffData()
      } else {
        const error = await response.json()
        toast({ title: 'Error', description: error.message, variant: 'destructive' })
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading team members...</p>
        </div>
      </div>
    )
  }

  if (migrationRequired) {
    return <MigrationRequired onRetry={fetchStaffData} />
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Team Members</h1>
          <p className="text-gray-600">Manage your club's staff and instructors</p>
        </div>
        <Link href="/settings/team/invite">
          <Button className="bg-teal-600 hover:bg-teal-700 text-white mt-4 sm:mt-0">
            <Plus className="h-4 w-4 mr-2" />
            Invite Member
          </Button>
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by name or email..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('all')}
            className="transition-colors duration-200"
          >
            All
          </Button>
          <Button
            variant={statusFilter === 'active' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('active')}
            className="transition-colors duration-200"
          >
            <UserCheck className="h-4 w-4 mr-1" />
            Active
          </Button>
          <Button
            variant={statusFilter === 'pending' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('pending')}
            className="transition-colors duration-200"
          >
            <Clock className="h-4 w-4 mr-1" />
            Pending
          </Button>
          <Button
            variant={statusFilter === 'inactive' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('inactive')}
            className="transition-colors duration-200"
          >
            <UserX className="h-4 w-4 mr-1" />
            Inactive
          </Button>
        </div>
      </div>

      {/* Staff List */}
      {filteredStaff.length === 0 ? (
        <Card className="border-2 border-dashed border-gray-200">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {staff.length === 0 ? 'No team members yet' : 'No members match your filters'}
            </h3>
            <p className="text-gray-600 mb-6 max-w-sm">
              {staff.length === 0 
                ? 'Start by inviting your first member to join your club.' 
                : 'Try adjusting your search or filter criteria.'
              }
            </p>
            {staff.length === 0 && (
              <Link href="/settings/team/invite">
                <Button className="bg-teal-600 hover:bg-teal-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Invite First Member
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredStaff.map((member) => (
            <Card key={member.id} className="hover:shadow-lg transition-shadow duration-200">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-teal-100 text-teal-700 font-semibold">
                        {getInitials(member.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">{member.full_name}</h3>
                      <p className="text-gray-600 text-sm">{member.email}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {member.status === 'pending' && (
                        <>
                          <DropdownMenuItem onClick={() => handleResendInvitation(member.id, member.email)}>
                            Resend Invitation
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleCancelInvitation(member.id, member.email)}>
                            Cancel
                          </DropdownMenuItem>
                        </>
                      )}
                      {member.status === 'active' && (
                        <>
                          <DropdownMenuItem onClick={() => setEditingStaff({
                            ...member,
                            is_self: false // This will be properly set by the API
                          })}>
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeactivate(member.id, member.full_name)}>
                            Deactivate
                          </DropdownMenuItem>
                        </>
                      )}
                      {member.status === 'inactive' && (
                        <DropdownMenuItem onClick={() => handleReactivate(member.id, member.full_name)}>
                          Reactivate
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge className={`${roleColors[member.role]} border`}>
                      {roleLabels[member.role]}
                    </Badge>
                    <Badge className={`${statusColors[member.status]} border`}>
                      {statusLabels[member.status]}
                    </Badge>
                  </div>

                  {member.specialties && member.specialties.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {member.specialties.map((specialty, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="text-sm text-gray-500">
                    Invited {formatDate(member.invited_at)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Staff Modal */}
      <EditStaffModal
        open={!!editingStaff}
        onOpenChange={(open) => !open && setEditingStaff(null)}
        staffMember={editingStaff}
        onStaffUpdated={fetchStaffData}
      />
    </div>
  )
}