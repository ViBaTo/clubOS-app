// ============================================================================
// MOCK SUPABASE CLIENT FOR DEV BRANCH
// This file provides mock implementations that don't require real Supabase
// ============================================================================

import { mockCurrentUser, mockOrganization } from '@/src/data/mock-data'

// Mock client that simulates Supabase client interface
const mockSupabaseClient = {
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
    signInWithPassword: async () => ({
      data: {
        user: {
          id: mockCurrentUser.id,
          email: mockCurrentUser.email,
        },
        session: {
          access_token: 'mock-access-token',
        },
      },
      error: null,
    }),
    signUp: async () => ({
      data: {
        user: {
          id: 'new-user-id',
          email: 'new@user.com',
        },
      },
      error: null,
    }),
    signOut: async () => ({ error: null }),
    resetPasswordForEmail: async () => ({ error: null }),
    updateUser: async () => ({
      data: { user: { id: mockCurrentUser.id } },
      error: null,
    }),
    onAuthStateChange: (callback: any) => {
      // Immediately call with mock session
      callback('SIGNED_IN', {
        user: {
          id: mockCurrentUser.id,
          email: mockCurrentUser.email,
        },
      })
      return {
        data: { subscription: { unsubscribe: () => {} } },
      }
    },
  },
  from: (table: string) => createMockQueryBuilder(table),
}

// Mock query builder that returns empty results
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

export function isSupabaseConfigured(): boolean {
  // In mock mode, always return true
  return true
}

export function getSupabaseClient(): any {
  return mockSupabaseClient
}
