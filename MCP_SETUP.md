# 🔌 Configurar MCP para Supabase

## ¿Qué es MCP?

MCP (Model Context Protocol) permite que Claude se conecte directamente a servicios externos como Supabase, ejecutando queries y comandos en tiempo real.

---

## 🚀 Setup Rápido

### Paso 1: Ubicar el archivo de configuración de Claude Desktop

**macOS:**
```bash
~/Library/Application Support/Claude/claude_desktop_config.json
```

**Windows:**
```bash
%APPDATA%\Claude\claude_desktop_config.json
```

**Linux:**
```bash
~/.config/Claude/claude_desktop_config.json
```

### Paso 2: Crear/editar el archivo de configuración

Si el archivo no existe, créalo. Luego añade:

```json
{
  "mcpServers": {
    "supabase-clubos": {
      "command": "node",
      "args": [
        "/Users/vicentebarberatormo/Desktop/vibato.ai/clubOS/clubOS-app/mcp-server-supabase.js"
      ],
      "env": {
        "SUPABASE_URL": "https://adnjclqgwsngetimldeu.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkbmpjbHFnd3NuZ2V0aW1sZGV1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzMxMTQ4NCwiZXhwIjoyMDcyODg3NDg0fQ.9RsaF9MS4vhPhUevPZfNg34ovcIJiX2Pu_yCJiS_3Yw"
      }
    }
  }
}
```

**IMPORTANTE:** Reemplaza la ruta absoluta del script con la ruta correcta en tu sistema.

### Paso 3: Hacer el script ejecutable

```bash
chmod +x /Users/vicentebarberatormo/Desktop/vibato.ai/clubOS/clubOS-app/mcp-server-supabase.js
```

### Paso 4: Reiniciar Claude Desktop

Cierra completamente Claude Desktop y vuelve a abrirlo.

---

## ✅ Verificar que funciona

Después de reiniciar Claude Desktop, en una nueva conversación prueba:

```
Usa el MCP de Supabase para ejecutar:
SELECT * FROM club_staff LIMIT 1;
```

Si funciona, deberías ver que Claude ejecuta la query directamente.

---

## 🔧 Troubleshooting

### No aparecen las herramientas MCP

1. **Verifica la ruta del script:**
   ```bash
   ls -la /Users/vicentebarberatormo/Desktop/vibato.ai/clubOS/clubOS-app/mcp-server-supabase.js
   ```

2. **Verifica el formato JSON:**
   ```bash
   cat ~/Library/Application\ Support/Claude/claude_desktop_config.json | python3 -m json.tool
   ```

3. **Verifica los logs de Claude Desktop:**
   - macOS: `~/Library/Logs/Claude/`
   - Busca errores relacionados con MCP

### El servidor se inicia pero falla

Verifica que @supabase/supabase-js está instalado:
```bash
cd /Users/vicentebarberatormo/Desktop/vibato.ai/clubOS/clubOS-app
npm list @supabase/supabase-js
```

Si no está instalado:
```bash
npm install @supabase/supabase-js
```

---

## 🎯 Una vez configurado

Podrás pedirme cosas como:

- "Ejecuta la migración 003 en Supabase usando MCP"
- "Muéstrame todos los staff members pendientes"
- "Verifica que el trigger existe"
- "Inserta un registro de prueba en club_staff"

Y yo podré hacerlo directamente sin que tengas que ir a Supabase Dashboard.

---

## 📝 Alternativa: Sin MCP

Si no quieres configurar MCP, simplemente:

1. Ejecuta: `node scripts/apply-migration-simple.js`
2. Copia el SQL
3. Pégalo en Supabase Dashboard → SQL Editor
4. Ejecuta

El MCP solo hace que sea más conveniente, pero no es obligatorio.

---

## 🔐 Seguridad

**IMPORTANTE:** El archivo `claude_desktop_config.json` contiene tu `service_role_key`.

- ✅ Este archivo está en tu máquina local
- ✅ No se sincroniza con la nube
- ⚠️ Ten cuidado de no compartirlo o subirlo a git

Si prefieres más seguridad, puedes:
1. Usar variables de entorno del sistema en lugar de hardcodear la key
2. O simplemente aplicar las migraciones manualmente
