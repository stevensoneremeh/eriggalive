import { createClient as supabaseCreateClient } from "@supabase/supabase-js"

// Check if we're in a browser environment
const isBrowser = typeof window !== "undefined"

// Check if we're in preview mode
const isPreviewMode =
  isBrowser && (window.location.hostname.includes("vusercontent.net") || window.location.hostname.includes("v0.dev"))

// Define the mock client function BEFORE it's used
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
            if (table === "user_profiles" && column === "user_id") {
              return Promise.resolve({
                data: {
                  id: 1,
                  user_id: value,
                  username: "mockuser",
                  tier: "grassroot",
                  coins: 500,
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

  return supabaseCreateClient(supabaseUrl, supabaseAnonKey)
}

// Create a singleton instance
const supabaseClientInstance = createClient()

// Export the singleton instance as default
export default supabaseClientInstance
