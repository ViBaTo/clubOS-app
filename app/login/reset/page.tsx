'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Eye, EyeOff, Lock, Mail, KeyRound } from 'lucide-react'
import { getSupabaseClient } from '@/app/lib/supabaseClient'
import { useToast } from '@/hooks/use-toast'

type Step = 'code' | 'password'

export default function ResetPasswordPage() {
  const router = useRouter()
  const search = useSearchParams()
  const { toast } = useToast()
  
  // Step management
  const [step, setStep] = useState<Step>('code')
  
  // Code verification
  const [email, setEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  
  // Password update
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  // Session state
  const [ready, setReady] = useState(false)
  const [hasRecoveryContext, setHasRecoveryContext] = useState(false)
  const [hasSession, setHasSession] = useState(false)

  useEffect(() => {
    const init = async () => {
      const supabase = getSupabaseClient()

      const hash = typeof window !== 'undefined' ? window.location.hash : ''
      const hashParams = new URLSearchParams(
        hash.startsWith('#') ? hash.slice(1) : hash
      )
      const typeFromHash = hashParams.get('type')
      const typeFromQuery = search.get('type')
      const accessToken = hashParams.get('access_token')
      const code =
        search.get('code') ||
        hashParams.get('code') ||
        search.get('token') ||
        hashParams.get('token')

      const isRecovery =
        typeFromHash === 'recovery' ||
        typeFromQuery === 'recovery' ||
        Boolean(accessToken || code)

      setHasRecoveryContext(isRecovery)
      
      // Check for current session
      const { data: sessionData } = await supabase.auth.getSession()
      const sessionExists = Boolean(sessionData.session)
      setHasSession(sessionExists)
      
      // If we have a session from the link, go directly to password step
      if (sessionExists && isRecovery) {
        setStep('password')
      }
      
      setReady(true)
    }
    init()
  }, [search])

  // Keep session in sync while user lands from email link
  useEffect(() => {
    const supabase = getSupabaseClient()
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      setHasSession(Boolean(session))
      // If user just verified via link, move to password step
      if (event === 'PASSWORD_RECOVERY' && session) {
        setStep('password')
      }
    })
    return () => {
      sub.subscription.unsubscribe()
    }
  }, [])

  const canSubmitCode = email.length > 0 && otpCode.length === 6
  const canSubmitPassword = password.length >= 6 && password === confirm

  // Verify OTP code
  const handleVerifyCode = async () => {
    if (!canSubmitCode) return
    setIsVerifying(true)
    try {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otpCode,
        type: 'recovery'
      })
      
      if (error) {
        toast({ 
          title: 'Código inválido', 
          description: error.message || 'El código es incorrecto o ha expirado. Solicita uno nuevo.',
          variant: 'destructive'
        })
        return
      }
      
      if (data.session) {
        setHasSession(true)
        setStep('password')
        toast({
          title: 'Código verificado',
          description: 'Ahora puedes crear tu nueva contraseña.'
        })
      }
    } finally {
      setIsVerifying(false)
    }
  }

  // Update password
  const handleUpdate = async () => {
    if (!canSubmitPassword) return
    setIsLoading(true)
    try {
      const supabase = getSupabaseClient()
      const { error } = await supabase.auth.updateUser({ password })
      if (error) {
        toast({ title: 'No se pudo actualizar', description: error.message })
        return
      }
      toast({
        title: 'Contraseña actualizada',
        description: 'Ya puedes iniciar sesión.'
      })
      router.replace('/login')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4'>
      <div className='w-full max-w-md'>
        <Card className='border-0 shadow-xl'>
          <CardHeader className='space-y-1 pb-6'>
            <CardTitle className='text-2xl font-semibold text-center'>
              Restablecer contraseña
            </CardTitle>
            <CardDescription className='text-center text-muted-foreground'>
              {step === 'code' 
                ? 'Ingresa el código de 6 dígitos que recibiste por email'
                : 'Ingresa tu nueva contraseña para tu cuenta'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!ready ? (
              <div className='text-sm text-muted-foreground text-center'>
                Validando enlace…
              </div>
            ) : step === 'code' ? (
              // STEP 1: Enter code
              <div className='space-y-4'>
                <div className='space-y-2'>
                  <Label htmlFor='email' className='text-sm font-medium'>
                    Email
                  </Label>
                  <div className='relative'>
                    <Mail className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4' />
                    <Input
                      id='email'
                      type='email'
                      placeholder='tu@email.com'
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className='pl-10 h-11'
                    />
                  </div>
                </div>
                
                <div className='space-y-2'>
                  <Label htmlFor='otp' className='text-sm font-medium'>
                    Código de verificación
                  </Label>
                  <div className='relative'>
                    <KeyRound className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4' />
                    <Input
                      id='otp'
                      type='text'
                      inputMode='numeric'
                      pattern='[0-9]*'
                      maxLength={6}
                      placeholder='123456'
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      className='pl-10 h-11 text-center text-lg tracking-widest font-mono'
                    />
                  </div>
                  <p className='text-xs text-muted-foreground'>
                    Ingresa el código de 6 dígitos del email
                  </p>
                </div>

                <Button
                  className='w-full h-11 text-base font-medium'
                  disabled={!canSubmitCode || isVerifying}
                  onClick={handleVerifyCode}
                >
                  {isVerifying ? 'Verificando…' : 'Verificar código'}
                </Button>

                {hasRecoveryContext && (
                  <div className='text-center'>
                    <button
                      type='button'
                      className='text-sm text-primary hover:text-primary/80 font-medium transition-colors'
                      onClick={() => setStep('password')}
                    >
                      Ya abrí el enlace del email
                    </button>
                  </div>
                )}

                <div className='text-center pt-2'>
                  <button
                    type='button'
                    className='text-sm text-muted-foreground hover:text-foreground transition-colors'
                    onClick={() => router.push('/login')}
                  >
                    ← Volver al inicio de sesión
                  </button>
                </div>
              </div>
            ) : (
              // STEP 2: Set new password
              <div className='space-y-4'>
                {!hasSession && (
                  <div className='bg-amber-50 border border-amber-200 rounded-lg p-3'>
                    <p className='text-sm text-amber-800'>
                      No detectamos una sesión de recuperación activa. 
                      <button
                        type='button'
                        className='text-amber-900 underline ml-1 font-medium'
                        onClick={() => setStep('code')}
                      >
                        Ingresa el código
                      </button>
                      {' '}o abre el enlace del email.
                    </p>
                  </div>
                )}
                
                <div className='space-y-2'>
                  <Label htmlFor='password' className='text-sm font-medium'>
                    Nueva contraseña
                  </Label>
                  <div className='relative'>
                    <Lock className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4' />
                    <Input
                      id='password'
                      type={showPassword ? 'text' : 'password'}
                      placeholder='••••••••'
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className='pl-10 pr-10 h-11'
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
                
                <div className='space-y-2'>
                  <Label htmlFor='confirm' className='text-sm font-medium'>
                    Confirmar contraseña
                  </Label>
                  <div className='relative'>
                    <Lock className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4' />
                    <Input
                      id='confirm'
                      type={showPassword ? 'text' : 'password'}
                      placeholder='••••••••'
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      className='pl-10 pr-10 h-11'
                    />
                  </div>
                </div>
                
                {password && confirm && password !== confirm && (
                  <p className='text-sm text-red-600'>
                    Las contraseñas no coinciden
                  </p>
                )}
                {password && password.length > 0 && password.length < 6 && (
                  <p className='text-sm text-red-600'>
                    La contraseña debe tener al menos 6 caracteres
                  </p>
                )}
                
                <Button
                  className='w-full h-11 text-base font-medium'
                  disabled={!canSubmitPassword || isLoading || !hasSession}
                  onClick={handleUpdate}
                >
                  {isLoading ? 'Actualizando…' : 'Actualizar contraseña'}
                </Button>

                <div className='text-center pt-2'>
                  <button
                    type='button'
                    className='text-sm text-muted-foreground hover:text-foreground transition-colors'
                    onClick={() => router.push('/login')}
                  >
                    ← Volver al inicio de sesión
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
