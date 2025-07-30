import { createClient as createSupabaseClient } from "@supabase/supabase-js"

export function createClient() {
  // Check if we're in a browser environment
  const isBrowser = typeof window !== "undefined"

  // Check if we're in preview mode
  const isPreviewMode =
    isBrowser && (window.location.hostname.includes("vusercontent.net") || window.location.hostname.includes("v0.dev"))

  if (isPreviewMode) {
    // Return a mock client for preview mode
    return {
      auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        signInWithPassword: () =>
          Promise.resolve({
            data: { user: { id: "mock-user-id", email: "mock@example.com" }, session: { access_token: "mock-token" } },
            error: null,
          }),
        signUp: () =>
          Promise.resolve({
            data: { user: { id: "mock-user-id", email: "mock@example.com" }, session: { access_token: "mock-token" } },
            error: null,
          }),
        signOut: () => Promise.resolve({ error: null }),
        onAuthStateChange: (callback: any) => {
          callback("SIGNED_OUT", null)
          return { data: { subscription: { unsubscribe: () => {} } } }
        },
        refreshSession: () => Promise.resolve({ data: { session: null }, error: null }),
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
                    display_name: "Mock User",
                    full_name: "Mock User",
                    email: "mock@example.com",
                    subscription_tier: "grassroot",
                    coins_balance: 500,
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
                  },
                  error: null,
                })
              }
              return Promise.resolve({ data: null, error: null })
            },
          }),
          order: (column: string, { ascending }: { ascending: boolean }) => ({
            limit: (limit: number) => {
              return Promise.resolve({ data: [], error: null })
            },
          }),
          limit: (limit: number) => Promise.resolve({ data: [], error: null }),
        }),
        insert: (data: any) => ({
          select: () => ({
            single: () =>
              Promise.resolve({
                data: { ...data, id: Math.random().toString() },
                error: null,
              }),
          }),
        }),
        update: (data: any) => ({
          eq: (column: string, value: any) => Promise.resolve({ data, error: null }),
        }),
      }),
      channel: (name: string) => ({
        on: (event: string, config: any, callback: any) => ({
          subscribe: () => {},
        }),
      }),
    } as any
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co"
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key"

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Missing Supabase environment variables")
    throw new Error("Missing Supabase environment variables")
  }

  return createSupabaseClient(supabaseUrl, supabaseAnonKey)
}

// Create a singleton client instance
const supabaseInstance = createClient()

// Export both the function and the instance
export { supabaseInstance }
export default supabaseInstance
