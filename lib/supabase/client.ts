import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/types/database"

let supabaseClient: ReturnType<typeof createBrowserClient<Database>> | null = null

export function createClient() {
  // Return existing client if it exists (singleton pattern)
  if (supabaseClient) {
    return supabaseClient
  }

  // Check if we're in a browser environment
  const isBrowser = typeof window !== "undefined"

  // Check if we're in preview mode
  const isPreviewMode =
    isBrowser && (window.location.hostname.includes("vusercontent.net") || window.location.hostname.includes("v0.dev"))

  // If in preview mode, return a mock client
  if (isPreviewMode) {
    return createMockClient()
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase environment variables")
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

// Create a mock client for preview mode
function createMockClient() {
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
        callback("SIGNED_IN", { user: { id: "mock-user-id", email: "mock@example.com" } })
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
                  coins_balance: 500,
                  avatar_url: null,
                },
                error: null,
              })
            }
            return Promise.resolve({ data: null, error: null })
          },
        }),
        order: (column: string, { ascending }: { ascending: boolean }) => ({
          limit: (limit: number) => {
            if (table === "community_posts") {
              return Promise.resolve({
                data: Array(limit)
                  .fill(0)
                  .map((_, i) => ({
                    id: i + 1,
                    title: `Mock Post ${i + 1}`,
                    content: "This is a mock post content",
                    user_id: "mock-user-id",
                    created_at: new Date().toISOString(),
                    category_id: 1,
                    upvotes: 5,
                    downvotes: 1,
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

// Legacy alias for backward compatibility
export const createClientSupabase = createClient

// Default export
export default createClient
