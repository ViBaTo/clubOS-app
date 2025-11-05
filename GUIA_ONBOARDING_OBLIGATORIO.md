# Guía Completa: Implementar Onboarding Obligatorio para Staff Invitado

## 📋 Resumen Ejecutivo

Esta guía documenta cómo implementar un sistema de **onboarding obligatorio y bloqueante** para usuarios invitados en una aplicación Next.js con Supabase Auth.

**Tiempo de implementación**: 2-3 horas
**Nivel de dificultad**: Intermedio
**Stack**: Next.js 14+, Supabase, TypeScript, React

---

## 🎯 Objetivo

Crear un flujo donde usuarios invitados:
1. ✅ NO puedan acceder a ningún contenido sin completar onboarding
2. ✅ DEBAN configurar una contraseña obligatoriamente
3. ✅ NO puedan cerrar el modal de onboarding prematuramente
4. ✅ Vean una pantalla bloqueante hasta completar el proceso

---

## 🏗️ Arquitectura de la Solución

```
┌─────────────────────────────────────────────────────────────┐
│                  Root Layout (app/layout.tsx)               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │         OnboardingLayout (Global Wrapper)             │  │
│  │                                                        │  │
│  │  ┌──────────────────────────────────────────────────┐ │  │
│  │  │      OnboardingGuard (Content Blocker)          │ │  │
│  │  │                                                  │ │  │
│  │  │  ┌────────────────────────────────────────────┐ │ │  │
│  │  │  │         App Content (Protected)           │ │ │  │
│  │  │  │  - Dashboard                              │ │ │  │
│  │  │  │  - All Routes                             │ │ │  │
│  │  │  └────────────────────────────────────────────┘ │ │  │
│  │  └──────────────────────────────────────────────────┘ │  │
│  │                                                        │  │
│  │  WelcomeModal (z-50, non-closable)                    │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Componentes de la Solución

### 1. Base de Datos (Supabase)

#### Campo de Tracking Explícito

**Problema**: `password_updated_at` de Supabase Auth no es confiable (se establece automáticamente).

**Solución**: Agregar campo booleano explícito en tu tabla de usuarios.

```sql
-- Archivo: supabase/migrations/004_add_password_setup_tracking.sql

-- 1. Agregar columna
ALTER TABLE tu_tabla_de_staff
ADD COLUMN IF NOT EXISTS password_set_during_onboarding boolean DEFAULT false;

-- 2. Comentario explicativo
COMMENT ON COLUMN tu_tabla_de_staff.password_set_during_onboarding IS
'Tracks if user explicitly set password during onboarding. More reliable than password_updated_at.';

-- 3. Actualizar registros existentes
UPDATE tu_tabla_de_staff
SET password_set_during_onboarding = true
WHERE status = 'active' AND first_login_completed = true;

UPDATE tu_tabla_de_staff
SET password_set_during_onboarding = false
WHERE status = 'pending' OR (status = 'active' AND first_login_completed = false);

-- 4. Índice para performance
CREATE INDEX IF NOT EXISTS idx_staff_onboarding_status
ON tu_tabla_de_staff(user_id, first_login_completed, password_set_during_onboarding)
WHERE user_id IS NOT NULL;

-- 5. Constraint de consistencia lógica
ALTER TABLE tu_tabla_de_staff
ADD CONSTRAINT check_onboarding_logic
CHECK (
  (first_login_completed = true AND password_set_during_onboarding = true) OR
  (first_login_completed = false)
);
```

**Campos necesarios en tu tabla**:
```sql
CREATE TABLE staff_or_users (
    id uuid PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id),
    email text NOT NULL,
    full_name text NOT NULL,
    status text DEFAULT 'pending', -- pending | active | inactive
    first_login_completed boolean DEFAULT false,
    password_set_during_onboarding boolean DEFAULT false, -- NUEVO
    invited_at timestamp with time zone,
    activated_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
```

---

### 2. Custom Hook: `useOnboarding`

**Archivo**: `hooks/useOnboarding.ts` (o el nombre que uses)

```typescript
'use client'

import { useState, useEffect, useCallback } from 'react'
import { getSupabaseClient } from '@/lib/supabaseClient'

interface UserInfo {
  id: string
  full_name: string
  role: string
  organization_name: string
  first_login_completed: boolean
  password_set_during_onboarding: boolean
}

interface UseOnboardingReturn {
  shouldShowOnboarding: boolean
  userInfo: UserInfo | null
  loading: boolean
  requiresPasswordSetup: boolean
  submitPassword: (password: string) => Promise<void>
  markOnboardingCompleted: () => Promise<void>
}

export function useOnboarding(): UseOnboardingReturn {
  const [shouldShowOnboarding, setShouldShowOnboarding] = useState(false)
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [requiresPasswordSetup, setRequiresPasswordSetup] = useState(false)

  useEffect(() => {
    checkOnboardingStatus()
  }, [])

  const checkOnboardingStatus = async () => {
    try {
      const supabase = getSupabaseClient()

      // 1. Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        setLoading(false)
        return
      }

      // 2. Check if user needs onboarding (adapt to your table structure)
      const { data: userData, error: dataError } = await supabase
        .from('your_table_name') // ⚠️ CAMBIAR
        .select(`
          id,
          full_name,
          role,
          first_login_completed,
          password_set_during_onboarding,
          organization_id,
          organizations!inner (name)
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      if (dataError || !userData) {
        setLoading(false)
        return
      }

      const info: UserInfo = {
        id: userData.id,
        full_name: userData.full_name,
        role: userData.role,
        organization_name: (userData.organizations as any)?.name || 'Organization',
        first_login_completed: userData.first_login_completed || false,
        password_set_during_onboarding: userData.password_set_during_onboarding || false
      }

      setUserInfo(info)

      // 3. Determine if onboarding is needed
      const needsPassword = !info.password_set_during_onboarding
      const needsOnboarding = needsPassword || !info.first_login_completed

      setRequiresPasswordSetup(needsPassword)
      setShouldShowOnboarding(needsOnboarding)

      console.log('Onboarding check:', {
        userId: user.id,
        needsPassword,
        needsOnboarding,
        passwordSet: info.password_set_during_onboarding,
        firstLoginCompleted: info.first_login_completed
      })

    } catch (error) {
      console.error('Error checking onboarding status:', error)
    } finally {
      setLoading(false)
    }
  }

  const submitPassword = useCallback(async (password: string) => {
    if (!userInfo) {
      throw new Error('No user info available')
    }

    const supabase = getSupabaseClient()

    // 1. Update password in Supabase Auth
    const { error: authError } = await supabase.auth.updateUser({ password })
    if (authError) {
      console.error('Failed to update password:', authError)
      throw new Error(authError.message)
    }

    // 2. Mark password as set in database
    const { error: dbError } = await supabase
      .from('your_table_name') // ⚠️ CAMBIAR
      .update({
        password_set_during_onboarding: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', userInfo.id)

    if (dbError) {
      console.error('Failed to update password flag:', dbError)
      // Don't throw - password was set successfully in auth
    }

    console.log('Password updated successfully')
    setRequiresPasswordSetup(false)
    setUserInfo(prev => prev ? { ...prev, password_set_during_onboarding: true } : null)
  }, [userInfo])

  const markOnboardingCompleted = async () => {
    if (!userInfo) return

    if (requiresPasswordSetup) {
      throw new Error('Password setup is required before completing onboarding')
    }

    try {
      const supabase = getSupabaseClient()

      const { error } = await supabase
        .from('your_table_name') // ⚠️ CAMBIAR
        .update({
          first_login_completed: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', userInfo.id)

      if (!error) {
        setShouldShowOnboarding(false)
        setUserInfo(prev => prev ? { ...prev, first_login_completed: true } : null)
      }
    } catch (error) {
      console.error('Error marking onboarding completed:', error)
    }
  }

  return {
    shouldShowOnboarding,
    userInfo,
    loading,
    requiresPasswordSetup,
    submitPassword,
    markOnboardingCompleted
  }
}
```

---

### 3. OnboardingGuard Component

**Archivo**: `components/OnboardingGuard.tsx`

```typescript
'use client'

import { ReactNode } from 'react'

interface OnboardingGuardProps {
  children: ReactNode
  isOnboarding: boolean
  isLoading: boolean
}

/**
 * Blocks all content while user completes onboarding
 */
export function OnboardingGuard({
  children,
  isOnboarding,
  isLoading
}: OnboardingGuardProps) {

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Onboarding required - show blocking screen
  if (isOnboarding) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="max-w-md px-6 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-teal-100">
            <svg
              className="h-10 w-10 text-teal-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h2 className="mb-3 text-3xl font-bold text-gray-900">Welcome!</h2>
          <p className="mb-2 text-lg text-gray-600">
            Please complete your account setup to continue.
          </p>
          <p className="text-sm text-gray-500">
            This will only take a moment. Follow the steps in the welcome dialog.
          </p>
        </div>
      </div>
    )
  }

  // Onboarding complete - show content
  return <>{children}</>
}
```

---

### 4. OnboardingLayout (Global Wrapper)

**Archivo**: `components/OnboardingLayout.tsx`

```typescript
'use client'

import { ReactNode } from 'react'
import { OnboardingGuard } from './OnboardingGuard'
import { OnboardingModal } from './OnboardingModal' // Tu modal de onboarding
import { useOnboarding } from '@/hooks/useOnboarding'

interface OnboardingLayoutProps {
  children: ReactNode
}

/**
 * Wraps entire app and enforces onboarding completion
 */
export function OnboardingLayout({ children }: OnboardingLayoutProps) {
  const {
    shouldShowOnboarding,
    userInfo,
    loading,
    requiresPasswordSetup,
    submitPassword,
    markOnboardingCompleted
  } = useOnboarding()

  const handleModalClose = async () => {
    // Prevent closing if password not set
    if (requiresPasswordSetup) {
      console.warn('Cannot close onboarding without setting password')
      return
    }

    try {
      await markOnboardingCompleted()
      // Force reload to update UI
      window.location.href = '/'
    } catch (error) {
      console.error('Failed to complete onboarding:', error)
    }
  }

  const isOnboarding = shouldShowOnboarding && !!userInfo

  return (
    <>
      <OnboardingGuard isOnboarding={isOnboarding} isLoading={loading}>
        {children}
      </OnboardingGuard>

      {/* Onboarding Modal - renders at top level */}
      {isOnboarding && (
        <OnboardingModal
          open={shouldShowOnboarding}
          onOpenChange={handleModalClose}
          userInfo={{
            name: userInfo.full_name,
            role: userInfo.role,
            organizationName: userInfo.organization_name
          }}
          requiresPasswordSetup={requiresPasswordSetup}
          onPasswordSubmit={submitPassword}
        />
      )}
    </>
  )
}
```

---

### 5. OnboardingModal (UI Component)

**Archivo**: `components/OnboardingModal.tsx`

**Características clave**:
- ✅ Paso de contraseña obligatorio (si `requiresPasswordSetup = true`)
- ✅ No se puede cerrar con ESC
- ✅ No se puede cerrar clickeando afuera
- ✅ Validación de contraseña (longitud, confirmación)
- ✅ No permite avanzar sin guardar contraseña

```typescript
'use client'

import { useState, useEffect, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface OnboardingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userInfo: {
    name: string
    role: string
    organizationName: string
  }
  requiresPasswordSetup?: boolean
  onPasswordSubmit?: (password: string) => Promise<void>
}

export function OnboardingModal({
  open,
  onOpenChange,
  userInfo,
  requiresPasswordSetup = false,
  onPasswordSubmit
}: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSaved, setPasswordSaved] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  const handlePasswordSave = async () => {
    if (!onPasswordSubmit) {
      setPasswordError('Password setup unavailable. Contact support.')
      return
    }

    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters')
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
    const baseSteps = [
      {
        title: `Welcome to ${userInfo.organizationName}!`,
        content: (
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              Hi <span className="font-semibold">{userInfo.name}</span>!
            </p>
            <p className="text-sm text-gray-500">
              You've been invited as a <strong>{userInfo.role}</strong>.
            </p>
          </div>
        )
      },
      {
        title: 'Ready to get started?',
        content: (
          <div className="text-center space-y-4">
            <p className="text-gray-600">You're all set!</p>
            <Button
              onClick={() => onOpenChange(false)}
              disabled={requiresPasswordSetup && !passwordSaved}
              className="w-full"
            >
              Start Exploring
            </Button>
          </div>
        )
      }
    ]

    // Add password step if needed (at the beginning)
    if (requiresPasswordSetup) {
      baseSteps.unshift({
        title: 'Create your password',
        content: (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 text-center">
              Please create a password to secure your account.
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">New password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setPasswordError(null)
                  }}
                  placeholder="Enter password"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Confirm password</label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    setPasswordError(null)
                  }}
                  placeholder="Confirm password"
                />
              </div>

              {passwordError && (
                <Alert variant="destructive">
                  <AlertDescription>{passwordError}</AlertDescription>
                </Alert>
              )}

              {passwordSaved && (
                <Alert className="bg-green-50 border-green-200">
                  <AlertDescription>Password saved successfully!</AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handlePasswordSave}
                disabled={savingPassword || passwordSaved}
                className="w-full"
              >
                {savingPassword ? 'Saving...' : passwordSaved ? 'Saved ✓' : 'Save Password'}
              </Button>
            </div>
          </div>
        )
      })
    }

    return baseSteps
  }, [userInfo, requiresPasswordSetup, password, confirmPassword, passwordError, passwordSaved, savingPassword])

  const handleNext = () => {
    // Block if on password step and not saved
    if (requiresPasswordSetup && currentStep === 0 && !passwordSaved) {
      setPasswordError('Please save your password before continuing')
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

  // Reset on modal open
  useEffect(() => {
    if (open) {
      setCurrentStep(0)
      setPassword('')
      setConfirmPassword('')
      setPasswordError(null)
      setPasswordSaved(false)
    }
  }, [open])

  // Block closing if password not saved
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && requiresPasswordSetup && !passwordSaved) {
      return // Don't allow closing
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-lg"
        onEscapeKeyDown={(e) => {
          if (requiresPasswordSetup && !passwordSaved) {
            e.preventDefault()
          }
        }}
        onPointerDownOutside={(e) => {
          if (requiresPasswordSetup && !passwordSaved) {
            e.preventDefault()
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-xl text-center">
            {steps[currentStep].title}
          </DialogTitle>
        </DialogHeader>

        <div className="py-6">
          {steps[currentStep].content}
        </div>

        {/* Progress dots */}
        <div className="flex justify-center space-x-2 mb-4">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-2 w-2 rounded-full ${
                index === currentStep
                  ? 'bg-teal-600'
                  : index < currentStep
                  ? 'bg-teal-300'
                  : 'bg-gray-300'
              }`}
            />
          ))}
        </div>

        {/* Navigation */}
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
```

---

### 6. Integración en Root Layout

**Archivo**: `app/layout.tsx`

```typescript
import { OnboardingLayout } from '@/components/OnboardingLayout'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <OnboardingLayout>
          {children}
        </OnboardingLayout>
      </body>
    </html>
  )
}
```

---

## 🔧 Configuración de Supabase

### 1. Redirect URLs

**Dashboard → Authentication → URL Configuration**

```
Development:
  Site URL: http://localhost:3000
  Redirect URLs:
    - http://localhost:3000/**
    - http://localhost:3000/auth/callback

Production:
  Site URL: https://yourdomain.com
  Redirect URLs:
    - https://yourdomain.com/**
    - https://yourdomain.com/auth/callback
```

### 2. Email Templates (Opcional)

Personaliza el template de invitación:

**Dashboard → Authentication → Email Templates → Invite User**

```html
<h2>You're invited!</h2>
<p>You've been invited to join {{ .SiteURL }}.</p>
<p>Click the link below to accept:</p>
<p><a href="{{ .ConfirmationURL }}">Accept Invitation</a></p>
<p>This link expires in 24 hours.</p>
```

---

## 📝 Endpoint de Invitación

**Archivo**: `app/api/staff/invite/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const { email, fullName, role, organizationId } = await request.json()

    // Validate
    if (!email || !fullName || !role) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    // Create admin client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // 1. Create staff record
    const { data: staff, error: staffError } = await supabaseAdmin
      .from('your_staff_table')
      .insert({
        email: email.toLowerCase(),
        full_name: fullName,
        role,
        organization_id: organizationId,
        status: 'pending',
        invited_at: new Date().toISOString()
      })
      .select()
      .single()

    if (staffError) {
      return NextResponse.json({ error: staffError.message }, { status: 500 })
    }

    // 2. Send invitation email via Supabase
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      {
        redirectTo: `${appUrl}/auth/callback`,
        data: {
          full_name: fullName,
          role,
          organization_id: organizationId
        }
      }
    )

    if (inviteError) {
      // Cleanup staff record
      await supabaseAdmin.from('your_staff_table').delete().eq('id', staff.id)
      return NextResponse.json({ error: inviteError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Invitation sent successfully',
      staff
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
```

---

## 🔄 Flujo Completo

### 1. Invitación
```
Admin invita usuario
  ↓
POST /api/staff/invite
  ↓
INSERT en tabla staff (status='pending')
  ↓
supabase.auth.admin.inviteUserByEmail()
  ↓
Email enviado con link
```

### 2. Usuario Acepta
```
Usuario click en link
  ↓
http://localhost:3000/auth/callback?code=XXX
  ↓
Supabase crea usuario en auth.users
  ↓
Trigger automático activa staff
  ↓
Redirect a /
```

### 3. Onboarding
```
Usuario llega a /
  ↓
OnboardingLayout ejecuta useOnboarding()
  ↓
Detecta: password_set_during_onboarding = false
  ↓
OnboardingGuard muestra pantalla bloqueante
  ↓
OnboardingModal aparece (no se puede cerrar)
  ↓
Usuario DEBE completar paso de contraseña
  ↓
Guarda contraseña → password_set_during_onboarding = true
  ↓
Continúa con resto de pasos
  ↓
Click "Start Exploring"
  ↓
markOnboardingCompleted() → first_login_completed = true
  ↓
Redirect a / → Acceso completo
```

---

## ✅ Checklist de Implementación

### Base de Datos
- [ ] Agregar campo `password_set_during_onboarding`
- [ ] Agregar campo `first_login_completed`
- [ ] Crear índice de performance
- [ ] Agregar constraint de consistencia
- [ ] Aplicar migración SQL

### Configuración Supabase
- [ ] Configurar Redirect URLs (dev + prod)
- [ ] Verificar triggers de activación
- [ ] Personalizar template de email (opcional)

### Código Frontend
- [ ] Crear hook `useOnboarding`
- [ ] Crear componente `OnboardingGuard`
- [ ] Crear componente `OnboardingLayout`
- [ ] Crear/actualizar `OnboardingModal`
- [ ] Integrar `OnboardingLayout` en root layout

### Endpoints
- [ ] Endpoint de invitación funcional
- [ ] Callback handler configurado

### Testing
- [ ] Invitar usuario nuevo funciona
- [ ] Modal de onboarding aparece
- [ ] Paso de contraseña es obligatorio
- [ ] No se puede cerrar modal prematuramente
- [ ] Después de onboarding, acceso completo
- [ ] Usuarios existentes no ven onboarding

---

## 🐛 Troubleshooting

### Modal no aparece

```sql
-- Verificar estado de usuario
SELECT
    email,
    password_set_during_onboarding,
    first_login_completed,
    status
FROM your_staff_table
WHERE email = 'user@example.com';

-- Debe mostrar ambos en false para ver onboarding
```

### Usuario puede ver contenido sin onboarding

```typescript
// Verificar en DevTools console:
// Debe ver: shouldShowOnboarding = true
console.log({
  shouldShowOnboarding,
  passwordSet: userInfo.password_set_during_onboarding,
  firstLogin: userInfo.first_login_completed
})
```

### Error de invitación expirada

Las invitaciones expiran en 24h. Solución:
1. Re-enviar invitación desde UI
2. O activar manualmente (ver documentación completa)

---

## 📚 Recursos Adicionales

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Next.js App Router](https://nextjs.org/docs/app)
- [React Hook Patterns](https://react.dev/reference/react)

---

## 🎯 Resultado Final

Después de implementar:

✅ Usuarios invitados ven pantalla bloqueante
✅ Onboarding es obligatorio y no se puede omitir
✅ Paso de contraseña es requerido
✅ Modal no se puede cerrar prematuramente
✅ UI consistente después de completar
✅ Sistema escalable y reutilizable

---

**Tiempo total de implementación**: 2-3 horas
**Dificultad**: Intermedia
**Mantenibilidad**: Alta (código modular y bien documentado)

---

**Última actualización**: 2025-11-04
**Versión**: 1.0
**Autor**: Claude Code Assistant
