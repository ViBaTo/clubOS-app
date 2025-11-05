# 🚀 Quick Start: Aplicar Correcciones del Onboarding

## ⚡ En 5 Minutos

### Paso 1: Aplicar Migración (2 minutos)

```bash
# Ver el SQL que necesitas ejecutar
node scripts/apply-migration-simple.js
```

**Luego:**

1. Abre [Supabase Dashboard](https://supabase.com/dashboard)
2. SQL Editor → New Query
3. Copia y pega el SQL del script anterior
4. Click **Run**

### Paso 2: Verificar (1 minuto)

En Supabase SQL Editor, ejecuta:

```sql
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created_activate_staff';
```

✅ Debe mostrar **1 fila**

### Paso 3: Probar (2 minutos)

1. Ve a `/settings/team/invite`
2. Invita a un email nuevo
3. Abre el enlace en **modo incógnito**

**Deberías ver:**
- ✅ Loading spinner
- ✅ Overlay blanco con blur
- ✅ Modal de onboarding (no se puede cerrar)
- ✅ Paso de contraseña obligatorio

---

## 📋 Checklist Rápido

Después de aplicar:

- [ ] Migración ejecutada en Supabase
- [ ] Trigger verificado (query anterior)
- [ ] Probado flujo con usuario nuevo
- [ ] Modal aparece y no se puede cerrar
- [ ] Password es obligatoria
- [ ] Dashboard se muestra después de completar

---

## 🐛 Si algo falla

### El modal no aparece:
```javascript
// Abre consola del navegador (F12)
// Busca: "Staff welcome check"
// Verifica que shouldShow = true
```

### El trigger no funciona:
```sql
-- Ver staff pendientes
SELECT email, status, user_id FROM club_staff WHERE status = 'pending';

-- Si hay usuarios que deberían estar activos, reenvía la invitación
```

### El modal se puede cerrar:
- Verifica que `requiresPasswordSetup = true` en los props del modal
- Revisa la consola por errores

---

## 📚 Documentación Completa

- **ONBOARDING_FIX.md** - Guía detallada con troubleshooting
- **RESUMEN_FINAL.md** - Resumen ejecutivo completo
- **scripts/verify-staff-system.sql** - Queries de debugging

---

## 🎯 Resultado Final

**ANTES:**
- ❌ Dashboard visible sin onboarding
- ❌ Modal se puede cerrar
- ❌ Password opcional

**DESPUÉS:**
- ✅ Overlay bloqueante
- ✅ Modal no-cerrable
- ✅ Password obligatoria
- ✅ UX profesional

---

**¿Listo?** → Ejecuta el Paso 1 y en 5 minutos tendrás todo funcionando 🚀
