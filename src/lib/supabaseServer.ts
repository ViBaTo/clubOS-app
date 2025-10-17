import { createClient, type SupabaseClient } from '@supabase/supabase-js'

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing env ${name}`)
  return value
}

export function getSupabaseAdminClient(): SupabaseClient {
  const url = requireEnv('NEXT_PUBLIC_SUPABASE_URL')
  const serviceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY')
  return createClient(url, serviceKey)
}

export function getSupabaseRouteClientWithAuth(request: Request): SupabaseClient {
  const url = requireEnv('NEXT_PUBLIC_SUPABASE_URL')
  const anon = requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  const authorization = request.headers.get('authorization') || ''
  return createClient(url, anon, {
    global: { headers: { Authorization: authorization } },
  })
}


