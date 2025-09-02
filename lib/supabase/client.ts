import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/types/database"

// Check if we're in a browser environment
const isBrowser = typeof window !== "undefined"

// Singleton client instance
let client: ReturnType<typeof createBrowserClient<Database>> | undefined

export function createClient() {
  // Return existing client if it exists
  if (client) {
    return client
  }

  // Validate environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Missing Supabase environment variables. Some features may not work properly.")
    // Return a mock client that prevents crashes
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
    } as any
  }

  try {
    client = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
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
    return {
      auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        signInWithPassword: () => Promise.resolve({ data: null, error: { message: "Supabase client error" } }),
        signUp: () => Promise.resolve({ data: null, error: { message: "Supabase client error" } }),
        signOut: () => Promise.resolve({ error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        resetPasswordForEmail: () => Promise.resolve({ error: { message: "Supabase client error" } }),
        updateUser: () => Promise.resolve({ error: { message: "Supabase client error" } }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: () => Promise.resolve({ data: null, error: { message: "Supabase client error" } }),
            single: () => Promise.resolve({ data: null, error: { message: "Supabase client error" } }),
          }),
        }),
        insert: () => Promise.resolve({ data: null, error: { message: "Supabase client error" } }),
        update: () => ({
          eq: () => Promise.resolve({ data: null, error: { message: "Supabase client error" } }),
        }),
        delete: () => ({
          eq: () => Promise.resolve({ data: null, error: { message: "Supabase client error" } }),
        }),
      }),
    } as any
  }
}

// Export singleton getter
export function getSupabaseClient() {
  return createClient()
}
