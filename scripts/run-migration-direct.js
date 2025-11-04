#!/usr/bin/env node

/**
 * Ejecutar la migración directamente usando @supabase/supabase-js
 */

const fs = require('fs')
const path = require('path')

// Leer .env.local
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

async function runMigration() {
  const env = loadEnv()
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    console.error('❌ Credenciales no encontradas en .env.local')
    process.exit(1)
  }

  console.log('🚀 Ejecutando migración directamente...')
  console.log('📡 URL:', supabaseUrl)
  console.log('')

  // Leer el SQL
  const sqlPath = path.join(__dirname, '..', 'supabase', 'migrations', '003_fix_staff_activation_trigger.sql')
  const sql = fs.readFileSync(sqlPath, 'utf8')

  // Intentar con @supabase/supabase-js
  try {
    const { createClient } = require('@supabase/supabase-js')

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    console.log('⚙️  Ejecutando SQL...')

    // Dividir en comandos individuales
    const commands = sql
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'))

    console.log(`   Encontrados ${commands.length} comandos SQL`)
    console.log('')

    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < commands.length; i++) {
      const cmd = commands[i]
      const preview = cmd.substring(0, 80).replace(/\n/g, ' ')

      console.log(`   [${i + 1}/${commands.length}] ${preview}...`)

      try {
        // Usar rpc para ejecutar SQL personalizado si existe
        const { data, error } = await supabase.rpc('exec', { sql: cmd + ';' })

        if (error) {
          console.log(`      ❌ Error: ${error.message}`)
          errorCount++
        } else {
          console.log(`      ✅ OK`)
          successCount++
        }
      } catch (err) {
        console.log(`      ❌ Excepción: ${err.message}`)
        errorCount++
      }
    }

    console.log('')
    console.log(`✅ Comandos exitosos: ${successCount}`)
    console.log(`❌ Comandos fallidos: ${errorCount}`)
    console.log('')

    if (errorCount > 0) {
      console.log('⚠️  Algunos comandos fallaron.')
      console.log('   Esto es normal - Supabase no expone una función RPC para ejecutar DDL.')
      console.log('')
      console.log('💡 Solución: Aplica la migración manualmente desde Supabase Dashboard')
      console.log('   1. https://supabase.com/dashboard')
      console.log('   2. SQL Editor')
      console.log('   3. Copia y pega el SQL de: supabase/migrations/003_fix_staff_activation_trigger.sql')
      console.log('')
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
    console.log('')
    console.log('💡 La ejecución programática de SQL DDL no está disponible.')
    console.log('   Debes aplicar la migración manualmente desde Supabase Dashboard.')
    console.log('')
    console.log('   Ejecuta: node scripts/apply-migration-simple.js')
    console.log('   Para ver el SQL completo listo para copiar.')
    console.log('')
  }
}

runMigration()
