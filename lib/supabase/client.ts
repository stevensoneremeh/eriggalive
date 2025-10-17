import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/types/database"

let client: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  // Validate environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Missing Supabase environment variables. Some features may not work properly.")
    // Return a mock client that prevents crashes
    return createMockClient()
  }

  // Use singleton pattern for Supabase client
  if (client) {
    return client
  }

  try {
    client = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 2,
        },
      },
      global: {
        headers: {
          "X-Client-Info": "eriggalive-web",
        },
      },
    })
    return client
  } catch (error) {
    console.error("Failed to create Supabase client:", error)
    return createMockClient()
  }
}

function createMockClient() {
  return {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      signInWithPassword: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }),
      signUp: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }),
      signOut: () => Promise.resolve({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      resetPasswordForEmail: () => Promise.resolve({ error: { message: "Supabase not configured" } }),
      updateUser: () => Promise.resolve({ error: { message: "Supabase not configured" } }),
      refreshSession: () => Promise.resolve({ data: { session: null }, error: null }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }),
          single: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }),
        }),
      }),
      insert: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }),
      update: () => ({
        eq: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }),
      }),
      delete: () => ({
        eq: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }),
      }),
    }),
    // Disable realtime for mock client to prevent WebSocket errors
    channel: () => ({
      on: () => ({
        subscribe: () => ({
          unsubscribe: () => {}
        }),
      }),
    }),
    removeChannel: () => {},
  } as any
}

// Legacy exports removed - use createClient() instead