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
              if (table === "user_profiles") {
                return Promise.resolve({
                  data: {
                    id: value,
                    username: "mockuser",
                    email: "mock@example.com",
                    tier: "grassroot",
                    coins_balance: 500,
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

  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  })
}

// Create and export the client instance
export const supabase = createClient()

// Export the client as default as well for compatibility
export default supabase
