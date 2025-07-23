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

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase environment variables")
    // Return a mock client to prevent crashes
    return {
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: { message: "Supabase not configured" } }),
        getSession: () => Promise.resolve({ data: { session: null }, error: { message: "Supabase not configured" } }),
        signInWithPassword: () => Promise.resolve({ error: { message: "Supabase not configured" } }),
        signUp: () => Promise.resolve({ error: { message: "Supabase not configured" } }),
        signOut: () => Promise.resolve({ error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({ single: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }) }),
        }),
        insert: () => ({
          select: () => ({
            single: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }),
          }),
        }),
      }),
    } as any
  }

  try {
    supabaseClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
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
    // Return mock client as fallback
    return {
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: { message: "Client creation failed" } }),
        getSession: () => Promise.resolve({ data: { session: null }, error: { message: "Client creation failed" } }),
        signInWithPassword: () => Promise.resolve({ error: { message: "Client creation failed" } }),
        signUp: () => Promise.resolve({ error: { message: "Client creation failed" } }),
        signOut: () => Promise.resolve({ error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({ single: () => Promise.resolve({ data: null, error: { message: "Client creation failed" } }) }),
        }),
        insert: () => ({
          select: () => ({
            single: () => Promise.resolve({ data: null, error: { message: "Client creation failed" } }),
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
