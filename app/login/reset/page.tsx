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
import { Eye, EyeOff, Lock } from 'lucide-react'
import { getSupabaseClient } from '@/app/lib/supabaseClient'
import { useToast } from '@/hooks/use-toast'

export default function ResetPasswordPage() {
  const router = useRouter()
  const search = useSearchParams()
  const { toast } = useToast()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [ready, setReady] = useState(false)
  const [hasRecoveryContext, setHasRecoveryContext] = useState(false)
  const [hasSession, setHasSession] = useState(false)

  useEffect(() => {
    const init = async () => {
      // Initialize client early so it can process tokens from the URL hash
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
      // Check for current session (client may have parsed the hash already)
      const { data: sessionData } = await supabase.auth.getSession()
      setHasSession(Boolean(sessionData.session))
      // Always allow the form; updateUser will error if ticket is invalid
      setReady(true)
    }
    init()
  }, [search])

  // Keep session in sync while user lands from email link
  useEffect(() => {
    const supabase = getSupabaseClient()
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setHasSession(Boolean(session))
    })
    return () => {
      sub.subscription.unsubscribe()
    }
  }, [])

  const canSubmit = password.length >= 6 && password === confirm

  const handleUpdate = async () => {
    if (!canSubmit) return
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
              Ingresa tu nueva contraseña para tu cuenta
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!ready ? (
              <div className='text-sm text-muted-foreground'>
                Validando enlace…
              </div>
            ) : (
              <div className='space-y-4'>
                {!hasRecoveryContext && (
                  <p className='text-sm text-muted-foreground'>
                    No detectamos un enlace de recuperación activo. Si el enlace
                    ha caducado o fue modificado, solicita uno nuevo desde la
                    pantalla de inicio de sesión.
                  </p>
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
                {!hasSession && (
                  <p className='text-sm text-muted-foreground'>
                    Preparando la sesión de recuperación… Si no avanza, abre el
                    enlace directamente desde el correo o solicita uno nuevo.
                  </p>
                )}
                <Button
                  className='w-full h-11 text-base font-medium'
                  disabled={!canSubmit || isLoading || !hasSession}
                  onClick={handleUpdate}
                >
                  {isLoading ? 'Actualizando…' : 'Actualizar contraseña'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
