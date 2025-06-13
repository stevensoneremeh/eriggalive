import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { Database } from "@/types/database"

// Helper to check if we're in a preview environment
export const isPreviewMode = () => {
  const hostname = process.env.VERCEL_URL || ""
  return (
    hostname.includes("preview") ||
    hostname.includes("localhost") ||
    hostname.includes("127.0.0.1") ||
    process.env.NODE_ENV !== "production"
  )
}

// Helper to check if we're in a production environment
export const isProduction = () => {
  return process.env.NODE_ENV === "production"
}

// Helper to check if we're in a development environment
export const isDevelopment = () => {
  return process.env.NODE_ENV === "development"
}

// Create a server-side Supabase client (uses cookies for auth)
export const createServerSupabaseClient = () => {
  const cookieStore = cookies()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables")
  }

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get: (name) => cookieStore.get(name)?.value,
      set: (name, value, options) => {
        cookieStore.set({ name, value, ...options })
      },
      remove: (name, options) => {
        cookieStore.set({ name, value: "", ...options })
      },
    },
  })
}

// Create an admin client with service role key (for admin operations)
export const createAdminSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase service role key")
  }

  return createServerClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        "x-application-name": "eriggalive-admin",
      },
    },
  })
}

// Create a mock server client for preview mode
export const createMockServerClient = () => {
  return {
    from: (table: string) => ({
      select: (query?: string) => ({
        eq: (column: string, value: any) => ({
          single: () => Promise.resolve({ data: null, error: null }),
          order: (column: string, { ascending }: { ascending: boolean }) => ({
            limit: (limit: number) => Promise.resolve({ data: [], error: null }),
          }),
        }),
        order: (column: string, { ascending }: { ascending: boolean }) => ({
          limit: (limit: number) => Promise.resolve({ data: [], error: null }),
        }),
        limit: (limit: number) => Promise.resolve({ data: [], error: null }),
      }),
      insert: (data: any) => Promise.resolve({ data: { id: Math.floor(Math.random() * 1000) }, error: null }),
      update: (data: any) => Promise.resolve({ data: data, error: null }),
      delete: () => Promise.resolve({ data: null, error: null }),
    }),
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    },
  } as any
}

// Create a server-side client that works in both preview and production
export const getServerClient = async () => {
  if (isPreviewMode()) {
    return createMockServerClient()
  }

  return createServerSupabaseClient()
}
