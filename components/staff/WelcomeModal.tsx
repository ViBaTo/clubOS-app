'use client'

import { useEffect, useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Users, Award, BookOpen, Calendar, ArrowRight, CheckCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface WelcomeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userInfo: {
    name: string
    role: 'gestor' | 'admin' | 'profesor'
    organizationName: string
    specialties?: string[]
  }
  onStartTour?: () => void
  requiresPasswordSetup?: boolean
  onPasswordSubmit?: (password: string) => Promise<void>
}

const roleInfo = {
  gestor: {
    title: 'Manager',
    description: 'You have full access to manage all aspects of the club',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: Award,
    features: [
      'Manage staff and team members',
      'View financial reports and analytics',
      'Configure club settings and policies',
      'Access all system features'
    ]
  },
  admin: {
    title: 'Administrator',
    description: 'You can manage members, classes, and daily operations',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: Users,
    features: [
      'Manage club members',
      'Schedule and organize classes',
      'Handle daily operations',
      'View member analytics'
    ]
  },
  profesor: {
    title: 'Instructor',
    description: 'You can manage your classes and assigned members',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: BookOpen,
    features: [
      'Manage your assigned classes',
      'Track student attendance',
      'Update class schedules',
      'View your class analytics'
    ]
  }
}

export function WelcomeModal({
  open,
  onOpenChange,
  userInfo,
  onStartTour,
  requiresPasswordSetup = false,
  onPasswordSubmit
}: WelcomeModalProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSaved, setPasswordSaved] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const role = roleInfo[userInfo.role]
  const RoleIcon = role.icon

  const handlePasswordSave = async () => {
    if (!onPasswordSubmit) {
      setPasswordError('Password setup is currently unavailable. Please contact support.')
      return
    }
    if (savingPassword) return

    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters long')
      return
    }
    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match')
      return
    }

    try {
      setSavingPassword(true)
      await onPasswordSubmit(password)
      setPassword('')
      setConfirmPassword('')
      setPasswordError(null)
      setPasswordSaved(true)
    } catch (error: any) {
      setPasswordError(error?.message || 'Failed to update password')
    } finally {
      setSavingPassword(false)
    }
  }

  const steps = useMemo(() => {
    const onboardingSteps = [
      {
        title: `Welcome to ${userInfo.organizationName}!`,
        content: (
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <RoleIcon className="h-8 w-8 text-teal-600" />
              </div>
              <p className="text-gray-600 mb-4">
                Hi <span className="font-semibold text-gray-900">{userInfo.name}</span>! 
                You've been invited to join as:
              </p>
              <Badge className={`${role.color} border text-base px-4 py-2`}>
                {role.title}
              </Badge>
            </div>
            
            <Card className="bg-gray-50 border-gray-200">
              <CardContent className="p-4">
                <p className="text-sm text-gray-700">
                  {role.description}
                </p>
              </CardContent>
            </Card>

            {userInfo.specialties && userInfo.specialties.length > 0 && (
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Your specialties:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {userInfo.specialties.map((specialty, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      },
      {
        title: 'What you can do',
        content: (
          <div className="space-y-3">
            <p className="text-gray-600 text-center mb-6">
              Here's what you have access to as a {role.title}:
            </p>
            <div className="space-y-3">
              {role.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        )
      },
      {
        title: 'Ready to get started?',
        content: (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Calendar className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-gray-600">
              You're all set! You can explore the system on your own or take a quick tour 
              to see the main features.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {onStartTour && (
                <Button 
                  variant="outline" 
                  onClick={onStartTour}
                  className="flex items-center gap-2"
                >
                  <BookOpen className="h-4 w-4" />
                  Take Quick Tour
                </Button>
              )}
              <Button 
                onClick={() => onOpenChange(false)}
                className="bg-teal-600 hover:bg-teal-700 flex items-center gap-2"
                disabled={requiresPasswordSetup && !passwordSaved}
              >
                Start Exploring
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )
      }
    ]

    if (requiresPasswordSetup) {
      onboardingSteps.unshift({
        title: 'Create your password',
        content: (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 text-center">
              To secure your account, please create a password you will use to sign in next time.
            </p>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700" htmlFor="welcome-password">
                  New password
                </label>
                <Input
                  id="welcome-password"
                  type="password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value)
                    setPasswordError(null)
                  }}
                  placeholder="Enter a password"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700" htmlFor="welcome-password-confirm">
                  Confirm password
                </label>
                <Input
                  id="welcome-password-confirm"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => {
                    setConfirmPassword(event.target.value)
                    setPasswordError(null)
                  }}
                  placeholder="Repeat your password"
                />
              </div>
              {passwordError && (
                <Alert variant="destructive">
                  <AlertDescription>{passwordError}</AlertDescription>
                </Alert>
              )}
              {passwordSaved && !passwordError && (
                <Alert className="bg-teal-50 border-teal-100 text-teal-900">
                  <AlertDescription>Password saved successfully!</AlertDescription>
                </Alert>
              )}
              <Button
                onClick={handlePasswordSave}
                disabled={savingPassword}
                className="w-full bg-teal-600 hover:bg-teal-700"
              >
                {savingPassword ? 'Saving...' : 'Save Password'}
              </Button>
            </div>
          </div>
        )
      })
    }

    return onboardingSteps
  }, [
    RoleIcon,
    onStartTour,
    onOpenChange,
    password,
    confirmPassword,
    passwordError,
    passwordSaved,
    savingPassword,
    requiresPasswordSetup,
    role,
    userInfo.name,
    userInfo.organizationName,
    userInfo.role,
    userInfo.specialties
  ])

  const handleNext = () => {
    if (requiresPasswordSetup && currentStep === 0 && !passwordSaved) {
      setPasswordError('Please create your password before continuing')
      return
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onOpenChange(false)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  // Reset step when modal opens
  useEffect(() => {
    if (open) {
      setCurrentStep(0)
      setPassword('')
      setConfirmPassword('')
      setPasswordError(null)
      setPasswordSaved(false)
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-center">
            {steps[currentStep].title}
          </DialogTitle>
          {currentStep === 0 && (
            <DialogDescription className="text-center">
              Let's get you started with ClubOS
            </DialogDescription>
          )}
        </DialogHeader>
        
        <div className="py-6">
          {steps[currentStep].content}
        </div>

        {/* Progress indicator */}
        <div className="flex justify-center space-x-2 mb-4">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentStep 
                  ? 'bg-teal-600' 
                  : index < currentStep 
                    ? 'bg-teal-300' 
                    : 'bg-gray-300'
              }`}
            />
          ))}
        </div>

        {/* Navigation buttons */}
        {currentStep < steps.length - 1 && (
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              Previous
            </Button>
            <Button
              onClick={handleNext}
              className="bg-teal-600 hover:bg-teal-700"
              disabled={requiresPasswordSetup && currentStep === 0 && !passwordSaved}
            >
              Next
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}