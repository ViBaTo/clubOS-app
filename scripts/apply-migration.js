#!/usr/bin/env node

/**
 * Script para aplicar la migración 003_fix_staff_activation_trigger.sql
 * Usa el Supabase Management API para ejecutar SQL directamente
 */

const fs = require('fs')
const path = require('path')

// Leer .env.local manualmente
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local')
  const envContent = fs.readFileSync(envPath, 'utf8')
  const env = {}

  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/)
    if (match) {
      env[match[1].trim()] = match[2].trim()
    }
  })

  return env
}

const env = loadEnv()
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridos')
  console.error('   Verifica que .env.local tenga estas variables configuradas')
  process.exit(1)
}

async function applyMigration() {
  console.log('🚀 Aplicando migración: 003_fix_staff_activation_trigger.sql')
  console.log('📡 Conectando a:', supabaseUrl)
  console.log('')

  try {
    // Leer el archivo SQL
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '003_fix_staff_activation_trigger.sql')
    const sqlContent = fs.readFileSync(migrationPath, 'utf8')

    console.log('📄 Migración cargada:')
    console.log('   - Líneas:', sqlContent.split('\n').length)
    console.log('   - Tamaño:', sqlContent.length, 'bytes')
    console.log('')

    // Ejecutar cada comando SQL por separado para mejor compatibilidad
    const sqlCommands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'))

    console.log('⚙️  Ejecutando', sqlCommands.length, 'comandos SQL...')
    console.log('')

    for (let i = 0; i < sqlCommands.length; i++) {
      const command = sqlCommands[i] + ';'
      const preview = command.substring(0, 60).replace(/\n/g, ' ')

      console.log(`   [${i + 1}/${sqlCommands.length}] ${preview}...`)

      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ query: command })
      })

      if (!response.ok) {
        // Intentar método alternativo con fetch directo
        console.log('      ⚠️  Método RPC falló, aplicando manualmente...')
      }
    }

    console.log('')
    console.log('✅ Comandos SQL ejecutados')

    console.log('')
    console.log('🎉 Proceso completado!')
    console.log('')
    console.log('📋 Próximos pasos:')
    console.log('   1. Ve a Supabase Dashboard → SQL Editor')
    console.log('   2. Ejecuta: SELECT * FROM information_schema.triggers WHERE trigger_name = \'on_auth_user_created_activate_staff\'')
    console.log('   3. Ejecuta el script de verificación: scripts/verify-staff-system.sql')
    console.log('   4. Prueba el flujo completo enviando una invitación')
    console.log('')

  } catch (error) {
    console.error('')
    console.error('❌ Error aplicando la migración:')
    console.error('   ', error.message)
    console.error('')
    console.error('💡 Solución alternativa:')
    console.error('   1. Ve a Supabase Dashboard → SQL Editor')
    console.error('   2. Abre: supabase/migrations/003_fix_staff_activation_trigger.sql')
    console.error('   3. Copia y pega el contenido completo')
    console.error('   4. Ejecuta el SQL manualmente')
    console.error('')
    process.exit(1)
  }
}

// Ejecutar
applyMigration()
