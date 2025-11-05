# Fix: "We couldn't finish signing you in" - Error de Invitación

## 🔴 Problema

Cuando un usuario invitado hace click en el link de invitación, ve este error:

```
We couldn't finish signing you in
Missing session tokens in callback response. Please request a new link.

The invitation link may have expired or already been used.
Request a new invitation or try logging in.
```

## 🔍 Causas Posibles

1. **Invitación Expirada**: Los links de Supabase expiran en 24 horas
2. **Link Ya Usado**: El link solo funciona una vez
3. **Redirect URL No Configurada**: Falta configurar la URL en Supabase Dashboard
4. **Link Inválido**: El formato del link no es correcto

## ✅ Solución Rápida

### Opción 1: Re-enviar Invitación (RECOMENDADO)

1. Como administrador, ve a la sección de invitaciones
2. Vuelve a invitar al usuario con el mismo email
3. El usuario recibirá un **nuevo link** por email
4. Este nuevo link funcionará correctamente

### Opción 2: Verificar Configuración de Supabase

#### Paso 1: Configurar Redirect URLs

1. Ve a tu proyecto: https://supabase.com/dashboard/project/adnjclqgwsngetimldeu
2. Navega a: **Authentication** → **URL Configuration**
3. Verifica que estas URLs estén configuradas:

**Para Desarrollo (localhost)**:
```
Site URL: http://localhost:3000
Redirect URLs:
  - http://localhost:3000/**
  - http://localhost:3000/auth/callback
```

**Para Producción**:
```
Site URL: https://tu-dominio.com
Redirect URLs:
  - https://tu-dominio.com/**
  - https://tu-dominio.com/auth/callback
```

4. Click **Save**

#### Paso 2: Verificar Estado de Invitación

Ejecuta esta query en SQL Editor de Supabase:

```sql
-- Ver el estado de la invitación
SELECT 
    email,
    full_name,
    status,
    user_id,
    invited_at,
    created_at,
    -- Verificar si expiró (>24h)
    CASE 
        WHEN invited_at < now() - interval '24 hours' THEN '⚠️ EXPIRADA'
        WHEN invited_at < now() - interval '1 hour' THEN '⏰ PRÓXIMA A EXPIRAR'
        ELSE '✅ VÁLIDA'
    END as estado_invitacion,
    -- Tiempo restante
    CASE 
        WHEN invited_at < now() - interval '24 hours' THEN 'Expiró hace ' || 
            EXTRACT(epoch FROM (now() - (invited_at + interval '24 hours'))) / 3600 || ' horas'
        ELSE 'Expira en ' || 
            EXTRACT(epoch FROM ((invited_at + interval '24 hours') - now())) / 3600 || ' horas'
    END as tiempo_restante
FROM club_staff
WHERE email = 'EMAIL_DEL_USUARIO@example.com';
```

## 🔧 Solución Técnica (Para Desarrolladores)

### Problema: Link con Formato Incorrecto

Si el link de invitación tiene este formato:

```
❌ INCORRECTO:
http://localhost:3000/auth/callback#access_token=...&refresh_token=...
```

El formato correcto debe ser:

```
✅ CORRECTO:
http://localhost:3000/auth/callback?code=ABC123...&type=invite
```

### Fix: Actualizar Código de Invitación

En tu endpoint de invitación (`/api/staff/invite/route.ts`), asegúrate de usar:

```typescript
const { data, error } = await adminClient.auth.admin.inviteUserByEmail(
  email,
  {
    // ✅ CORRECTO: redirectTo debe apuntar a /auth/callback
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    data: {
      organization_id: orgId,
      organization_name: orgName,
      role: role,
      full_name: fullName
    }
  }
);
```

### Logs Mejorados

Ahora el callback handler tiene logs mejorados. Verifica la consola de Next.js:

```bash
# Inicia el servidor con logs visibles
pnpm run dev

# Al hacer click en el link, deberías ver:
Auth callback received: {
  hasCode: true/false,
  hasError: false,
  type: 'invite',
  url: 'http://localhost:3000/auth/callback?code=...'
}
```

Si ves `hasCode: false`, significa que el link no tiene el código de autenticación.

## 🚑 Solución de Emergencia (Activación Manual)

Si necesitas dar acceso inmediato a un usuario y no puedes esperar:

### Paso 1: Crear Usuario en Supabase Dashboard

1. Ve a: https://supabase.com/dashboard/project/adnjclqgwsngetimldeu
2. Navega a: **Authentication** → **Users**
3. Click **Add User** (botón verde)
4. Llena:
   - Email: email del staff
   - Password: contraseña temporal (el usuario la cambiará en onboarding)
   - ✅ Check "Auto Confirm User"
5. Click **Create User**

### Paso 2: Vincular Manualmente en la Base de Datos

Ejecuta este script en SQL Editor:

```sql
DO $$
DECLARE
    v_user_id uuid;
    v_staff_record RECORD;
BEGIN
    -- Buscar el ID del usuario por email
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = 'EMAIL_DEL_USUARIO@example.com';
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuario no encontrado. Créalo primero en Auth > Users';
    END IF;
    
    -- Buscar el registro de staff
    SELECT * INTO v_staff_record
    FROM club_staff
    WHERE email = 'EMAIL_DEL_USUARIO@example.com';
    
    IF v_staff_record IS NULL THEN
        RAISE EXCEPTION 'Staff no encontrado. Verifica el email';
    END IF;
    
    -- Activar el staff
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
    
    RAISE NOTICE '✅ Staff activado exitosamente';
    RAISE NOTICE 'Email: %', v_staff_record.email;
    RAISE NOTICE 'User ID: %', v_user_id;
    RAISE NOTICE 'Organization ID: %', v_staff_record.organization_id;
END $$;
```

### Paso 3: Informar al Usuario

Envía al usuario:
- **URL**: http://localhost:3000/login (o tu dominio de producción)
- **Email**: su email
- **Password**: la contraseña temporal que creaste
- **Instrucción**: "Después de iniciar sesión, completa el onboarding y cambia tu contraseña"

## 📝 Prevención Futura

### 1. Aumentar Tiempo de Expiración (Opcional)

Si necesitas que los links duren más de 24 horas, puedes configurarlo en Supabase:

1. Ve a: **Authentication** → **Email Templates**
2. Edita el template "Invite user"
3. Ajusta el token expiry (pero no recomendado por seguridad)

### 2. Sistema de Re-envío Automático

Considera agregar un botón "Resend Invitation" en tu UI:

```typescript
async function resendInvitation(staffId: string) {
  const { data: staff } = await supabase
    .from('club_staff')
    .select('email, full_name, role, organization_id')
    .eq('id', staffId)
    .single();

  if (!staff) return;

  // Re-enviar invitación
  const { error } = await fetch('/api/staff/invite', {
    method: 'POST',
    body: JSON.stringify({
      email: staff.email,
      fullName: staff.full_name,
      role: staff.role,
      // ... otros campos
    })
  });

  if (!error) {
    alert('Nueva invitación enviada exitosamente');
  }
}
```

### 3. Notificar Expiraciones

Query para encontrar invitaciones próximas a expirar:

```sql
-- Invitaciones que expiran en las próximas 2 horas
SELECT 
    email,
    full_name,
    invited_at,
    invited_at + interval '24 hours' as expira_en
FROM club_staff
WHERE 
    status = 'pending'
    AND invited_at > now() - interval '22 hours'
    AND invited_at < now() - interval '21 hours'
ORDER BY invited_at DESC;
```

## 🔍 Debug Checklist

Si el problema persiste, verifica:

- [ ] La URL de callback está en las Redirect URLs de Supabase
- [ ] El valor de `NEXT_PUBLIC_APP_URL` en `.env.local` es correcto
- [ ] El servidor de Next.js está corriendo (`pnpm run dev`)
- [ ] No hay errores en la consola del navegador (F12)
- [ ] La invitación tiene menos de 24 horas
- [ ] El link no ha sido usado previamente
- [ ] El registro existe en `club_staff` con status='pending'

## 📞 Soporte

Si ninguna solución funciona:

1. Copia los logs completos de la consola del servidor
2. Copia los logs del navegador (Console tab en DevTools)
3. Ejecuta esta query y copia el resultado:

```sql
SELECT 
    cs.email,
    cs.status,
    cs.invited_at,
    cs.user_id,
    au.email as auth_email,
    au.created_at as auth_created_at,
    au.email_confirmed_at
FROM club_staff cs
LEFT JOIN auth.users au ON cs.email = au.email
WHERE cs.email = 'EMAIL_DEL_PROBLEMA@example.com';
```

---

**Última actualización**: 2025-11-04  
**Autor**: Claude Code Assistant
