// ============================================================================
// MOCK SUPABASE SERVER CLIENT FOR DEV BRANCH
// This file provides mock implementations that don't require real Supabase
// ============================================================================

import type { NextRequest } from 'next/server'
import { mockCurrentUser } from '@/src/data/mock-data'

// Mock server client that simulates Supabase server-side interface
function createMockServerClient() {
  const mockClient: any = {
    auth: {
      getUser: async () => ({
        data: {
          user: {
            id: mockCurrentUser.id,
            email: mockCurrentUser.email,
            user_metadata: {
              full_name: mockCurrentUser.full_name,
            },
          },
        },
        error: null,
      }),
      getSession: async () => ({
        data: {
          session: {
            user: {
              id: mockCurrentUser.id,
              email: mockCurrentUser.email,
            },
            access_token: 'mock-access-token',
          },
        },
        error: null,
      }),
    },
    from: (table: string) => createMockQueryBuilder(table),
  }
  return mockClient
}

// Mock query builder
function createMockQueryBuilder(table: string) {
  const builder: any = {
    select: () => builder,
    insert: () => builder,
    update: () => builder,
    delete: () => builder,
    eq: () => builder,
    neq: () => builder,
    in: () => builder,
    is: () => builder,
    ilike: () => builder,
    or: () => builder,
    order: () => builder,
    limit: () => builder,
    range: () => builder,
    single: () => builder,
    maybeSingle: () => builder,
    then: (resolve: any) => resolve({ data: [], error: null }),
  }
  return builder
}

export function getSupabaseAdminClient(): any {
  return createMockServerClient()
}

export function getSupabaseRouteClientWithAuth(
  request: Request | NextRequest
): any {
  return createMockServerClient()
}
