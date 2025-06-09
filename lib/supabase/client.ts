import { createBrowserClient } from "@supabase/ssr"

// Create a singleton instance
let supabaseClient: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  // Return existing client if already created (singleton pattern)
  if (supabaseClient) return supabaseClient

  try {
    // Get environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // Check if environment variables are defined
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Missing Supabase environment variables")
      throw new Error("Missing Supabase environment variables")
    }

    // Create client
    supabaseClient = createBrowserClient(supabaseUrl, supabaseAnonKey)
    return supabaseClient
  } catch (error) {
    console.error("Error creating Supabase client:", error)

    // Return a mock client that won't throw errors when methods are called
    // This prevents the app from crashing when Supabase is unavailable
    return {
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () => ({ data: null, error: new Error("Supabase client creation failed") }),
            order: () => ({
              limit: () => ({ data: null, error: new Error("Supabase client creation failed") }),
            }),
          }),
          order: () => ({
            limit: () => ({ data: null, error: new Error("Supabase client creation failed") }),
          }),
          limit: () => ({ data: null, error: new Error("Supabase client creation failed") }),
        }),
        insert: () => ({ error: new Error("Supabase client creation failed") }),
        update: () => ({ error: new Error("Supabase client creation failed") }),
      }),
      auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        signInWithPassword: () =>
          Promise.resolve({ data: { user: null }, error: new Error("Supabase client creation failed") }),
        signUp: () => Promise.resolve({ data: { user: null }, error: new Error("Supabase client creation failed") }),
        signOut: () => Promise.resolve({ error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      },
    } as any
  }
}
