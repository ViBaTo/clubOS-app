'use client'

import type React from 'react'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Eye, EyeOff, Mail, Lock, KeyRound, ArrowLeft, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  getSupabaseClient,
  isSupabaseConfigured
} from '@/app/lib/supabaseClient'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [isSendingReset, setIsSendingReset] = useState(false)
  const [resetStep, setResetStep] = useState<'email' | 'otp' | 'password'>('email')
  const [otpCode, setOtpCode] = useState('')
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  })

  // Handle auth callback errors
  useEffect(() => {
    const error = searchParams.get('error')
    if (error) {
      let errorMessage = 'Authentication failed'
      
      switch (error) {
        case 'missing_code':
          errorMessage = 'Invalid invitation link'
          break
        case 'session_failed':
          errorMessage = 'Failed to create session. Please try again.'
          break
        case 'callback_failed':
          errorMessage = 'Authentication callback failed. Please try again.'
          break
        default:
          errorMessage = decodeURIComponent(error)
      }

      toast({
        title: 'Authentication Error',
        description: errorMessage,
        variant: 'destructive'
      })
    }
  }, [searchParams, toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      })
      if (error) {
        const code = (error as any).status || 400
        const raw = error.message || 'Error de autenticación'
        let msg = raw
        if (raw.toLowerCase().includes('invalid login credentials')) {
          msg = 'Credenciales inválidas. Verifica tu email y contraseña.'
        } else if (
          raw.toLowerCase().includes('email') &&
          raw.toLowerCase().includes('confirm')
        ) {
          msg = 'Email no confirmado. Revisa tu bandeja de entrada.'
        }
        toast({
          title: `No se pudo iniciar sesión (${code})`,
          description: msg
        })
        return
      }
      if (data?.user && data?.session) {
        // Sync the session with the server to create HTTP cookies
        try {
          const response = await fetch('/api/auth/callback', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              access_token: data.session.access_token,
              refresh_token: data.session.refresh_token
            })
          })

          if (!response.ok) {
            throw new Error('Failed to sync session')
          }

          router.push('/clientes')
        } catch (syncError) {
          toast({
            title: 'Error de sincronización',
            description:
              'Login exitoso pero error al sincronizar sesión. Intenta refrescar la página.'
          })
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4'>
      <div className='w-full max-w-md'>
        {/* Logo and Branding */}
        <div className='text-center mb-8'>
          <div className='inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4'>
            <span className='text-2xl font-bold text-primary-foreground'>
              CO
            </span>
          </div>
          <h1 className='text-3xl font-bold text-foreground mb-2'>ClubOS</h1>
          <p className='text-muted-foreground text-balance'>
            Gestiona tu club deportivo con facilidad
          </p>
        </div>

        {/* Login Form */}
        <Card className='border-0 shadow-xl'>
          <CardHeader className='space-y-1 pb-6'>
            <CardTitle className='text-2xl font-semibold text-center'>
              Iniciar sesión
            </CardTitle>
            <CardDescription className='text-center text-muted-foreground'>
              Ingresa tus credenciales para acceder al panel
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!isSupabaseConfigured() ? (
              <div className='text-sm text-red-600'>
                Falta configuración de entorno. Define
                `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className='space-y-4'>
                {/* Email/Username Field */}
                <div className='space-y-2'>
                  <Label htmlFor='email' className='text-sm font-medium'>
                    Email o usuario
                  </Label>
                  <div className='relative'>
                    <Mail className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4' />
                    <Input
                      id='email'
                      type='email'
                      placeholder='tu@email.com'
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange('email', e.target.value)
                      }
                      className='pl-10 h-11'
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className='space-y-2'>
                  <Label htmlFor='password' className='text-sm font-medium'>
                    Contraseña
                  </Label>
                  <div className='relative'>
                    <Lock className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4' />
                    <Input
                      id='password'
                      type={showPassword ? 'text' : 'password'}
                      placeholder='••••••••'
                      value={formData.password}
                      onChange={(e) =>
                        handleInputChange('password', e.target.value)
                      }
                      className='pl-10 pr-10 h-11'
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
                </div>

                {/* Remember Me Checkbox */}
                <div className='flex items-center space-x-2'>
                  <Checkbox
                    id='remember'
                    checked={formData.rememberMe}
                    onCheckedChange={(checked) =>
                      handleInputChange('rememberMe', checked as boolean)
                    }
                  />
                  <Label
                    htmlFor='remember'
                    className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
                  >
                    Recordarme
                  </Label>
                </div>

                {/* Submit Button */}
                <Button
                  type='submit'
                  className='w-full h-11 text-base font-medium'
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className='flex items-center space-x-2'>
                      <div className='w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin' />
                      <span>Iniciando sesión...</span>
                    </div>
                  ) : (
                    'Iniciar sesión'
                  )}
                </Button>

                {/* Forgot Password Link */}
                <div className='text-center'>
                  <button
                    type='button'
                    className='text-sm text-primary hover:text-primary/80 font-medium transition-colors'
                    onClick={() => setResetOpen(true)}
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        <div className='text-center mt-6'>
          <p className='text-sm text-muted-foreground mb-4'>
            ¿No tienes cuenta?{' '}
          </p>
          <Link href='/registro'>
            <Button
              variant='outline'
              className='w-full h-11 text-base font-medium border-2 bg-transparent'
            >
              Crear cuenta nueva
            </Button>
          </Link>
        </div>
      </div>

      {/* Reset Password Dialog - Multi-step */}
      <Dialog 
        open={resetOpen} 
        onOpenChange={(open) => {
          setResetOpen(open)
          if (!open) {
            // Reset state when closing
            setResetStep('email')
            setResetEmail('')
            setOtpCode('')
            setNewPassword('')
            setConfirmPassword('')
          }
        }}
      >
        <DialogContent className='sm:max-w-md'>
          {/* Step 1: Email */}
          {resetStep === 'email' && (
            <>
              <DialogHeader>
                <DialogTitle>Restablecer contraseña</DialogTitle>
                <DialogDescription>
                  Ingresa tu email y te enviaremos un código para restablecer tu contraseña.
                </DialogDescription>
              </DialogHeader>
              <div className='space-y-3'>
                <Label htmlFor='reset-email' className='text-sm font-medium'>
                  Email
                </Label>
                <div className='relative'>
                  <Mail className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4' />
                  <Input
                    id='reset-email'
                    type='email'
                    placeholder='tu@email.com'
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className='pl-10 h-11'
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && resetEmail) {
                        e.preventDefault()
                        document.getElementById('send-reset-btn')?.click()
                      }
                    }}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  id='send-reset-btn'
                  type='button'
                  disabled={isSendingReset || !resetEmail}
                  onClick={async () => {
                    if (!resetEmail) return
                    setIsSendingReset(true)
                    try {
                      const supabase = getSupabaseClient()
                      const appUrl =
                        process.env.NEXT_PUBLIC_APP_URL || window.location.origin
                      const redirectTo = `${appUrl}/login/reset`
                      const { error } = await supabase.auth.resetPasswordForEmail(
                        resetEmail,
                        { redirectTo }
                      )
                      if (error) {
                        toast({
                          title: 'No se pudo enviar el email',
                          description: error.message
                        })
                        return
                      }
                      toast({
                        title: 'Código enviado',
                        description: 'Revisa tu bandeja de entrada (y spam).'
                      })
                      setResetStep('otp')
                    } finally {
                      setIsSendingReset(false)
                    }
                  }}
                >
                  {isSendingReset ? 'Enviando…' : 'Enviar código'}
                </Button>
              </DialogFooter>
            </>
          )}

          {/* Step 2: OTP Code */}
          {resetStep === 'otp' && (
            <>
              <DialogHeader>
                <div className='flex items-center gap-2'>
                  <button
                    type='button'
                    onClick={() => setResetStep('email')}
                    className='p-1 hover:bg-muted rounded-md transition-colors'
                  >
                    <ArrowLeft className='h-4 w-4' />
                  </button>
                  <DialogTitle>Ingresa el código</DialogTitle>
                </div>
                <DialogDescription>
                  Enviamos un código de 6 dígitos a <strong>{resetEmail}</strong>
                </DialogDescription>
              </DialogHeader>
              <div className='space-y-4'>
                <div className='space-y-2'>
                  <Label htmlFor='otp-code' className='text-sm font-medium'>
                    Código de verificación
                  </Label>
                  <div className='relative'>
                    <KeyRound className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4' />
                    <Input
                      id='otp-code'
                      type='text'
                      inputMode='numeric'
                      pattern='[0-9]*'
                      maxLength={6}
                      placeholder='123456'
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      className='pl-10 h-12 text-center text-xl tracking-[0.5em] font-mono'
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && otpCode.length === 6) {
                          e.preventDefault()
                          document.getElementById('verify-otp-btn')?.click()
                        }
                      }}
                    />
                  </div>
                </div>
                <button
                  type='button'
                  className='text-sm text-primary hover:text-primary/80 transition-colors'
                  onClick={async () => {
                    setIsSendingReset(true)
                    try {
                      const supabase = getSupabaseClient()
                      const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
                      await supabase.auth.resetPasswordForEmail(resetEmail, {
                        redirectTo: `${appUrl}/login/reset`
                      })
                      toast({
                        title: 'Código reenviado',
                        description: 'Revisa tu bandeja de entrada.'
                      })
                    } finally {
                      setIsSendingReset(false)
                    }
                  }}
                  disabled={isSendingReset}
                >
                  {isSendingReset ? 'Reenviando…' : '¿No recibiste el código? Reenviar'}
                </button>
              </div>
              <DialogFooter>
                <Button
                  id='verify-otp-btn'
                  type='button'
                  disabled={isVerifyingOtp || otpCode.length !== 6}
                  className='w-full'
                  onClick={async () => {
                    if (otpCode.length !== 6) return
                    setIsVerifyingOtp(true)
                    try {
                      const supabase = getSupabaseClient()
                      const { data, error } = await supabase.auth.verifyOtp({
                        email: resetEmail,
                        token: otpCode,
                        type: 'recovery'
                      })
                      if (error) {
                        toast({
                          title: 'Código inválido',
                          description: 'El código es incorrecto o ha expirado.',
                          variant: 'destructive'
                        })
                        return
                      }
                      if (data.session) {
                        toast({
                          title: 'Código verificado',
                          description: 'Ahora crea tu nueva contraseña.'
                        })
                        setResetStep('password')
                      }
                    } finally {
                      setIsVerifyingOtp(false)
                    }
                  }}
                >
                  {isVerifyingOtp ? 'Verificando…' : 'Verificar código'}
                </Button>
              </DialogFooter>
            </>
          )}

          {/* Step 3: New Password */}
          {resetStep === 'password' && (
            <>
              <DialogHeader>
                <div className='flex items-center gap-3 mb-2'>
                  <div className='p-2 bg-green-100 rounded-full'>
                    <CheckCircle className='h-5 w-5 text-green-600' />
                  </div>
                  <DialogTitle>Crear nueva contraseña</DialogTitle>
                </div>
                <DialogDescription>
                  Ingresa tu nueva contraseña para la cuenta <strong>{resetEmail}</strong>
                </DialogDescription>
              </DialogHeader>
              <div className='space-y-4'>
                <div className='space-y-2'>
                  <Label htmlFor='new-password' className='text-sm font-medium'>
                    Nueva contraseña
                  </Label>
                  <div className='relative'>
                    <Lock className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4' />
                    <Input
                      id='new-password'
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder='••••••••'
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className='pl-10 pr-10 h-11'
                      autoFocus
                    />
                    <button
                      type='button'
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className='absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors'
                    >
                      {showNewPassword ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
                    </button>
                  </div>
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='confirm-password' className='text-sm font-medium'>
                    Confirmar contraseña
                  </Label>
                  <div className='relative'>
                    <Lock className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4' />
                    <Input
                      id='confirm-password'
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder='••••••••'
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className='pl-10 h-11'
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newPassword.length >= 6 && newPassword === confirmPassword) {
                          e.preventDefault()
                          document.getElementById('update-password-btn')?.click()
                        }
                      }}
                    />
                  </div>
                </div>
                {newPassword && confirmPassword && newPassword !== confirmPassword && (
                  <p className='text-sm text-red-600'>Las contraseñas no coinciden</p>
                )}
                {newPassword && newPassword.length > 0 && newPassword.length < 6 && (
                  <p className='text-sm text-red-600'>Mínimo 6 caracteres</p>
                )}
              </div>
              <DialogFooter>
                <Button
                  id='update-password-btn'
                  type='button'
                  disabled={isUpdatingPassword || newPassword.length < 6 || newPassword !== confirmPassword}
                  className='w-full'
                  onClick={async () => {
                    if (newPassword.length < 6 || newPassword !== confirmPassword) return
                    setIsUpdatingPassword(true)
                    try {
                      const supabase = getSupabaseClient()
                      const { error } = await supabase.auth.updateUser({ password: newPassword })
                      if (error) {
                        toast({
                          title: 'Error',
                          description: error.message,
                          variant: 'destructive'
                        })
                        return
                      }
                      toast({
                        title: 'Contraseña actualizada',
                        description: 'Ya puedes iniciar sesión con tu nueva contraseña.'
                      })
                      setResetOpen(false)
                      // Pre-fill the email for convenience
                      setFormData(prev => ({ ...prev, email: resetEmail }))
                    } finally {
                      setIsUpdatingPassword(false)
                    }
                  }}
                >
                  {isUpdatingPassword ? 'Actualizando…' : 'Actualizar contraseña'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
