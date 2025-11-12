#!/bin/bash

# Script para aplicar la migración directamente a Supabase
# Lee las credenciales de .env.local

echo "🚀 Aplicando migración: 003_fix_staff_activation_trigger.sql"
echo ""

# Leer variables de .env.local
if [ ! -f .env.local ]; then
    echo "❌ Error: .env.local no encontrado"
    exit 1
fi

# Extraer variables
SUPABASE_URL=$(grep NEXT_PUBLIC_SUPABASE_URL .env.local | cut -d '=' -f2)
SERVICE_KEY=$(grep SUPABASE_SERVICE_ROLE_KEY .env.local | cut -d '=' -f2)

if [ -z "$SUPABASE_URL" ] || [ -z "$SERVICE_KEY" ]; then
    echo "❌ Error: No se pudieron leer las credenciales de .env.local"
    exit 1
fi

echo "📡 Conectando a: $SUPABASE_URL"
echo ""

# Leer el archivo SQL
SQL_FILE="supabase/migrations/003_fix_staff_activation_trigger.sql"

if [ ! -f "$SQL_FILE" ]; then
    echo "❌ Error: $SQL_FILE no encontrado"
    exit 1
fi

echo "📄 Migración cargada"
echo ""
echo "⚠️  NOTA: La API REST de Supabase no soporta ejecución directa de SQL DDL."
echo "    Debes aplicar esta migración manualmente desde Supabase Dashboard."
echo ""
echo "📋 Pasos para aplicar la migración:"
echo ""
echo "   1. Ve a: https://supabase.com/dashboard"
echo "   2. Selecciona tu proyecto"
echo "   3. SQL Editor → New Query"
echo "   4. Copia y pega el contenido de: $SQL_FILE"
echo "   5. Ejecuta (Run o Cmd+Enter)"
echo ""
echo "El contenido de la migración se muestra a continuación:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
cat "$SQL_FILE"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Para verificar que se aplicó correctamente, ejecuta:"
echo "   SELECT * FROM information_schema.triggers"
echo "   WHERE trigger_name = 'on_auth_user_created_activate_staff';"
echo ""
