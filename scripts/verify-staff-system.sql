-- Script de Verificación del Sistema de Staff
-- Ejecuta esto en Supabase SQL Editor para verificar el estado del sistema

-- ============================================
-- 1. Verificar que el trigger existe
-- ============================================
SELECT
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created_activate_staff';

-- Resultado esperado: Una fila con el trigger


-- ============================================
-- 2. Verificar función del trigger
-- ============================================
SELECT
    proname as function_name,
    prosrc as function_source
FROM pg_proc
WHERE proname = 'activate_staff_account';

-- Resultado esperado: Una fila con la función


-- ============================================
-- 3. Ver todos los staff members
-- ============================================
SELECT
    id,
    email,
    full_name,
    role,
    status,
    user_id,
    activated_at,
    first_login_completed,
    invited_at
FROM club_staff
ORDER BY invited_at DESC;

-- Revisa los valores:
-- - status: debería ser 'active' para usuarios que aceptaron
-- - user_id: debería tener un UUID para usuarios activados
-- - first_login_completed: false para nuevos, true después del onboarding


-- ============================================
-- 4. Ver invitaciones pendientes
-- ============================================
SELECT
    email,
    full_name,
    role,
    invited_at,
    EXTRACT(EPOCH FROM (now() - invited_at))/3600 as hours_since_invite
FROM club_staff
WHERE status = 'pending'
ORDER BY invited_at DESC;

-- Muestra invitaciones que aún no han sido aceptadas


-- ============================================
-- 5. Verificar integración con organization_users
-- ============================================
SELECT
    cs.email,
    cs.full_name,
    cs.role as staff_role,
    cs.status,
    ou.role as org_role,
    ou.user_id
FROM club_staff cs
LEFT JOIN organization_users ou ON cs.user_id = ou.user_id
WHERE cs.status = 'active'
ORDER BY cs.activated_at DESC;

-- Verifica que cada staff activo tiene entrada en organization_users
-- staff_role → org_role mapping:
-- gestor → owner
-- admin → admin
-- profesor → staff


-- ============================================
-- 6. Detectar problemas de activación
-- ============================================
-- Staff activos sin user_id (no debería haber ninguno)
SELECT
    email,
    full_name,
    status,
    activated_at
FROM club_staff
WHERE status = 'active' AND user_id IS NULL;

-- Staff activos sin entrada en organization_users (no debería haber ninguno)
SELECT
    cs.email,
    cs.full_name,
    cs.status,
    cs.user_id
FROM club_staff cs
WHERE cs.status = 'active'
    AND NOT EXISTS (
        SELECT 1
        FROM organization_users ou
        WHERE ou.user_id = cs.user_id
    );


-- ============================================
-- 7. Ver usuarios recientes que necesitan onboarding
-- ============================================
SELECT
    cs.email,
    cs.full_name,
    cs.role,
    cs.activated_at,
    cs.first_login_completed,
    EXTRACT(EPOCH FROM (now() - cs.activated_at))/60 as minutes_since_activation
FROM club_staff cs
WHERE cs.status = 'active'
    AND cs.activated_at > now() - interval '24 hours'
ORDER BY cs.activated_at DESC;

-- first_login_completed debería ser:
-- - false: Usuario necesita completar onboarding
-- - true: Usuario ya completó el onboarding


-- ============================================
-- 8. Estadísticas del sistema
-- ============================================
SELECT
    status,
    COUNT(*) as count,
    array_agg(DISTINCT role) as roles
FROM club_staff
GROUP BY status;

-- Muestra resumen de staff por estado
