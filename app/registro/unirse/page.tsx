'use client'

import type React from 'react'

import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

import { Alert, AlertDescription } from '../../../components/ui/alert'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Eye, EyeOff, Info, CheckCircle, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import type { 
  ValidateCodeResponse, 
  CreateInvitationRequest, 
  CreateInvitationResponse 
} from '@/app/types/notifications'

const ROLES = [
  'Gestor',
  'Profesor/Entrenador',
  'Administración',
  'Recepción',
  'Financiero'
]

export default function UnirsePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  // Club code validation state
  const [isValidatingCode, setIsValidatingCode] = useState(false)
  const [validatedOrganization, setValidatedOrganization] = useState<{
    id: string
    name: string
    clubType: string
    accessCode: string
  } | null>(null)
  const [codeValidationError, setCodeValidationError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    clubCode: '',
    role: '',
    message: ''
  })

  // Validate club access code
  const validateClubCode = async (accessCode: string) => {
    console.log('🔍 validateClubCode called with:', accessCode)
    
    if (accessCode.length < 6) {
      console.log('❌ Code too short, clearing state')
      setValidatedOrganization(null)
      setCodeValidationError(null)
      return
    }

    console.log('⏳ Starting validation for:', accessCode)
    setIsValidatingCode(true)
    setCodeValidationError(null)
    
    try {
      console.log('🔄 Making API call to /api/organizations/validate-code')
      const response = await fetch('/api/organizations/validate-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ accessCode })
      })

      console.log('📡 API response status:', response.status)
      const data: ValidateCodeResponse = await response.json()
      console.log('📦 API response data:', data)

      if (response.ok && data.valid && data.organization) {
        console.log('✅ Valid organization found:', data.organization.name)
        setValidatedOrganization(data.organization)
        setCodeValidationError(null)
      } else {
        console.log('❌ Invalid code or error:', data.error)
        setValidatedOrganization(null)
        setCodeValidationError(data.error || 'Código de acceso inválido')
      }
    } catch (error) {
      console.error('💥 Validation error:', error)
      setValidatedOrganization(null)
      setCodeValidationError('Error al validar el código')
    } finally {
      setIsValidatingCode(false)
    }
  }

  // Store debounce timeout reference
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(null)

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout)
      }
    }
  }, [debounceTimeout])

  const handleInputChange = (field: string, value: string) => {
    console.log('🔄 handleInputChange called with:', { field, value })
    setFormData((prev) => ({ ...prev, [field]: value }))
    
    // Validate club code when it changes
    if (field === 'clubCode') {
      const cleanCode = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8)
      console.log('🧹 Cleaned code:', cleanCode, 'from original:', value)
      setFormData((prev) => ({ ...prev, clubCode: cleanCode }))
      
      // Clear previous timeout
      if (debounceTimeout) {
        console.log('⏰ Clearing previous timeout')
        clearTimeout(debounceTimeout)
      }
      
      // Debounce validation
      console.log('⏳ Setting up new validation timeout for:', cleanCode)
      const timeoutId = setTimeout(() => {
        console.log('⚡ Timeout triggered, calling validateClubCode')
        validateClubCode(cleanCode)
      }, 300)
      
      setDebounceTimeout(timeoutId)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      console.log('📝 Form submission started')
      
      // Validate club code
      if (!validatedOrganization) {
        console.log('❌ No validated organization')
        toast({
          title: 'Código de club inválido',
          description: 'Por favor, ingresa un código de acceso válido'
        })
        return
      }

      console.log('✅ Validated organization:', validatedOrganization.name)

      // Create invitation request (no Auth signup here)
      const invitationRequest: CreateInvitationRequest = {
        accessCode: formData.clubCode,
        role: formData.role || 'member',
        message: formData.message,
        userEmail: formData.email,
        fullName: formData.fullName,
        phone: formData.phone
      }

      console.log('🔄 Sending invitation request:', invitationRequest)

      const response = await fetch('/api/invitations/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(invitationRequest)
      })

      const result = await response.json()
      console.log('📡 API response:', { status: response.status, result })

      if (!response.ok) {
        toast({
          title: 'Error al enviar solicitud',
          description: result.error || 'No se pudo procesar tu solicitud'
        })
        return
      }

      const invitationResult = result as CreateInvitationResponse

      // Success - redirect to success page with invitation info
      console.log('🎉 Success! Redirecting to success page')
      toast({
        title: '¡Solicitud enviada!',
        description: invitationResult.invitation.message
      })
      
      router.push(`/registro/exito?type=invitation&org=${encodeURIComponent(validatedOrganization.name)}`)
    } catch (error: any) {
      console.error('💥 Submit error:', error)
      toast({
        title: 'Error inesperado',
        description: error.message || 'Ocurrió un error al procesar tu solicitud'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getPasswordStrength = (password: string) => {
    if (password.length === 0) return { strength: 0, label: '' }
    if (password.length < 6)
      return { strength: 1, label: 'Débil', color: 'bg-red-500' }
    if (password.length < 10)
      return { strength: 2, label: 'Media', color: 'bg-yellow-500' }
    return { strength: 3, label: 'Fuerte', color: 'bg-green-500' }
  }

  const passwordStrength = getPasswordStrength(formData.password)

  return (
    <div className='h-screen overflow-hidden bg-gradient-to-br from-background via-background to-primary/5 py-4 px-4'>
      <div className='w-full max-w-5xl mx-auto'>
        {/* Back Button */}
        <Link
          href='/registro'
          className='inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors'
        >
          <ArrowLeft className='h-4 w-4' />
          Volver a opciones de registro
        </Link>

        {/* Header */}
        <div className='text-center mb-4'>
          <h1 className='text-2xl font-bold text-foreground mb-1'>
            Unirse a un club existente
          </h1>
          <p className='text-sm text-muted-foreground'>
            Completa el formulario para solicitar acceso
          </p>
        </div>

        {/* Form */}
        <Card className='border-0 shadow-xl'>
          <CardHeader className='pb-2'>
            <CardTitle className='text-xl'>Información personal</CardTitle>
            <CardDescription className='text-sm'>
              Proporciona tus datos para crear tu cuenta
            </CardDescription>
          </CardHeader>
          <CardContent className='pt-2'>
            <form onSubmit={handleSubmit} className='grid grid-cols-2 gap-6'>
                {/* Columna izquierda: Información personal */}
                <div className='space-y-3'>
                  <div className='space-y-1'>
                    <Label htmlFor='fullName'>Nombre completo *</Label>
                    <Input
                      id='fullName'
                      value={formData.fullName}
                      onChange={(e) =>
                        handleInputChange('fullName', e.target.value)
                      }
                      placeholder='Juan Pérez'
                      className='h-11'
                      required
                    />
                  </div>

                  <div className='space-y-1'>
                    <Label htmlFor='email'>Email *</Label>
                    <Input
                      id='email'
                      type='email'
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange('email', e.target.value)
                      }
                      placeholder='tu@email.com'
                      className='h-11'
                      required
                    />
                  </div>

                  <div className='space-y-1'>
                    <Label htmlFor='password'>Contraseña *</Label>
                    <div className='relative'>
                      <Input
                        id='password'
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) =>
                          handleInputChange('password', e.target.value)
                        }
                        placeholder='••••••••'
                        className='h-11 pr-10'
                        required
                      />
                      <button
                        type='button'
                        onClick={() => setShowPassword(!showPassword)}
                        className='absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors'
                      >
                        {showPassword ? (
                          <EyeOff className='h-4 w-4' />
                        ) : (
                          <Eye className='h-4 w-4' />
                        )}
                      </button>
                    </div>
                    {formData.password && (
                      <div className='space-y-1'>
                        <div className='flex gap-1'>
                          {[1, 2, 3].map((level) => (
                            <div
                              key={level}
                              className={`h-1 flex-1 rounded-full transition-colors ${
                                level <= passwordStrength.strength
                                  ? passwordStrength.color
                                  : 'bg-border'
                              }`}
                            />
                          ))}
                        </div>
                        <p className='text-xs text-muted-foreground'>
                          Seguridad:{' '}
                          {passwordStrength.label || 'Ingresa una contraseña'}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className='space-y-1'>
                    <Label htmlFor='confirmPassword'>
                      Confirmar contraseña *
                    </Label>
                    <div className='relative'>
                      <Input
                        id='confirmPassword'
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={(e) =>
                          handleInputChange('confirmPassword', e.target.value)
                        }
                        placeholder='••••••••'
                        className='h-11 pr-10'
                        required
                      />
                      <button
                        type='button'
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className='absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors'
                      >
                        {showConfirmPassword ? (
                          <EyeOff className='h-4 w-4' />
                        ) : (
                          <Eye className='h-4 w-4' />
                        )}
                      </button>
                    </div>
                    {formData.confirmPassword &&
                      formData.password !== formData.confirmPassword && (
                        <p className='text-xs text-red-500'>
                          Las contraseñas no coinciden
                        </p>
                      )}
                  </div>

                  <div className='space-y-1'>
                    <Label htmlFor='phone'>Teléfono *</Label>
                    <Input
                      id='phone'
                      type='tel'
                      value={formData.phone}
                      onChange={(e) =>
                        handleInputChange('phone', e.target.value)
                      }
                      placeholder='+34 600 000 000'
                      className='h-11'
                      required
                    />
                  </div>
                </div>

                {/* Columna derecha: Acceso al club y envío */}
                <div className='space-y-3'>
                  <h3 className='text-lg font-semibold'>Acceso al club</h3>

                  <div className='space-y-1'>
                    <Label htmlFor='clubCode'>
                      Código de acceso del club *
                    </Label>
                    <div className='relative'>
                      <Input
                        id='clubCode'
                        value={formData.clubCode}
                        onChange={(e) =>
                          handleInputChange('clubCode', e.target.value)
                        }
                        placeholder='LPEQ546'
                        className={cn(
                          'h-11 font-mono tracking-wider pr-10',
                          validatedOrganization && 'border-green-500',
                          codeValidationError && formData.clubCode.length >= 6 && 'border-red-500'
                        )}
                        maxLength={8}
                        required
                      />
                      <div className='absolute right-3 top-1/2 transform -translate-y-1/2'>
                        {isValidatingCode ? (
                          <Loader2 className='h-4 w-4 animate-spin text-muted-foreground' />
                        ) : validatedOrganization ? (
                          <CheckCircle className='h-4 w-4 text-green-500' />
                        ) : codeValidationError && formData.clubCode.length >= 6 ? (
                          <div className='h-4 w-4 rounded-full bg-red-500 flex items-center justify-center'>
                            <span className='text-white text-xs'>!</span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                    
                    {/* Organization validation feedback */}
                    {validatedOrganization && (
                      <div className='p-2 bg-green-50 border border-green-200 rounded-md'>
                        <div className='flex items-center gap-2'>
                          <CheckCircle className='h-4 w-4 text-green-600' />
                          <div>
                            <p className='text-sm font-medium text-green-800'>
                              Club encontrado: {validatedOrganization.name}
                            </p>
                            <p className='text-xs text-green-600'>
                              Tipo: {validatedOrganization.clubType}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {codeValidationError && formData.clubCode.length >= 6 && (
                      <div className='p-2 bg-red-50 border border-red-200 rounded-md'>
                        <div className='flex items-center gap-2'>
                          <div className='h-4 w-4 rounded-full bg-red-500 flex items-center justify-center'>
                            <span className='text-white text-xs'>!</span>
                          </div>
                          <p className='text-sm text-red-800'>
                            {codeValidationError}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {!validatedOrganization && !codeValidationError && (
                      <p className='text-xs text-muted-foreground'>
                        Solicita este código al administrador de tu club
                      </p>
                    )}
                  </div>

                  <div className='space-y-1'>
                    <Label htmlFor='role'>Rol solicitado *</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value) =>
                        handleInputChange('role', value)
                      }
                    >
                      <SelectTrigger id='role' className='h-11'>
                        <SelectValue placeholder='Selecciona tu rol' />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map((role) => (
                          <SelectItem key={role} value={role}>
                            {role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className='space-y-1'>
                    <Label htmlFor='message'>
                      Mensaje para el administrador (opcional)
                    </Label>
                    <Textarea
                      id='message'
                      value={formData.message}
                      onChange={(e) =>
                        handleInputChange('message', e.target.value)
                      }
                      placeholder='Cuéntale al administrador sobre tu experiencia y por qué quieres unirte...'
                      className='min-h-24 resize-none'
                    />
                  </div>

                  {/* Aviso de verificación */}
                  <Alert>
                    <Info className='h-4 w-4' />
                    <AlertDescription>
                      Tu solicitud será revisada por el administrador del club.
                      Recibirás un email cuando sea aprobada.
                    </AlertDescription>
                  </Alert>

                  {/* Botón de envío */}
                  <Button
                    type='submit'
                    className='w-full h-11 text-base font-medium'
                    disabled={isLoading || !validatedOrganization || isValidatingCode}
                  >
                    {isLoading ? (
                      <div className='flex items-center space-x-2'>
                        <Loader2 className='w-4 h-4 animate-spin' />
                        <span>Enviando solicitud...</span>
                      </div>
                    ) : (
                      'Enviar solicitud'
                    )}
                  </Button>
                </div>
              </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
