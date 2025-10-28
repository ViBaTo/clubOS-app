'use client'

import type React from 'react'

import { useState } from 'react'
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
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'
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
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [isSendingReset, setIsSendingReset] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  })

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
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              access_token: data.session.access_token,
              refresh_token: data.session.refresh_token,
            }),
          })

          if (!response.ok) {
            throw new Error('Failed to sync session')
          }

          router.push('/clientes')
        } catch (syncError) {
          toast({
            title: 'Error de sincronización',
            description: 'Login exitoso pero error al sincronizar sesión. Intenta refrescar la página.'
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

      {/* Reset Password Dialog */}
      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restablecer contraseña</DialogTitle>
            <DialogDescription>
              Ingresa tu email y te enviaremos un enlace para restablecer tu
              contraseña.
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
              />
            </div>
          </div>
          <DialogFooter>
            <Button
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
                    title: 'Email enviado',
                    description:
                      'Revisa tu bandeja y sigue el enlace para continuar. Por favor revisa en la carpeta de spam si no lo encuentras.'
                  })
                  setResetOpen(false)
                } finally {
                  setIsSendingReset(false)
                }
              }}
            >
              {isSendingReset ? 'Enviando…' : 'Enviar enlace'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
