'use client'

import { useState, useEffect } from 'react'
import { User, Phone, Users, Save, X } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { usePermissions } from '@/hooks/usePermissions'

const availableSpecialties = [
  'Yoga', 'Pilates', 'CrossFit', 'Swimming', 'Tennis', 'Padel', 
  'Basketball', 'Football', 'Volleyball', 'Martial Arts', 
  'Boxing', 'Cycling', 'Running', 'Fitness', 'Dance', 'Gymnastics'
]

const roleLabels = {
  gestor: 'Manager',
  admin: 'Admin',
  profesor: 'Instructor'
}

interface StaffMember {
  id: string
  email: string
  full_name: string
  phone?: string
  role: 'gestor' | 'admin' | 'profesor'
  specialties: string[]
  status: 'pending' | 'active' | 'inactive'
  is_self: boolean
}

interface EditStaffModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  staffMember: StaffMember | null
  onStaffUpdated: () => void
}

interface FormData {
  phone: string
  role: 'gestor' | 'admin' | 'profesor'
  specialties: string[]
}

export function EditStaffModal({ open, onOpenChange, staffMember, onStaffUpdated }: EditStaffModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    phone: '',
    role: 'profesor',
    specialties: []
  })
  const [errors, setErrors] = useState<Partial<FormData>>({})
  const { canEditStaffRoles } = usePermissions()
  const { toast } = useToast()

  // Initialize form data when modal opens or staff member changes
  useEffect(() => {
    if (staffMember && open) {
      setFormData({
        phone: staffMember.phone || '',
        role: staffMember.role,
        specialties: staffMember.specialties || []
      })
      setErrors({})
    }
  }, [staffMember, open])

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {}

    // Phone validation (optional but if provided should be valid)
    if (formData.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/[\s\-\(\)]/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!staffMember || !validateForm()) {
      return
    }

    setLoading(true)

    try {
      const updateData: any = {
        staffId: staffMember.id,
        phone: formData.phone || null,
        specialties: formData.specialties
      }

      // Only include role if user can edit roles and role has changed
      if (canEditStaffRoles && formData.role !== staffMember.role) {
        updateData.role = formData.role
      }

      const response = await fetch('/api/staff/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: 'Staff Updated',
          description: result.message || 'Staff member updated successfully',
        })
        onStaffUpdated()
        onOpenChange(false)
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to update staff member',
          variant: 'destructive'
        })
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSpecialtyToggle = (specialty: string) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty]
    }))
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  if (!staffMember) return null

  const hasChanges = 
    formData.phone !== (staffMember.phone || '') ||
    formData.role !== staffMember.role ||
    JSON.stringify(formData.specialties.sort()) !== JSON.stringify((staffMember.specialties || []).sort())

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-teal-600" />
            Edit Staff Member
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Staff Info */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div>
              <p className="font-medium text-gray-900">{staffMember.full_name}</p>
              <p className="text-sm text-gray-600">{staffMember.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={`${
                staffMember.role === 'gestor' ? 'bg-purple-100 text-purple-800' :
                staffMember.role === 'admin' ? 'bg-blue-100 text-blue-800' : 
                'bg-green-100 text-green-800'
              } border-0`}>
                {roleLabels[staffMember.role]}
              </Badge>
              {staffMember.is_self && (
                <Badge variant="outline" className="text-xs">
                  You
                </Badge>
              )}
            </div>
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Phone Number
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+1 (555) 123-4567"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className={errors.phone ? 'border-red-500' : ''}
            />
            {errors.phone && (
              <p className="text-sm text-red-500">{errors.phone}</p>
            )}
          </div>

          {/* Role - Only show if user can edit roles */}
          {canEditStaffRoles && !staffMember.is_self && (
            <div className="space-y-2">
              <Label htmlFor="role" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Role
              </Label>
              <Select
                value={formData.role}
                onValueChange={(value) => handleInputChange('role', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gestor">Manager - Full system access</SelectItem>
                  <SelectItem value="admin">Admin - Administrative access</SelectItem>
                  <SelectItem value="profesor">Instructor - Teaching access</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Specialties - Show for instructors or when editing an instructor */}
          {(formData.role === 'profesor' || staffMember.role === 'profesor') && (
            <div className="space-y-4">
              <Label className="text-base font-medium">Specialties</Label>
              <p className="text-sm text-gray-600">Select areas of expertise</p>
              <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto">
                {availableSpecialties.map((specialty) => (
                  <div key={specialty} className="flex items-center space-x-2">
                    <Checkbox
                      id={`specialty-${specialty}`}
                      checked={formData.specialties.includes(specialty)}
                      onCheckedChange={() => handleSpecialtyToggle(specialty)}
                    />
                    <Label
                      htmlFor={`specialty-${specialty}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {specialty}
                    </Label>
                  </div>
                ))}
              </div>
              {formData.specialties.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {formData.specialties.map((specialty) => (
                    <Badge key={specialty} variant="outline" className="text-xs">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !hasChanges}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}