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
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
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

  const mockProfile = {
    id: 1,
    auth_user_id: "mock-user-id",
    username: "testuser",
    display_name: "Test User",
    full_name: "Test User",
    email: "test@example.com",
    subscription_tier: "general",
    coins_balance: 1000,
    avatar_url: null,
    bio: null,
    location: null,
    website: null,
    total_posts: 0,
    total_votes_received: 0,
    total_comments: 0,
    is_verified: false,
    is_active: true,
    last_seen_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  // Create a chainable query builder mock
  const createQueryBuilder = (tableName: string) => {
    const queryBuilder = {
      select: (columns = "*") => ({
        ...queryBuilder,
        eq: (column: string, value: any) => ({
          ...queryBuilder,
          single: async () => ({
            data: tableName === "users" ? mockProfile : null,
            error: null,
          }),
          order: (column: string, options?: { ascending?: boolean }) => ({
            ...queryBuilder,
          }),
        }),
        order: (column: string, options?: { ascending?: boolean }) => ({
          ...queryBuilder,
          limit: (count: number) => ({
            ...queryBuilder,
          }),
        }),
        limit: (count: number) => ({
          ...queryBuilder,
        }),
      }),
      insert: (data: any) => ({
        ...queryBuilder,
        select: (columns?: string) => ({
          ...queryBuilder,
          single: async () => ({
            data: { ...mockProfile, ...data },
            error: null,
          }),
        }),
      }),
      update: (data: any) => ({
        ...queryBuilder,
        eq: (column: string, value: any) => ({
          ...queryBuilder,
          single: async () => ({
            data: { ...mockProfile, ...data },
            error: null,
          }),
        }),
      }),
      delete: () => ({
        ...queryBuilder,
        eq: (column: string, value: any) => ({
          ...queryBuilder,
        }),
      }),
    }
    return queryBuilder
  }

  // Mock channel for real-time subscriptions
  const createMockChannel = (channelName: string) => ({
    on: (event: string, filter: any, callback: Function) => ({
      on: (event: string, filter: any, callback: Function) => ({
        subscribe: (callback?: Function) => {
          if (callback) {
            setTimeout(() => callback("SUBSCRIBED"), 100)
          }
          return {
            unsubscribe: () => Promise.resolve({ error: null }),
          }
        },
      }),
      subscribe: (callback?: Function) => {
        if (callback) {
          setTimeout(() => callback("SUBSCRIBED"), 100)
        }
        return {
          unsubscribe: () => Promise.resolve({ error: null }),
        }
      },
    }),
    subscribe: (callback?: Function) => {
      if (callback) {
        setTimeout(() => callback("SUBSCRIBED"), 100)
      }
      return {
        unsubscribe: () => Promise.resolve({ error: null }),
      }
    },
  })

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
    from: (table: string) => createQueryBuilder(table),
    channel: (channelName: string) => createMockChannel(channelName),
    removeChannel: (channel: any) => Promise.resolve({ error: null }),
    removeAllChannels: () => Promise.resolve({ error: null }),
  }
}

const supabase = createClient()

export { supabase }
export const createClientSupabase = createClient
export default createClient
