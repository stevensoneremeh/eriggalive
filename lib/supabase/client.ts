import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/types/database"

let supabaseClient: ReturnType<typeof createBrowserClient<Database>> | null = null

export function createClient() {
  if (supabaseClient) return supabaseClient

  const isBrowser = typeof window !== "undefined"
  const isPreviewMode =
    isBrowser && (window.location.hostname.includes("vusercontent.net") || window.location.hostname.includes("v0.dev"))

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (isPreviewMode || !supabaseUrl || !supabaseAnonKey) {
    console.warn("Using mock Supabase client")
    return createMockClient()
  }

  supabaseClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "pkce",
    },
  })

  return supabaseClient
}

function createMockClient() {
  const mockUser = {
    id: "mock-user-id",
    email: "test@example.com",
    user_metadata: {},
    app_metadata: {},
    aud: "authenticated",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const mockSession = {
    access_token: "mock-access-token",
    refresh_token: "mock-refresh-token",
    expires_in: 3600,
    expires_at: Date.now() + 3600000,
    token_type: "bearer",
    user: mockUser,
  }

  return {
    auth: {
      getSession: async () => ({
        data: { session: mockSession },
        error: null,
      }),
      getUser: async () => ({
        data: { user: mockUser },
        error: null,
      }),
      signUp: async ({ email, password }: { email: string; password: string }) => ({
        data: { user: mockUser, session: mockSession },
        error: null,
      }),
      signInWithPassword: async ({ email, password }: { email: string; password: string }) => ({
        data: { user: mockUser, session: mockSession },
        error: null,
      }),
      signOut: async () => ({
        error: null,
      }),
      resetPasswordForEmail: async (email: string) => ({
        data: {},
        error: null,
      }),
      refreshSession: async () => ({
        data: { session: mockSession, user: mockUser },
        error: null,
      }),
      onAuthStateChange: (callback: any) => {
        // Simulate initial session
        setTimeout(() => {
          callback("INITIAL_SESSION", mockSession)
        }, 100)

        return {
          data: {
            subscription: {
              unsubscribe: () => {},
            },
          },
        }
      },
    },
    from: (table: string) => ({
      select: (columns: string) => ({
        eq: (column: string, value: any) => ({
          single: async () => ({
            data: {
              id: 1,
              auth_user_id: "mock-user-id",
              username: "testuser",
              full_name: "Test User",
              email: "test@example.com",
              tier: "free",
              coins_balance: 100,
              avatar_url: null,
              level: 1,
              points: 0,
              reputation_score: 0,
              role: "user",
              is_active: true,
              is_verified: false,
              is_banned: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            error: null,
          }),
        }),
      }),
    }),
  }
}

const supabase = createClient()

export { supabase }
export const createClientSupabase = createClient
export default createClient
