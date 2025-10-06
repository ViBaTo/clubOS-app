'use client'

import type React from 'react'

import { useState } from 'react'
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
import { Checkbox } from '@/components/ui/checkbox'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'
import Link from 'next/link'

interface LoginFormData {
  email: string
  password: string
  rememberMe: boolean
}

export default function LoginPage() {
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
    rememberMe: false
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Partial<LoginFormData>>({})

  const validateForm = (): boolean => {
    const newErrors: Partial<LoginFormData> = {}

    if (!formData.email) {
      newErrors.email = 'El email es requerido'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido'
    }

    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida'
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      // Handle successful login here
      console.log('Login successful', formData)
    }, 2000)
  }

  const handleInputChange = (
    field: keyof LoginFormData,
    value: string | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-[#FBFAFC] via-[#F1F5F9] to-[#E2E8F0] flex items-center justify-center p-4'>
      <div className='relative w-full max-w-md'>
        {/* Logo and Branding */}
        <div className='text-center mb-8'>
          <div className='inline-flex items-center justify-center w-16 h-16 bg-[#14B8A6] rounded-2xl mb-4 shadow-lg'>
            <span className='text-2xl font-bold text-white'>C</span>
          </div>
          <h1 className='text-3xl font-bold text-[#0F172A] mb-2'>ClubOS</h1>
          <p className='text-[#64748B] text-sm font-medium'>
            Gestiona tu club deportivo con facilidad
          </p>
        </div>

        {/* Login Card */}
        <Card className='shadow-xl border-0 bg-white/80 backdrop-blur-sm'>
          <CardHeader className='space-y-1 pb-6'>
            <CardTitle className='text-2xl font-semibold text-center text-[#0F172A]'>
              Iniciar sesión
            </CardTitle>
            <CardDescription className='text-center text-[#64748B]'>
              Ingresa tus credenciales para acceder al panel
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className='space-y-4'>
              {/* Email Field */}
              <div className='space-y-2'>
                <Label
                  htmlFor='email'
                  className='text-sm font-medium text-[#0F172A]'
                >
                  Email o usuario
                </Label>
                <div className='relative'>
                  <Mail className='absolute left-3 top-1/2 transform -translate-y-1/2 text-[#64748B] h-4 w-4' />
                  <Input
                    id='email'
                    type='email'
                    placeholder='tu@email.com'
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`pl-10 h-11 bg-[#F8FAFC] border-[#E2E8F0] focus:border-[#14B8A6] focus:ring-[#14B8A6] ${
                      errors.email
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                        : ''
                    }`}
                    disabled={isLoading}
                  />
                </div>
                {errors.email && (
                  <p className='text-sm text-red-500 mt-1'>{errors.email}</p>
                )}
              </div>

              {/* Password Field */}
              <div className='space-y-2'>
                <Label
                  htmlFor='password'
                  className='text-sm font-medium text-[#0F172A]'
                >
                  Contraseña
                </Label>
                <div className='relative'>
                  <Lock className='absolute left-3 top-1/2 transform -translate-y-1/2 text-[#64748B] h-4 w-4' />
                  <Input
                    id='password'
                    type={showPassword ? 'text' : 'password'}
                    placeholder='••••••••'
                    value={formData.password}
                    onChange={(e) =>
                      handleInputChange('password', e.target.value)
                    }
                    className={`pl-10 pr-10 h-11 bg-[#F8FAFC] border-[#E2E8F0] focus:border-[#14B8A6] focus:ring-[#14B8A6] ${
                      errors.password
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                        : ''
                    }`}
                    disabled={isLoading}
                  />
                  <button
                    type='button'
                    onClick={() => setShowPassword(!showPassword)}
                    className='absolute right-3 top-1/2 transform -translate-y-1/2 text-[#64748B] hover:text-[#0F172A] transition-colors'
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className='h-4 w-4' />
                    ) : (
                      <Eye className='h-4 w-4' />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className='text-sm text-red-500 mt-1'>{errors.password}</p>
                )}
              </div>

              {/* Remember Me */}
              <div className='flex items-center space-x-2 pt-2'>
                <Checkbox
                  id='remember'
                  checked={formData.rememberMe}
                  onCheckedChange={(checked) =>
                    handleInputChange('rememberMe', checked as boolean)
                  }
                  className='border-[#E2E8F0] data-[state=checked]:bg-[#14B8A6] data-[state=checked]:border-[#14B8A6]'
                  disabled={isLoading}
                />
                <Label
                  htmlFor='remember'
                  className='text-sm text-[#64748B] cursor-pointer select-none'
                >
                  Recordarme
                </Label>
              </div>

              {/* Submit Button */}
              <Button
                type='submit'
                className='w-full h-11 bg-[#14B8A6] hover:bg-[#0F9488] text-white font-medium transition-colors mt-6'
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className='flex items-center space-x-2'>
                    <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                    <span>Iniciando sesión...</span>
                  </div>
                ) : (
                  'Iniciar sesión'
                )}
              </Button>

              {/* Forgot Password Link */}
              <div className='text-center pt-4'>
                <button
                  type='button'
                  className='text-sm text-[#14B8A6] hover:text-[#0F9488] font-medium transition-colors'
                  disabled={isLoading}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Footer / Registro CTA */}
        <div className='text-center mt-6'>
          <p className='text-sm text-[#64748B] mb-4'>¿No tienes cuenta?</p>
          <Link href='/registro'>
            <Button
              variant='outline'
              className='w-full h-11 text-base font-medium border-2 bg-transparent'
            >
              Crear cuenta nueva
            </Button>
          </Link>
        </div>

        {/* Security Badge */}
        <div className='flex items-center justify-center mt-4 text-xs text-[#94A3B8]'>
          <Lock className='h-3 w-3 mr-1' />
          <span>Conexión segura SSL</span>
        </div>
      </div>
    </div>
  )
}
