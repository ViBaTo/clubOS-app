#!/usr/bin/env node

/**
 * Script simple para mostrar la migración y cómo aplicarla
 */

const fs = require('fs')
const path = require('path')

console.log('╔═══════════════════════════════════════════════════════════════╗')
console.log('║  MIGRACIÓN: 003_fix_staff_activation_trigger.sql            ║')
console.log('╚═══════════════════════════════════════════════════════════════╝')
console.log('')

// Leer .env.local para mostrar la info
try {
  const envPath = path.join(__dirname, '..', '.env.local')
  const envContent = fs.readFileSync(envPath, 'utf8')
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)

  if (urlMatch) {
    const url = urlMatch[1].trim()
    const projectRef = url.split('.')[0].replace('https://', '')

    console.log('📡 Tu proyecto Supabase:')
    console.log(`   Project Ref: ${projectRef}`)
    console.log(`   URL: ${url}`)
    console.log('')
  }
} catch (e) {
  // Ignorar errores
}

console.log('⚠️  IMPORTANTE:')
console.log('   Supabase no permite ejecutar SQL DDL (CREATE/DROP TRIGGER)')
console.log('   directamente desde la API REST por razones de seguridad.')
console.log('')
console.log('📋 Para aplicar esta migración, sigue estos pasos:')
console.log('')
console.log('   1. Abre: https://supabase.com/dashboard')
console.log('   2. Selecciona tu proyecto')
console.log('   3. Navega a: SQL Editor')
console.log('   4. Click en "New Query"')
console.log('   5. Copia y pega el SQL que se muestra abajo')
console.log('   6. Click en "Run" (o presiona Cmd/Ctrl + Enter)')
console.log('')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('CONTENIDO DE LA MIGRACIÓN:')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('')

const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '003_fix_staff_activation_trigger.sql')
const sqlContent = fs.readFileSync(migrationPath, 'utf8')

console.log(sqlContent)

console.log('')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('')
console.log('✅ Después de ejecutar, verifica con esta query:')
console.log('')
console.log('   SELECT trigger_name, event_manipulation, event_object_table')
console.log('   FROM information_schema.triggers')
console.log('   WHERE trigger_name = \'on_auth_user_created_activate_staff\';')
console.log('')
console.log('   Deberías ver una fila con el trigger.')
console.log('')
console.log('📖 Más información: ONBOARDING_FIX.md')
console.log('')
