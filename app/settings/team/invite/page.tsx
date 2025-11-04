'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, UserPlus, Mail, User, Phone, Users, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'

const availableSpecialties = [
  'Yoga', 'Pilates', 'CrossFit', 'Swimming', 'Tennis', 'Padel', 
  'Basketball', 'Football', 'Volleyball', 'Martial Arts', 
  'Boxing', 'Cycling', 'Running', 'Fitness', 'Dance', 'Gymnastics'
]

const roleDescriptions = {
  gestor: 'Full system access - Can manage all aspects of the club including staff, members, and settings',
  admin: 'Administrative access - Can manage members, classes, and day-to-day operations',
  profesor: 'Teaching access - Can manage their classes, view assigned members, and update attendance'
}

interface FormData {
  fullName: string
  email: string
  role: 'gestor' | 'admin' | 'profesor' | ''
  phone: string
  specialties: string[]
  welcomeMessage: string
}

export default function InviteMemberPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    role: '',
    phone: '',
    specialties: [],
    welcomeMessage: ''
  })

  const [errors, setErrors] = useState<Partial<FormData>>({})

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {}

    // Required field validation
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!formData.role) {
      newErrors.role = 'Role selection is required'
    }

    // Phone validation (optional but if provided should be valid)
    if (formData.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/[\s\-\(\)]/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors in the form',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/staff/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          role: formData.role,
          phone: formData.phone || undefined,
          specialties: formData.specialties,
          welcomeMessage: formData.welcomeMessage || undefined
        }),
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: 'Invitation Sent',
          description: `Invitation has been sent to ${formData.email}`,
        })
        router.push('/settings/team')
      } else {
        let errorMessage = result.error || 'Failed to send invitation'
        if (result.code === 'MIGRATION_REQUIRED') {
          errorMessage = 'Staff management system not set up. Please run the database migration first.'
        }
        toast({
          title: 'Error',
          description: errorMessage,
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

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/settings/team">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Team
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Invite Team Member</h1>
          <p className="text-gray-600">Send an invitation to join your club</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-teal-600" />
                  Member Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Full Name *
                  </Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Enter full name"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    className={errors.fullName ? 'border-red-500' : ''}
                  />
                  {errors.fullName && (
                    <p className="text-sm text-red-500">{errors.fullName}</p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Address *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter email address"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={errors.email ? 'border-red-500' : ''}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500">{errors.email}</p>
                  )}
                </div>

                {/* Role */}
                <div className="space-y-2">
                  <Label htmlFor="role" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Role *
                  </Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => handleInputChange('role', value)}
                  >
                    <SelectTrigger className={errors.role ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gestor">Manager</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="profesor">Instructor</SelectItem>
                    </SelectContent>
                  </Select>
                  {formData.role && (
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                      {roleDescriptions[formData.role as keyof typeof roleDescriptions]}
                    </p>
                  )}
                  {errors.role && (
                    <p className="text-sm text-red-500">{errors.role}</p>
                  )}
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

                {/* Specialties - Only show for Instructor role */}
                {formData.role === 'profesor' && (
                  <div className="space-y-4">
                    <Label className="text-base font-medium">Specialties</Label>
                    <p className="text-sm text-gray-600">Select the areas this instructor specializes in</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
                  </div>
                )}

                {/* Welcome Message */}
                <div className="space-y-2">
                  <Label htmlFor="welcomeMessage" className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Welcome Message
                  </Label>
                  <Textarea
                    id="welcomeMessage"
                    placeholder="Add a personal welcome message (optional)"
                    value={formData.welcomeMessage}
                    onChange={(e) => handleInputChange('welcomeMessage', e.target.value)}
                    rows={3}
                  />
                  <p className="text-sm text-gray-500">
                    This message will be included in the invitation email
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Preview Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Invitation Preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-l-4 border-teal-500 pl-4">
                  <h4 className="font-medium text-gray-900">
                    {formData.fullName || 'New Team Member'}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {formData.email || 'email@example.com'}
                  </p>
                  {formData.role && (
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                        {formData.role === 'gestor' ? 'Manager' : 
                         formData.role === 'admin' ? 'Admin' : 'Instructor'}
                      </span>
                    </div>
                  )}
                  {formData.specialties.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {formData.specialties.slice(0, 3).map((specialty) => (
                        <span key={specialty} className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-800">
                          {specialty}
                        </span>
                      ))}
                      {formData.specialties.length > 3 && (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-800">
                          +{formData.specialties.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Invitation email is sent immediately</li>
                  <li>• They'll receive a secure signup link</li>
                  <li>• Account is activated when they join</li>
                  <li>• You can track the invitation status</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-4 pt-6 border-t">
          <Link href="/settings/team">
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={loading}
            className="bg-teal-600 hover:bg-teal-700 text-white min-w-[120px]"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Sending...
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                Send Invitation
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}