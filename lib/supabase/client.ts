import { createClient as supabaseCreateClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

// Check if we're in a browser environment
const isBrowser = typeof window !== "undefined"

// Check if we're in preview mode
const isPreviewMode =
  isBrowser &&
  (window.location.hostname.includes("vusercontent.net") ||
    window.location.hostname.includes("v0.dev") ||
    process.env.NEXT_PUBLIC_VERCEL_ENV === "preview")

// Define the mock client function for preview mode
const createMockClient = () => {
  const mockUser = {
    id: "mock-user-id",
    email: "mock@example.com",
    user_metadata: { username: "mockuser", full_name: "Mock User" },
    email_confirmed_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const mockSession = {
    access_token: "mock-token",
    refresh_token: "mock-refresh-token",
    expires_in: 3600,
    token_type: "bearer",
    user: mockUser,
  }

  return {
    auth: {
      getSession: () =>
        Promise.resolve({
          data: { session: mockSession },
          error: null,
        }),
      getUser: () =>
        Promise.resolve({
          data: { user: mockUser },
          error: null,
        }),
      signInWithPassword: ({ email, password }: { email: string; password: string }) => {
        // Simulate validation
        if (!email || !password) {
          return Promise.resolve({
            data: { user: null, session: null },
            error: { message: "Email and password are required" },
          })
        }
        return Promise.resolve({
          data: { user: mockUser, session: mockSession },
          error: null,
        })
      },
      signUp: ({ email, password, options }: any) => {
        if (!email || !password) {
          return Promise.resolve({
            data: { user: null, session: null },
            error: { message: "Email and password are required" },
          })
        }
        return Promise.resolve({
          data: { user: mockUser, session: mockSession },
          error: null,
        })
      },
      signOut: () => Promise.resolve({ error: null }),
      onAuthStateChange: (callback: any) => {
        // Simulate initial auth state
        setTimeout(() => {
          callback("SIGNED_IN", mockSession)
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
                  role: "user",
                  coins: 500,
                  level: 1,
                  points: 0,
                  avatar_url: null,
                  is_verified: false,
                  is_active: true,
                  is_banned: false,
                  login_count: 1,
                  email_verified: true,
                  phone_verified: false,
                  two_factor_enabled: false,
                  preferences: {},
                  metadata: {},
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                },
                error: null,
              })
            }
            if (table === "users" && column === "username") {
              // Simulate username check - return null to indicate username is available
              return Promise.resolve({ data: null, error: { code: "PGRST116" } })
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
                    user_id: 1,
                    category_id: 1,
                    content: `Mock post content ${i + 1}. This is a sample post to demonstrate the community feature.`,
                    vote_count: Math.floor(Math.random() * 50),
                    comment_count: Math.floor(Math.random() * 10),
                    is_published: true,
                    is_deleted: false,
                    created_at: new Date(Date.now() - i * 3600000).toISOString(),
                    updated_at: new Date(Date.now() - i * 3600000).toISOString(),
                    user: {
                      id: 1,
                      auth_user_id: "mock-user-id",
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
                    votes: [],
                  })),
                error: null,
              })
            }
            if (table === "community_categories") {
              return Promise.resolve({
                data: [
                  {
                    id: 1,
                    name: "General",
                    slug: "general",
                    description: "General discussions",
                    is_active: true,
                    display_order: 1,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  },
                  {
                    id: 2,
                    name: "Music",
                    slug: "music",
                    description: "Music discussions and bars",
                    is_active: true,
                    display_order: 2,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  },
                  {
                    id: 3,
                    name: "Events",
                    slug: "events",
                    description: "Upcoming events and shows",
                    is_active: true,
                    display_order: 3,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  },
                ],
                error: null,
              })
            }
            if (table === "community_comments") {
              return Promise.resolve({
                data: [],
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
    rpc: (functionName: string, params: any) => {
      if (functionName === "handle_post_vote") {
        return Promise.resolve({ data: true, error: null })
      }
      return Promise.resolve({ data: true, error: null })
    },
    raw: (sql: string) => sql,
  } as any
}

// Create a Supabase client for browser usage
export function createClient() {
  if (isPreviewMode) {
    console.log("Using mock Supabase client for preview mode")
    return createMockClient()
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Missing Supabase environment variables, using mock client")
    return createMockClient()
  }

  try {
    return supabaseCreateClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  } catch (error) {
    console.error("Error creating Supabase client:", error)
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
