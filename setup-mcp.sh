#!/bin/bash

# Script para configurar MCP de Supabase en Claude Desktop

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║  Setup MCP para Supabase en Claude Desktop              ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Detectar OS
OS="unknown"
CONFIG_PATH=""

if [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macOS"
    CONFIG_PATH="$HOME/Library/Application Support/Claude/claude_desktop_config.json"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="Linux"
    CONFIG_PATH="$HOME/.config/Claude/claude_desktop_config.json"
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    OS="Windows"
    CONFIG_PATH="$APPDATA/Claude/claude_desktop_config.json"
fi

echo "🖥️  Sistema operativo: $OS"
echo "📁 Ruta de configuración: $CONFIG_PATH"
echo ""

# Obtener la ruta absoluta del script MCP
SCRIPT_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/mcp-server-supabase.js"

echo "📄 Script MCP: $SCRIPT_PATH"
echo ""

# Verificar que el script existe
if [ ! -f "$SCRIPT_PATH" ]; then
    echo "❌ Error: No se encuentra mcp-server-supabase.js"
    exit 1
fi

# Hacer el script ejecutable
chmod +x "$SCRIPT_PATH"
echo "✅ Script marcado como ejecutable"
echo ""

# Leer credenciales de .env.local
if [ ! -f ".env.local" ]; then
    echo "❌ Error: .env.local no encontrado"
    exit 1
fi

SUPABASE_URL=$(grep NEXT_PUBLIC_SUPABASE_URL .env.local | cut -d '=' -f2)
SERVICE_KEY=$(grep SUPABASE_SERVICE_ROLE_KEY .env.local | cut -d '=' -f2)

if [ -z "$SUPABASE_URL" ] || [ -z "$SERVICE_KEY" ]; then
    echo "❌ Error: No se pudieron leer las credenciales de .env.local"
    exit 1
fi

echo "✅ Credenciales leídas de .env.local"
echo ""

# Crear el JSON de configuración
MCP_CONFIG=$(cat <<EOF
{
  "mcpServers": {
    "supabase-clubos": {
      "command": "node",
      "args": [
        "$SCRIPT_PATH"
      ],
      "env": {
        "SUPABASE_URL": "$SUPABASE_URL",
        "SUPABASE_SERVICE_ROLE_KEY": "$SERVICE_KEY"
      }
    }
  }
}
EOF
)

echo "📋 Configuración MCP generada:"
echo "$MCP_CONFIG" | head -10
echo "   ..."
echo ""

# Crear directorio si no existe
CONFIG_DIR=$(dirname "$CONFIG_PATH")
if [ ! -d "$CONFIG_DIR" ]; then
    echo "📁 Creando directorio: $CONFIG_DIR"
    mkdir -p "$CONFIG_DIR"
fi

# Backup del archivo existente
if [ -f "$CONFIG_PATH" ]; then
    echo "💾 Creando backup del archivo existente..."
    cp "$CONFIG_PATH" "${CONFIG_PATH}.backup.$(date +%Y%m%d_%H%M%S)"
    echo "   Backup guardado"
    echo ""
fi

# Escribir la configuración
echo "$MCP_CONFIG" > "$CONFIG_PATH"

echo "✅ Configuración guardada en: $CONFIG_PATH"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🎉 ¡Setup completo!"
echo ""
echo "📋 Próximos pasos:"
echo ""
echo "   1. Cierra completamente Claude Desktop"
echo "   2. Vuelve a abrir Claude Desktop"
echo "   3. Inicia una nueva conversación"
echo "   4. Pídele a Claude:"
echo "      'Usa el MCP de Supabase para mostrar los triggers disponibles'"
echo ""
echo "✅ Si funciona, verás que Claude ejecuta la query directamente"
echo ""
echo "📖 Más información: cat MCP_SETUP.md"
echo ""
