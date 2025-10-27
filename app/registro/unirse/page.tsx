'use client'

import type React from 'react'

import { useState } from 'react'
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
import { ArrowLeft, Eye, EyeOff, Info } from 'lucide-react'
import { getSupabaseClient, isSupabaseConfigured } from '@/app/lib/supabaseClient'
import { useToast } from '@/hooks/use-toast'

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

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      if (formData.password !== formData.confirmPassword) {
        toast({ title: 'Las contraseñas no coinciden' })
        return
      }
      const supabase = getSupabaseClient()
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: { full_name: formData.fullName, phone: formData.phone },
        },
      })
      if (error) {
        toast({ title: 'No se pudo crear la cuenta', description: error.message })
        return
      }
      if (data?.user) {
        // Ensure session
        let session = data.session
        if (!session) {
          const { data: signInData } = await supabase.auth.signInWithPassword({
            email: formData.email,
            password: formData.password,
          })
          session = signInData.session ?? null
        }

        if (!session) {
          toast({
            title: 'Verifica tu correo',
            description: 'Confirma tu email para completar la unión al club.',
          })
          router.push('/registro/exito?type=unirse')
          return
        }

        const resp = await fetch('/api/organizations/join', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
          },
          body: JSON.stringify({
            clubCode: formData.clubCode,
            role: 'member',
            message: formData.message,
            ...(process.env.NODE_ENV === 'development' && !session ? { userEmail: formData.email } : {}),
          }),
        })
        if (!resp.ok) {
          const j = await resp.json().catch(() => ({}))
          toast({ title: 'No se pudo unir al club', description: j.error || 'Error' })
          return
        }
        router.push('/registro/exito?type=unirse')
      }
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
            {!isSupabaseConfigured() ? (
              <div className='text-sm text-red-600'>
                Falta configuración de entorno. Define `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
              </div>
            ) : (
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
                    onChange={(e) => handleInputChange('email', e.target.value)}
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
                    onChange={(e) => handleInputChange('phone', e.target.value)}
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
                  <Label htmlFor='clubCode'>Código de acceso del club *</Label>
                  <Input
                    id='clubCode'
                    value={formData.clubCode}
                    onChange={(e) =>
                      handleInputChange(
                        'clubCode',
                        e.target.value.toUpperCase()
                      )
                    }
                    placeholder='ABC12345'
                    className='h-11 font-mono tracking-wider'
                    maxLength={8}
                    required
                  />
                  <p className='text-xs text-muted-foreground'>
                    Solicita este código al administrador de tu club
                  </p>
                </div>

                <div className='space-y-1'>
                  <Label htmlFor='role'>Rol solicitado *</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => handleInputChange('role', value)}
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
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className='flex items-center space-x-2'>
                      <div className='w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin' />
                      <span>Enviando solicitud...</span>
                    </div>
                  ) : (
                    'Enviar solicitud'
                  )}
                </Button>
              </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
