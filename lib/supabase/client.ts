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
    console.warn("Using mock Supabase client for preview/development")
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
        eventsPerSecond: 2,
      },
    },
    global: {
      headers: {
        "x-my-custom-header": "my-app-name",
      },
    },
  })

  return supabaseClient
}

function createMockClient() {
  const mockUser = {
    id: "mock-user-id-123",
    email: "test@example.com",
    user_metadata: {
      full_name: "Test User",
      username: "testuser",
    },
    app_metadata: {},
    aud: "authenticated",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    email_confirmed_at: new Date().toISOString(),
    phone_confirmed_at: null,
    confirmed_at: new Date().toISOString(),
    last_sign_in_at: new Date().toISOString(),
    role: "authenticated",
  }

  const mockSession = {
    access_token: "mock-access-token",
    refresh_token: "mock-refresh-token",
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: "bearer",
    user: mockUser,
  }

  const mockProfile = {
    id: 1,
    auth_user_id: "mock-user-id-123",
    username: "testuser",
    display_name: "Test User",
    full_name: "Test User",
    email: "test@example.com",
    subscription_tier: "grassroot",
    coins_balance: 1500,
    avatar_url: null,
    bio: "Test user for development",
    location: "Lagos, Nigeria",
    website: null,
    total_posts: 12,
    total_votes_received: 45,
    total_comments: 23,
    is_verified: false,
    is_active: true,
    last_seen_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const mockCategories = [
    { id: 1, name: "General", slug: "general", description: "General discussions", is_active: true },
    { id: 2, name: "Music", slug: "music", description: "Music discussions", is_active: true },
    { id: 3, name: "Bars", slug: "bars", description: "Share your bars", is_active: true },
  ]

  const mockPosts = [
    {
      id: 1,
      user_id: 1,
      category_id: 1,
      title: "Welcome to the community!",
      content: "This is a sample post to show how the community works.",
      vote_count: 12,
      comment_count: 5,
      created_at: new Date().toISOString(),
      user: {
        id: 1,
        username: "testuser",
        display_name: "Test User",
        avatar_url: null,
        subscription_tier: "grassroot",
      },
      category: { id: 1, name: "General", slug: "general" },
    },
  ]

  // Create a chainable query builder mock
  const createQueryBuilder = (tableName: string) => {
    const queryBuilder = {
      select: (columns = "*") => ({
        ...queryBuilder,
        eq: (column: string, value: any) => ({
          ...queryBuilder,
          single: async () => {
            if (tableName === "users") {
              return { data: mockProfile, error: null }
            }
            return { data: null, error: null }
          },
          limit: (count: number) => ({
            ...queryBuilder,
            then: async (resolve: any) => {
              if (tableName === "community_categories") {
                return resolve({ data: mockCategories, error: null })
              }
              if (tableName === "community_posts") {
                return resolve({ data: mockPosts, error: null })
              }
              return resolve({ data: [], error: null })
            },
          }),
        }),
        limit: (count: number) => ({
          ...queryBuilder,
          then: async (resolve: any) => {
            if (tableName === "community_categories") {
              return resolve({ data: mockCategories, error: null })
            }
            if (tableName === "community_posts") {
              return resolve({ data: mockPosts, error: null })
            }
            return resolve({ data: [], error: null })
          },
        }),
        then: async (resolve: any) => {
          if (tableName === "community_categories") {
            return resolve({ data: mockCategories, error: null })
          }
          if (tableName === "community_posts") {
            return resolve({ data: mockPosts, error: null })
          }
          return resolve({ data: [], error: null })
        },
      }),
      insert: (data: any) => ({
        ...queryBuilder,
        select: (columns?: string) => ({
          ...queryBuilder,
          single: async () => ({
            data: { id: Date.now(), ...data, created_at: new Date().toISOString() },
            error: null,
          }),
        }),
      }),
      update: (data: any) => ({
        ...queryBuilder,
        eq: (column: string, value: any) => ({
          ...queryBuilder,
          select: (columns?: string) => ({
            ...queryBuilder,
            single: async () => ({
              data: { ...mockProfile, ...data, updated_at: new Date().toISOString() },
              error: null,
            }),
          }),
        }),
      }),
      delete: () => ({
        ...queryBuilder,
        eq: (column: string, value: any) => queryBuilder,
      }),
      upsert: (data: any) => ({
        ...queryBuilder,
        select: (columns?: string) => ({
          ...queryBuilder,
          single: async () => ({
            data: { id: Date.now(), ...data },
            error: null,
          }),
        }),
      }),
    }
    return queryBuilder
  }

  // Mock channels for realtime functionality
  const mockChannels = new Map()

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
      signUp: async ({ email, password, options }: any) => ({
        data: { user: mockUser, session: mockSession },
        error: null,
      }),
      signInWithPassword: async ({ email, password }: any) => ({
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
    channel: (name: string) => {
      const mockChannel = {
        on: (event: string, filter: any, callback: any) => {
          return {
            on: (event2: string, filter2: any, callback2: any) => ({
              subscribe: (statusCallback?: any) => {
                if (statusCallback) statusCallback("SUBSCRIBED", null)
                mockChannels.set(name, mockChannel)
                return mockChannel
              },
            }),
            subscribe: (statusCallback?: any) => {
              if (statusCallback) statusCallback("SUBSCRIBED", null)
              mockChannels.set(name, mockChannel)
              return mockChannel
            },
          }
        },
        subscribe: (statusCallback?: any) => {
          if (statusCallback) statusCallback("SUBSCRIBED", null)
          mockChannels.set(name, mockChannel)
          return mockChannel
        },
        unsubscribe: () => {
          mockChannels.delete(name)
          return Promise.resolve({ error: null })
        },
      }
      return mockChannel
    },
    removeChannel: (channel: any) => {
      // Find and remove the channel from our mock channels
      for (const [name, ch] of mockChannels.entries()) {
        if (ch === channel) {
          mockChannels.delete(name)
          break
        }
      }
      return Promise.resolve({ error: null })
    },
    removeAllChannels: () => {
      mockChannels.clear()
      return Promise.resolve({ error: null })
    },
  }
}

const supabase = createClient()
export { supabase }
export default createClient
