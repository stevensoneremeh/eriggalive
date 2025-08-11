import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

// Check if we're in a browser environment
const isBrowser = typeof window !== "undefined"

// Check if we're in preview mode
const isPreviewMode =
  isBrowser && (window.location.hostname.includes("vusercontent.net") || window.location.hostname.includes("v0.dev"))

// Define the mock client function for preview mode
const createMockClient = () => {
  return {
    auth: {
      getSession: () =>
        Promise.resolve({
          data: {
            session: {
              user: {
                id: "mock-user-id",
                email: "mock@example.com",
                user_metadata: { username: "mockuser", full_name: "Mock User" },
              },
              access_token: "mock-token",
              refresh_token: "mock-refresh-token",
              expires_at: Date.now() + 3600000,
              token_type: "bearer",
            },
          },
          error: null,
        }),
      getUser: () =>
        Promise.resolve({
          data: {
            user: {
              id: "mock-user-id",
              email: "mock@example.com",
              user_metadata: { username: "mockuser", full_name: "Mock User" },
              aud: "authenticated",
              role: "authenticated",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          },
          error: null,
        }),
      signInWithPassword: () =>
        Promise.resolve({
          data: {
            user: {
              id: "mock-user-id",
              email: "mock@example.com",
              user_metadata: { username: "mockuser", full_name: "Mock User" },
              aud: "authenticated",
              role: "authenticated",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            session: {
              access_token: "mock-token",
              refresh_token: "mock-refresh-token",
              expires_at: Date.now() + 3600000,
              token_type: "bearer",
              user: {
                id: "mock-user-id",
                email: "mock@example.com",
              },
            },
          },
          error: null,
        }),
      signUp: () =>
        Promise.resolve({
          data: {
            user: {
              id: "mock-user-id",
              email: "mock@example.com",
              user_metadata: { username: "mockuser", full_name: "Mock User" },
              aud: "authenticated",
              role: "authenticated",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            session: {
              access_token: "mock-token",
              refresh_token: "mock-refresh-token",
              expires_at: Date.now() + 3600000,
              token_type: "bearer",
              user: {
                id: "mock-user-id",
                email: "mock@example.com",
              },
            },
          },
          error: null,
        }),
      signOut: () => Promise.resolve({ error: null }),
      resetPasswordForEmail: () => Promise.resolve({ error: null }),
      updateUser: () => Promise.resolve({ 
        data: { user: null },
        error: null 
      }),
      exchangeCodeForSession: () => Promise.resolve({ 
        data: { session: null, user: null },
        error: null 
      }),
      onAuthStateChange: (callback: any) => {
        // Simulate initial auth state
        setTimeout(() => {
          callback("SIGNED_IN", {
            access_token: "mock-token",
            refresh_token: "mock-refresh-token",
            expires_at: Date.now() + 3600000,
            token_type: "bearer",
            user: {
              id: "mock-user-id",
              email: "mock@example.com",
              user_metadata: { username: "mockuser", full_name: "Mock User" },
            },
          })
        }, 100)
        return { data: { subscription: { unsubscribe: () => {} } } }
      },
    },
    from: (table: string) => ({
      select: (columns?: string) => ({
        eq: (column: string, value: any) => ({
          single: () => {
            if (table === "users" && column === "auth_user_id") {
              return Promise.resolve({
                data: {
                  id: 1,
                  auth_user_id: value,
                  username: "mockuser",
                  full_name: "Mock User",
                  email: "mock@example.com",
                  tier: "grassroot",
                  coins: 500,
                  level: 1,
                  points: 0,
                  reputation_score: 100,
                  avatar_url: null,
                  is_verified: false,
                  is_active: true,
                  is_banned: false,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                },
                error: null,
              })
            }
            return Promise.resolve({ data: null, error: null })
          },
          maybeSingle: () => Promise.resolve({ data: null, error: null }),
        }),
        order: (column: string, options?: { ascending: boolean }) => ({
          limit: (limit: number) => {
            if (table === "community_posts") {
              return Promise.resolve({
                data: Array(Math.min(limit, 3))
                  .fill(0)
                  .map((_, i) => ({
                    id: i + 1,
                    content: `Mock post content ${i + 1}`,
                    vote_count: Math.floor(Math.random() * 50),
                    comment_count: Math.floor(Math.random() * 10),
                    created_at: new Date().toISOString(),
                    user: {
                      id: 1,
                      username: "mockuser",
                      full_name: "Mock User",
                      tier: "grassroot",
                      avatar_url: null,
                    },
                    category: {
                      id: 1,
                      name: "General",
                      slug: "general",
                    },
                    user_has_voted: false,
                  })),
                error: null,
              })
            }
            if (table === "community_categories") {
              return Promise.resolve({
                data: [
                  { id: 1, name: "General", slug: "general", is_active: true },
                  { id: 2, name: "Music", slug: "music", is_active: true },
                  { id: 3, name: "Events", slug: "events", is_active: true },
                ],
                error: null,
              })
            }
            return Promise.resolve({ data: [], error: null })
          },
          range: (start: number, end: number) => Promise.resolve({ data: [], error: null }),
        }),
        is: (column: string, value: any) => ({
          order: (column: string, options?: { ascending: boolean }) => ({
            limit: (limit: number) => Promise.resolve({ data: [], error: null }),
          }),
        }),
        ilike: (column: string, value: string) => ({
          limit: (limit: number) => Promise.resolve({ data: [], error: null }),
        }),
        or: (conditions: string) => ({
          limit: (limit: number) => Promise.resolve({ data: [], error: null }),
        }),
      }),
      insert: (data: any) => ({
        select: (columns?: string) => ({
          single: () =>
            Promise.resolve({
              data: {
                ...data,
                id: Math.floor(Math.random() * 1000),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              error: null,
            }),
        }),
      }),
      update: (data: any) => ({
        eq: (column: string, value: any) => ({
          select: (columns?: string) => ({
            single: () => Promise.resolve({ data: { ...data }, error: null }),
          }),
        }),
      }),
      delete: () => ({
        eq: (column: string, value: any) => Promise.resolve({ error: null }),
      }),
    }),
    storage: {
      from: (bucket: string) => ({
        upload: (path: string, file: File) =>
          Promise.resolve({
            data: { path: `mock/${path}` },
            error: null,
          }),
        getPublicUrl: (path: string) => ({
          data: { publicUrl: `/placeholder.svg` },
        }),
      }),
    },
    rpc: (functionName: string, params: any) => Promise.resolve({ data: true, error: null }),
  } as any
}

// Create a Supabase client for browser usage
export function createClient() {
  if (isPreviewMode) {
    return createMockClient()
  }

  // Validate environment variables
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('Missing Supabase environment variables')
    return createMockClient()
  }

  try {
    return createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
        global: {
          headers: {
            'X-Client-Info': 'eriggalive-web',
          },
        },
      }
    )
  } catch (error) {
    console.error('Failed to create Supabase client:', error)
    return createMockClient()
  }
}

// Export a singleton instance for consistent usage
let supabaseClient: ReturnType<typeof createClient> | null = null

export function getSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = createClient()
  }
  return supabaseClient
}
