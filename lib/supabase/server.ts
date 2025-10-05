import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { Database } from "@/types/database"

export async function createClient() {
  const cookieStore = await cookies()

  // Validate environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[SERVER] Missing Supabase environment variables")
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
            order: () => ({
              eq: () => Promise.resolve({ data: [], error: { message: "Supabase not configured" } }),
            }),
          }),
          order: () => Promise.resolve({ data: [], error: { message: "Supabase not configured" } }),
        }),
        insert: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }),
        update: () => ({
          eq: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }),
        }),
        delete: () => ({
          eq: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }),
        }),
      }),
      storage: {
        from: () => ({
          upload: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }),
          download: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }),
          list: () => Promise.resolve({ data: [], error: { message: "Supabase not configured" } }),
          remove: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }),
        }),
        listBuckets: () => Promise.resolve({ data: [], error: { message: "Supabase not configured" } }),
        createBucket: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }),
      },
      // Add real-time functionality for mock server client  
      channel: (name: string) => ({
        on: (event: string, config: any, callback: any) => ({
          subscribe: () => ({ 
            unsubscribe: () => {} 
          }),
        }),
      }),
      removeChannel: () => {},
    } as any
  }

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch (error: any) {
          console.warn("[SERVER] Cookie setting failed in server component:", error.message)
        }
      },
    },
  })
}

export async function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("[SERVER] Missing Supabase admin environment variables")
    throw new Error("Missing Supabase admin environment variables")
  }

  return createServerClient<Database>(supabaseUrl, supabaseServiceKey, {
    cookies: {
      getAll() {
        return []
      },
      setAll() {
        // Admin client doesn't need cookies
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// Legacy exports removed - use createClient() or createAdminClient() instead
