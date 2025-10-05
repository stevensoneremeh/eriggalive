import { createClient as createSupabaseClient } from "@supabase/supabase-js"

// Check if we're in a browser environment
const isBrowser = typeof window !== "undefined"

// Check if we're in preview mode
const isPreviewMode =
  isBrowser && (window.location.hostname.includes("vusercontent.net") || window.location.hostname.includes("v0.dev"))

// Helper to check if we're in a server preview environment
export const isServerPreviewMode = () => {
  const hostname = process.env.VERCEL_URL || ""
  return (
    hostname.includes("preview") ||
    hostname.includes("localhost") ||
    hostname.includes("127.0.0.1") ||
    process.env.NODE_ENV !== "production" ||
    hostname.includes("vusercontent.net") ||
    hostname.includes("v0.dev")
  )
}

// Create a mock client for preview mode - DEFINE BEFORE USING
const createMockClient = () => {
  return {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      signInWithPassword: () =>
        Promise.resolve({
          data: { user: { id: "mock-user-id", email: "mock@example.com" }, session: { access_token: "mock-token" } },
          error: null,
        }),
      signOut: () => Promise.resolve({ error: null }),
      onAuthStateChange: (callback: any) => {
        callback("SIGNED_IN", { session: { user: { id: "mock-user-id", email: "mock@example.com" } } })
        return { data: { subscription: { unsubscribe: () => {} } } }
      },
    },
    from: (table: string) => ({
      select: (columns?: string) => ({
        eq: (column: string, value: any) => ({
          single: () => {
<<<<<<< HEAD
            if (table === "users" && column === "auth_user_id") {
              return Promise.resolve({
                data: {
                  id: 1,
                  auth_user_id: value,
                  username: "mockuser",
                  tier: "grassroot",
                  coins_balance: 500,
=======
            if (table === "user_profiles" && column === "user_id") {
              return Promise.resolve({
                data: {
                  id: 1,
                  user_id: value,
                  username: "mockuser",
                  tier: "grassroot",
                  coins: 500,
>>>>>>> new
                },
                error: null,
              })
            }
            return Promise.resolve({ data: null, error: null })
          },
        }),
        order: (column: string, { ascending }: { ascending: boolean }) => ({
          limit: (limit: number) => {
            if (table === "media_items") {
              return Promise.resolve({
                data: Array(limit)
                  .fill(0)
                  .map((_, i) => ({
                    id: i + 1,
                    title: `Mock Media ${i + 1}`,
                    description: "Mock description",
                    url: "/placeholder.jpg",
                    thumbnail_url: "/placeholder.jpg",
                    media_type: "image",
                    created_at: new Date().toISOString(),
                    tier_access: "grassroot",
                  })),
                error: null,
              })
            }
            return Promise.resolve({ data: [], error: null })
          },
        }),
      }),
      insert: (data: any) => Promise.resolve({ data: { ...data, id: Math.floor(Math.random() * 1000) }, error: null }),
      update: (data: any) => Promise.resolve({ data, error: null }),
    }),
  } as any
}

// Create a mock server client for preview mode - DEFINE BEFORE USING
export const createMockServerClient = () => {
  return {
    from: (table: string) => ({
      select: (query?: string) => ({
        eq: (column: string, value: any) => ({
          single: () => {
<<<<<<< HEAD
            if (table === "users" && column === "auth_user_id") {
              return Promise.resolve({
                data: {
                  id: 1,
                  auth_user_id: value,
                  username: "mockuser",
                  tier: "grassroot",
                  coins_balance: 500,
=======
            if (table === "user_profiles" && column === "user_id") {
              return Promise.resolve({
                data: {
                  id: 1,
                  user_id: value,
                  username: "mockuser",
                  tier: "grassroot",
                  coins: 500,
>>>>>>> new
                },
                error: null,
              })
            }
            return Promise.resolve({ data: null, error: null })
          },
          order: (column: string, { ascending }: { ascending: boolean }) => ({
            limit: (limit: number) => {
              if (table === "media_items") {
                return Promise.resolve({
                  data: Array(limit)
                    .fill(0)
                    .map((_, i) => ({
                      id: i + 1,
                      title: `Mock Media ${i + 1}`,
                      description: "Mock description",
                      url: "/placeholder.jpg",
                      thumbnail_url: "/placeholder.jpg",
                      media_type: "image",
                      created_at: new Date().toISOString(),
                      tier_access: "grassroot",
                    })),
                  error: null,
                })
              }
              return Promise.resolve({ data: [], error: null })
            },
          }),
        }),
        order: (column: string, { ascending }: { ascending: boolean }) => ({
          limit: (limit: number) => {
            if (table === "media_items") {
              return Promise.resolve({
                data: Array(limit)
                  .fill(0)
                  .map((_, i) => ({
                    id: i + 1,
                    title: `Mock Media ${i + 1}`,
                    description: "Mock description",
                    url: "/placeholder.jpg",
                    thumbnail_url: "/placeholder.jpg",
                    media_type: "image",
                    created_at: new Date().toISOString(),
                    tier_access: "grassroot",
                  })),
                error: null,
              })
            }
            return Promise.resolve({ data: [], error: null })
          },
        }),
        limit: (limit: number) => {
          if (table === "media_items") {
            return Promise.resolve({
              data: Array(limit)
                .fill(0)
                .map((_, i) => ({
                  id: i + 1,
                  title: `Mock Media ${i + 1}`,
                  description: "Mock description",
                  url: "/placeholder.jpg",
                  thumbnail_url: "/placeholder.jpg",
                  media_type: "image",
                  created_at: new Date().toISOString(),
                  tier_access: "grassroot",
                })),
              error: null,
            })
          }
          return Promise.resolve({ data: [], error: null })
        },
      }),
      insert: (data: any) => Promise.resolve({ data: { ...data, id: Math.floor(Math.random() * 1000) }, error: null }),
      update: (data: any) => Promise.resolve({ data, error: null }),
      delete: () => Promise.resolve({ data: null, error: null }),
    }),
    auth: {
      getUser: () =>
        Promise.resolve({ data: { user: { id: "mock-user-id", email: "mock@example.com" } }, error: null }),
      getSession: () =>
        Promise.resolve({
          data: { session: { user: { id: "mock-user-id", email: "mock@example.com" } } },
          error: null,
        }),
    },
  } as any
}

// Create a Supabase client for browser usage
export const createClient = () => {
  if (isPreviewMode) {
    return createMockClient()
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase environment variables")
    return createMockClient()
  }

  return createSupabaseClient(supabaseUrl, supabaseAnonKey)
}

// Create a server-side Supabase client
export function createServerSupabaseClient() {
  // If in preview mode, return a mock client
  if (isServerPreviewMode()) {
    return createMockServerClient()
  }

  // Otherwise, create a real Supabase client
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase environment variables for server client")
    return createMockServerClient()
  }

  return createSupabaseClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// Create an admin Supabase client with service role key
export function createAdminSupabaseClient() {
  // If in preview mode, return a mock client
  if (isServerPreviewMode()) {
    return createMockServerClient()
  }

  // Otherwise, create a real Supabase client with admin privileges
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase environment variables for admin client")
    return createMockServerClient()
  }

  return createSupabaseClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// Create a singleton client for client-side usage
export const supabaseClient = createClient()

// Get a server-side client
export const getServerClient = async () => {
  return createServerSupabaseClient()
}
