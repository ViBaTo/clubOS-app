import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'

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

export function getSupabaseRouteClientWithAuth(
  request: Request | NextRequest
): SupabaseClient {
  const url = requireEnv('NEXT_PUBLIC_SUPABASE_URL')
  const anon = requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  let authorization = request.headers.get('authorization') || ''

  // Fallback: extract access token from Supabase auth cookie if Authorization header is missing.
  if (!authorization) {
    const cookieHeader = request.headers.get('cookie') || ''
    // Find cookie like sb-<project-ref>-auth-token
    const match = cookieHeader
      .split(';')
      .map((c) => c.trim())
      .find((c) => {
        const name = c.split('=')[0] || ''
        return name.includes('sb-') && name.endsWith('-auth-token')
      })
    if (match) {
      const value = match.split('=')[1] || ''
      try {
        const decoded = decodeURIComponent(value)
        const parsed = JSON.parse(decoded)
        const token =
          parsed?.currentSession?.access_token || parsed?.access_token
        if (token) authorization = `Bearer ${token}`
      } catch (_) {
        // ignore parsing errors
      }
    }
  }

  return createClient(url, anon, {
    global: { headers: authorization ? { Authorization: authorization } : {} }
  })
}
