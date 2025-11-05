# Resumen Ejecutivo: Sistema de Invitaciones y Onboarding - ClubOS

## 🎯 CONTEXTO GENERAL

**Proyecto**: clubOS Central
**Database**: Supabase (Project: `adnjclqgwsngetimldeu`)
**Estado Actual**: Sistema de staff funcionando, pero con 2 problemas críticos

---

## 🔴 PROBLEMAS ACTUALES

### 1. ERROR DE INVITACIÓN (CRÍTICO - BLOQUEANTE)

**Síntoma**:
Usuario hace click en link de invitación → ve error:
```
"We couldn't finish signing you in"
Missing session tokens in callback response.
```

**Causa Root**:
- Los links de invitación de Supabase expiran en 24 horas
- El link mostrado en el screenshot probablemente está expirado o ya fue usado
- URL: `http://localhost:3000/auth/callback#` (sin parámetros)

**Evidencia**:
```bash
# La URL correcta debería ser:
http://localhost:3000/auth/callback?code=CODIGO_AQUI&type=invite

# Pero está llegando como:
http://localhost:3000/auth/callback# (sin code)
```

---

### 2. ONBOARDING NO OBLIGATORIO (ALTA PRIORIDAD)

**Síntoma**:
- Usuarios invitados pueden ver datos del club SIN completar onboarding
- No se les pide crear contraseña
- Modal de onboarding se puede cerrar prematuramente

**Estado**:
- ✅ Código frontend YA corregido (componentes nuevos creados)
- ❌ Migración SQL NO aplicada todavía
- ⚠️ Sistema funcionará 100% solo después de aplicar migración

---

## 🔧 ACCIONES NECESARIAS EN SUPABASE

### Acción 1: Configurar Redirect URLs (URGENTE)

**Dónde**: Supabase Dashboard → Authentication → URL Configuration

**Configuración Necesaria**:

```
DESARROLLO (localhost):
├─ Site URL: http://localhost:3000
└─ Redirect URLs:
   ├─ http://localhost:3000/**
   └─ http://localhost:3000/auth/callback

PRODUCCIÓN (cuando despliegues):
├─ Site URL: https://tu-dominio.com
└─ Redirect URLs:
   ├─ https://tu-dominio.com/**
   └─ https://tu-dominio.com/auth/callback
```

**Por qué**: Sin esto, los links de invitación NO funcionarán.

---

### Acción 2: Aplicar Migración SQL (REQUERIDO PARA ONBOARDING)

**Dónde**: Supabase Dashboard → SQL Editor → New Query

**SQL a Ejecutar**:

```sql
-- ============================================================================
-- MIGRACIÓN 004: Sistema de Onboarding Obligatorio
-- ============================================================================
-- Propósito: Agregar campo para rastrear si el usuario configuró su contraseña
-- durante el onboarding. El campo password_updated_at de Supabase Auth no es
-- confiable porque se establece automáticamente.
-- ============================================================================

-- 1. Agregar columna
ALTER TABLE club_staff
ADD COLUMN IF NOT EXISTS password_set_during_onboarding boolean DEFAULT false;

-- 2. Agregar comentario explicativo
COMMENT ON COLUMN club_staff.password_set_during_onboarding IS
'Tracks if the user has explicitly set their password during the onboarding flow. This is different from password_updated_at which Supabase may set automatically.';

-- 3. Actualizar registros existentes
-- Staff activo que ya completó onboarding = true
UPDATE club_staff
SET password_set_during_onboarding = true
WHERE status = 'active' AND first_login_completed = true;

-- Staff pendiente o sin completar = false
UPDATE club_staff
SET password_set_during_onboarding = false
WHERE status = 'pending' OR (status = 'active' AND first_login_completed = false);

-- 4. Crear índice para queries rápidas
CREATE INDEX IF NOT EXISTS idx_club_staff_onboarding_status
ON club_staff(user_id, first_login_completed, password_set_during_onboarding)
WHERE user_id IS NOT NULL;

-- 5. Agregar constraint de consistencia
ALTER TABLE club_staff
ADD CONSTRAINT check_onboarding_logic
CHECK (
  -- Si first_login_completed = true, password DEBE estar set
  (first_login_completed = true AND password_set_during_onboarding = true) OR
  -- De lo contrario, cualquier combinación es válida
  (first_login_completed = false)
);

-- 6. Verificación
SELECT
    'Migración aplicada correctamente' as status,
    count(*) as total_staff,
    sum(CASE WHEN password_set_during_onboarding THEN 1 ELSE 0 END) as con_password,
    sum(CASE WHEN NOT password_set_during_onboarding THEN 1 ELSE 0 END) as sin_password
FROM club_staff;
```

**Resultado Esperado**:
```
status                              | total_staff | con_password | sin_password
------------------------------------+-------------+--------------+-------------
Migración aplicada correctamente    |      X      |      X       |      X
```

**Verificación Post-Migración**:
```sql
-- Ver la nueva columna
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'club_staff'
AND column_name = 'password_set_during_onboarding';

-- Debería retornar 1 fila
```

---

### Acción 3: Re-enviar Invitación (SOLUCIÓN INMEDIATA AL ERROR)

**Problema**: La invitación actual está expirada/usada

**Solución Rápida**:

**Opción A - Desde la UI** (si existe):
1. Ir a la sección de gestión de staff
2. Buscar el usuario con problema
3. Click en "Resend Invitation" o "Re-invite"

**Opción B - Query SQL Manual**:
```sql
-- 1. Ver invitaciones expiradas
SELECT
    email,
    full_name,
    status,
    invited_at,
    CASE
        WHEN invited_at < now() - interval '24 hours' THEN '⚠️ EXPIRADA'
        ELSE '✅ VÁLIDA'
    END as estado
FROM club_staff
WHERE status = 'pending'
ORDER BY invited_at DESC;

-- 2. Si hay invitaciones expiradas, eliminar el registro y re-invitar desde UI
-- O usar el endpoint de API para re-invitar
```

**Opción C - Activación Manual de Emergencia**:

Si necesitas dar acceso INMEDIATO:

```sql
-- PASO 1: Crear usuario en Supabase Dashboard primero
-- Dashboard > Authentication > Users > Add User
-- Email: email@example.com
-- Password: TemporalPassword123!
-- ✓ Auto Confirm User

-- PASO 2: Ejecutar este script (reemplaza el email)
DO $$
DECLARE
    v_user_id uuid;
    v_staff_record RECORD;
    v_target_email text := 'EMAIL_DEL_USUARIO@example.com'; -- ⚠️ CAMBIAR ESTO
BEGIN
    -- Buscar usuario en auth
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = v_target_email;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuario no encontrado. Créalo primero en Auth > Users';
    END IF;

    -- Buscar staff record
    SELECT * INTO v_staff_record
    FROM club_staff
    WHERE email = v_target_email;

    IF v_staff_record IS NULL THEN
        RAISE EXCEPTION 'Staff no encontrado en club_staff';
    END IF;

    -- Activar staff
    UPDATE club_staff
    SET
        status = 'active',
        user_id = v_user_id,
        activated_at = now(),
        last_active_at = now(),
        password_set_during_onboarding = false,  -- Lo hará en onboarding
        first_login_completed = false
    WHERE id = v_staff_record.id;

    -- Agregar a organization_users
    INSERT INTO organization_users (organization_id, user_id, role, staff_id, joined_via)
    VALUES (
        v_staff_record.organization_id,
        v_user_id,
        CASE
            WHEN v_staff_record.role = 'gestor' THEN 'owner'
            WHEN v_staff_record.role = 'admin' THEN 'admin'
            WHEN v_staff_record.role = 'profesor' THEN 'staff'
        END,
        v_staff_record.id,
        'manual_activation'
    )
    ON CONFLICT (organization_id, user_id)
    DO UPDATE SET
        staff_id = EXCLUDED.staff_id,
        joined_via = EXCLUDED.joined_via;

    RAISE NOTICE '✅ Staff activado: %', v_target_email;
    RAISE NOTICE 'User ID: %', v_user_id;
    RAISE NOTICE 'Org ID: %', v_staff_record.organization_id;

    -- Informar credenciales al usuario:
    -- URL: http://localhost:3000/login
    -- Email: v_target_email
    -- Password: La que creaste en Dashboard
END $$;
```

---

## 📊 VERIFICACIÓN DE ESTADO ACTUAL

### Query 1: Ver Estado de Usuarios y Staff

```sql
SELECT
    -- Auth Info
    au.email as auth_email,
    au.created_at as user_created,
    au.email_confirmed_at,

    -- Staff Info
    cs.email as staff_email,
    cs.full_name,
    cs.role,
    cs.status,
    cs.invited_at,
    cs.activated_at,
    cs.first_login_completed,

    -- Estado de invitación
    CASE
        WHEN cs.status = 'pending' AND cs.invited_at < now() - interval '24 hours'
            THEN '🔴 EXPIRADA'
        WHEN cs.status = 'pending'
            THEN '🟡 PENDIENTE'
        WHEN cs.status = 'active'
            THEN '🟢 ACTIVO'
        ELSE '⚪ ' || cs.status
    END as estado_visual,

    -- Tiempo desde invitación
    EXTRACT(epoch FROM (now() - cs.invited_at)) / 3600 as horas_desde_invitacion

FROM club_staff cs
LEFT JOIN auth.users au ON cs.user_id = au.id
ORDER BY cs.created_at DESC;
```

### Query 2: Ver Configuración de Triggers

```sql
-- Verificar que los triggers de activación existan
SELECT
    t.tgname as trigger_name,
    CASE t.tgenabled
        WHEN 'O' THEN '✅ ENABLED'
        WHEN 'D' THEN '❌ DISABLED'
        ELSE '⚠️ ' || t.tgenabled
    END as estado,
    pg_get_triggerdef(t.oid) as definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'users'
  AND t.tgname LIKE '%staff%'
ORDER BY t.tgname;

-- Deberías ver 2 triggers:
-- 1. on_auth_user_created_activate_staff
-- 2. on_auth_user_confirmed_activate_staff
```

### Query 3: Ver Políticas RLS Activas

```sql
SELECT
    schemaname,
    tablename,
    policyname,
    CASE cmd
        WHEN 'r' THEN 'SELECT'
        WHEN 'a' THEN 'INSERT'
        WHEN 'w' THEN 'UPDATE'
        WHEN 'd' THEN 'DELETE'
        WHEN '*' THEN 'ALL'
    END as operation,
    roles,
    qual as using_clause,
    with_check as check_clause
FROM pg_policies
WHERE tablename = 'club_staff'
ORDER BY policyname;

-- Deberías ver 5 políticas
```

---

## 🏗️ ARQUITECTURA DEL SISTEMA

### Flujo de Invitación (Como DEBE funcionar)

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. ADMIN INVITA STAFF                                           │
│    → POST /api/staff/invite                                     │
│    → INSERT club_staff (status='pending')                       │
│    → supabase.auth.admin.inviteUserByEmail()                   │
│    → Email enviado con link                                     │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. USUARIO HACE CLICK EN LINK                                   │
│    Link: http://localhost:3000/auth/callback?code=XXX&type=invite│
│    → Supabase valida code                                       │
│    → Crea usuario en auth.users                                 │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. TRIGGER AUTOMÁTICO                                            │
│    → on_auth_user_created_activate_staff                        │
│    → activate_staff_account() ejecuta:                          │
│       - UPDATE club_staff SET status='active', user_id=...      │
│       - INSERT organization_users con staff_id vinculado        │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. REDIRECT A APP                                                │
│    → GET /auth/callback con session cookies                     │
│    → Redirect a /                                               │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. ONBOARDING (Después de migración SQL)                        │
│    → OnboardingLayout detecta: password_set_during_onboarding=false│
│    → OnboardingGuard bloquea contenido                          │
│    → WelcomeModal aparece con paso de contraseña OBLIGATORIO    │
│    → Usuario DEBE completar para acceder                        │
└─────────────────────────────────────────────────────────────────┘
```

### Componentes del Sistema

```
Frontend (Next.js)
├─ app/layout.tsx
│  └─ OnboardingLayout (wrapper global)
│     ├─ OnboardingGuard (bloquea contenido)
│     └─ WelcomeModal (modal de onboarding)
│
├─ app/api/auth/callback/route.ts
│  └─ Maneja redirect después de invitación
│
├─ app/api/staff/invite/route.ts
│  └─ Endpoint para invitar staff
│
└─ hooks/useNewStaffWelcome.ts
   └─ Detecta si usuario necesita onboarding

Backend (Supabase)
├─ club_staff (tabla)
│  ├─ Campos: email, role, status, user_id, etc.
│  └─ NUEVO: password_set_during_onboarding
│
├─ organization_users (tabla)
│  └─ Relación usuario-organización
│
├─ auth.users (Supabase Auth)
│  └─ Usuarios autenticados
│
└─ Triggers
   ├─ on_auth_user_created_activate_staff
   └─ on_auth_user_confirmed_activate_staff
```

---

## 🚨 PROBLEMAS CONOCIDOS Y SOLUCIONES

### Problema 1: "Missing session tokens in callback"

**Diagnóstico**:
```sql
-- Ver si hay invitaciones expiradas
SELECT email, invited_at,
       now() - invited_at as tiempo_transcurrido,
       CASE WHEN invited_at < now() - interval '24 hours'
            THEN '❌ EXPIRADA'
            ELSE '✅ VÁLIDA'
       END as estado
FROM club_staff
WHERE status = 'pending';
```

**Solución**: Ver "Acción 3: Re-enviar Invitación" arriba

---

### Problema 2: Onboarding No Aparece

**Causa**: Migración SQL no aplicada

**Diagnóstico**:
```sql
-- Verificar si la columna existe
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'club_staff'
  AND column_name = 'password_set_during_onboarding';

-- Si retorna 0 filas → Migración NO aplicada
```

**Solución**: Aplicar "Acción 2: Aplicar Migración SQL" arriba

---

### Problema 3: Usuario Puede Ver Datos Sin Completar Onboarding

**Causa**:
- Migración SQL no aplicada
- O usuario fue activado manualmente sin marcar flags correctos

**Solución Inmediata**:
```sql
-- Forzar que el usuario vea onboarding
UPDATE club_staff
SET
    password_set_during_onboarding = false,
    first_login_completed = false
WHERE email = 'EMAIL_DEL_USUARIO@example.com';

-- Usuario deberá recargar la página
```

---

### Problema 4: Trigger No Se Ejecuta

**Diagnóstico**:
```sql
-- Ver logs de funciones (si está habilitado logging)
SELECT * FROM pg_stat_statements
WHERE query LIKE '%activate_staff_account%'
ORDER BY calls DESC;

-- Verificar trigger existe y está habilitado
SELECT tgname, tgenabled
FROM pg_trigger
WHERE tgname LIKE '%staff%';
```

**Solución**: Los triggers YA están creados y funcionando (según resumen de cambios)

---

## 📋 CHECKLIST DE VERIFICACIÓN

Antes de considerar el sistema "listo":

### Backend (Supabase)
- [ ] Redirect URLs configuradas (http://localhost:3000/auth/callback)
- [ ] Migración 004 aplicada (password_set_during_onboarding existe)
- [ ] Triggers activos (2 triggers en auth.users)
- [ ] RLS policies activas (5 en club_staff)
- [ ] No hay invitaciones expiradas pendientes

### Frontend (Código)
- [x] OnboardingGuard creado
- [x] OnboardingLayout integrado en app/layout.tsx
- [x] WelcomeModal actualizado con validación de password
- [x] useNewStaffWelcome consulta nuevo campo
- [x] Callback handler con logs mejorados

### Testing
- [ ] Invitar usuario nuevo en localhost funciona
- [ ] Usuario ve modal de onboarding
- [ ] Paso de password es obligatorio
- [ ] Modal no se puede cerrar sin completar
- [ ] Después de onboarding, usuario accede a dashboard
- [ ] Navbar muestra email del usuario (no "Iniciar sesión")

---

## 🎯 PRIORIDADES DE EJECUCIÓN

### AHORA (Bloqueante)
1. ✅ **Configurar Redirect URLs en Supabase** (5 min)
2. ✅ **Re-enviar invitación al usuario afectado** (2 min)
3. ⏳ **Aplicar Migración SQL 004** (5 min)

### HOY (Alta prioridad)
4. ⏳ **Verificar checklist completo** (15 min)
5. ⏳ **Probar flujo de invitación end-to-end** (10 min)

### ESTA SEMANA (Media prioridad)
6. ⏳ Agregar botón "Resend Invitation" en UI
7. ⏳ Crear página de error más informativa
8. ⏳ Configurar monitoring de invitaciones expiradas

---

## 📚 DOCUMENTOS ADICIONALES

Hay 3 documentos de referencia en el proyecto:

1. **STAFF_ONBOARDING_FIX.md**
   - Guía completa del sistema de onboarding
   - Cómo funciona el flujo
   - Troubleshooting detallado

2. **INVITATION_ERROR_FIX.md**
   - Soluciones paso a paso para errores de invitación
   - Scripts SQL de emergencia
   - Checklist de debugging

3. **supabase-schema.json**
   - Listado completo de tablas y campos
   - Estructura de la base de datos

---

## 🔗 LINKS ÚTILES

- **Supabase Dashboard**: https://supabase.com/dashboard/project/adnjclqgwsngetimldeu
- **SQL Editor**: https://supabase.com/dashboard/project/adnjclqgwsngetimldeu/editor
- **Auth Config**: https://supabase.com/dashboard/project/adnjclqgwsngetimldeu/auth/url-configuration
- **Users**: https://supabase.com/dashboard/project/adnjclqgwsngetimldeu/auth/users

---

## 💡 TIPS PARA CURSOR

### Contexto Importante
- El sistema de staff YA existe y funciona básicamente
- El problema es específico de invitaciones expiradas
- El código del onboarding YA está implementado en frontend
- Solo falta aplicar la migración SQL para que el onboarding funcione 100%

### Lo Que NO Necesitas Cambiar
- ✅ Triggers en auth.users (funcionan)
- ✅ Función activate_staff_account() (funciona)
- ✅ RLS policies (configuradas correctamente)
- ✅ Componentes React (ya corregidos)

### Lo Que SÍ Necesitas Hacer
- ⚠️ Aplicar migración SQL 004
- ⚠️ Configurar Redirect URLs
- ⚠️ Re-enviar invitación expirada

### Comandos Útiles
```bash
# Ver logs del servidor Next.js
pnpm run dev

# Ver estructura de base de datos
# (desde Supabase SQL Editor)
\dt public.*

# Ver columnas de club_staff
\d club_staff
```

---

**Última actualización**: 2025-11-04
**Creado por**: Claude Code Assistant
**Para**: Cursor AI con acceso a Supabase
