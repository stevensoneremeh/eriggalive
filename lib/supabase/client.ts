import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/types/database"

let supabaseClient: ReturnType<typeof createBrowserClient<Database>> | null = null

export function createClient() {
  // Return existing client if it exists (singleton pattern)
  if (supabaseClient) {
    return supabaseClient
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // For development/preview mode, provide fallback values
  const fallbackUrl = "https://placeholder.supabase.co"
  const fallbackKey =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTI4MDAsImV4cCI6MTk2MDc2ODgwMH0.placeholder"

  const finalUrl = supabaseUrl || fallbackUrl
  const finalKey = supabaseAnonKey || fallbackKey

  // Only show warning in development
  if (process.env.NODE_ENV === "development" && (!supabaseUrl || !supabaseAnonKey)) {
    console.warn("⚠️ Missing Supabase environment variables. Using fallback values for development.")
    console.warn("Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your .env.local file")
  }

  try {
    supabaseClient = createBrowserClient<Database>(finalUrl, finalKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: "pkce",
      },
    })

    return supabaseClient
  } catch (error) {
    console.error("Failed to create Supabase client:", error)

    // Return a mock client for development
    return {
      auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        signInWithPassword: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }),
        signUp: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }),
        signOut: () => Promise.resolve({ error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }),
          }),
        }),
        insert: () => ({
          select: () => ({
            single: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }),
          }),
        }),
      }),
    } as any
  }
}

// Legacy alias for backward compatibility
export const createClientSupabase = createClient

// Default export
export default createClient
