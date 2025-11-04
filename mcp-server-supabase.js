#!/usr/bin/env node

/**
 * Servidor MCP personalizado para Supabase
 * Permite ejecutar SQL directamente desde Claude
 */

const { createClient } = require('@supabase/supabase-js')

// Configuración desde variables de entorno
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Error: SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridos')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Servidor MCP simple usando stdin/stdout
process.stdin.setEncoding('utf8')

let buffer = ''

process.stdin.on('data', async (chunk) => {
  buffer += chunk

  // Procesar mensajes JSON line por line
  const lines = buffer.split('\n')
  buffer = lines.pop() // Guardar línea incompleta

  for (const line of lines) {
    if (!line.trim()) continue

    try {
      const request = JSON.parse(line)

      if (request.method === 'tools/list') {
        // Listar herramientas disponibles
        const response = {
          jsonrpc: '2.0',
          id: request.id,
          result: {
            tools: [
              {
                name: 'supabase_execute_sql',
                description: 'Execute SQL query in Supabase',
                inputSchema: {
                  type: 'object',
                  properties: {
                    sql: {
                      type: 'string',
                      description: 'SQL query to execute'
                    }
                  },
                  required: ['sql']
                }
              },
              {
                name: 'supabase_query',
                description: 'Query a table in Supabase',
                inputSchema: {
                  type: 'object',
                  properties: {
                    table: { type: 'string' },
                    select: { type: 'string' },
                    filter: { type: 'object' }
                  },
                  required: ['table']
                }
              }
            ]
          }
        }
        process.stdout.write(JSON.stringify(response) + '\n')
      }
      else if (request.method === 'tools/call') {
        const { name, arguments: args } = request.params

        if (name === 'supabase_execute_sql') {
          // Ejecutar SQL personalizado
          const { sql } = args

          try {
            const { data, error } = await supabase.rpc('exec', { sql })

            const response = {
              jsonrpc: '2.0',
              id: request.id,
              result: {
                content: [
                  {
                    type: 'text',
                    text: error
                      ? `Error: ${error.message}`
                      : `Success: ${JSON.stringify(data, null, 2)}`
                  }
                ]
              }
            }
            process.stdout.write(JSON.stringify(response) + '\n')
          } catch (err) {
            const response = {
              jsonrpc: '2.0',
              id: request.id,
              error: {
                code: -32000,
                message: err.message
              }
            }
            process.stdout.write(JSON.stringify(response) + '\n')
          }
        }
        else if (name === 'supabase_query') {
          // Query de tabla
          const { table, select = '*', filter = {} } = args

          try {
            let query = supabase.from(table).select(select)

            // Aplicar filtros
            Object.entries(filter).forEach(([key, value]) => {
              query = query.eq(key, value)
            })

            const { data, error } = await query

            const response = {
              jsonrpc: '2.0',
              id: request.id,
              result: {
                content: [
                  {
                    type: 'text',
                    text: error
                      ? `Error: ${error.message}`
                      : JSON.stringify(data, null, 2)
                  }
                ]
              }
            }
            process.stdout.write(JSON.stringify(response) + '\n')
          } catch (err) {
            const response = {
              jsonrpc: '2.0',
              id: request.id,
              error: {
                code: -32000,
                message: err.message
              }
            }
            process.stdout.write(JSON.stringify(response) + '\n')
          }
        }
      }
    } catch (err) {
      console.error('Error parsing request:', err)
    }
  }
})

console.error('MCP Supabase Server started')
