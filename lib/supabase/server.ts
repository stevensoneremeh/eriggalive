import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"
import { cookies } from "next/headers"

export const isProduction = () => process.env.NODE_ENV === "production"
export const isDevelopment = () => process.env.NODE_ENV === "development"

export const isPreviewMode = () =>
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_VERCEL_ENV === "preview"

export function createMockServerClient(): SupabaseClient<Database> {
  // @ts-expect-error – minimal mock implementation
  return {
    from: (table: string) => ({
      select: () => Promise.resolve({ data: [], error: { message: "Supabase not configured" } }),
      insert: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }),
      upsert: () => Promise.resolve({ data: [], error: { message: "Supabase not configured" } }),
      update: () => Promise.resolve({ data: [], error: { message: "Supabase not configured" } }),
      delete: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }),
      eq: function () {
        return this
      },
      single: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }),
      order: function () {
        return this
      },
      limit: function () {
        return this
      },
      range: function () {
        return this
      },
    }),
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
    },
    rpc: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }),
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }),
        getPublicUrl: () => ({ data: { publicUrl: "" } }),
      }),
    },
  }
}

export function createServerSupabaseClient() {
  if (isPreviewMode()) {
    console.warn("⚠️ Using mock server Supabase client - environment variables not configured")
    return createMockServerClient()
  }

  try {
    const cookieStore = cookies()
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    return createSupabaseClient<Database>(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
      },
      global: {
        headers: {
          Cookie: cookieStore.toString(),
        },
      },
    })
  } catch (error) {
    console.warn("Failed to create real Supabase client, falling back to mock:", error)
    return createMockServerClient()
  }
}

export function createServerSupabaseClientWithAuth(): SupabaseClient<Database> {
  if (isPreviewMode()) {
    return createMockServerClient()
  }

  try {
    const cookieStore = cookies()
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    return createSupabaseClient<Database>(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
      },
      global: {
        headers: {
          Cookie: cookieStore.toString(),
        },
      },
    })
  } catch (error) {
    console.warn("Failed to create authenticated Supabase client, falling back to mock:", error)
    return createMockServerClient()
  }
}

export function createAdminSupabaseClient(): SupabaseClient<Database> {
  if (isPreviewMode()) {
    return createMockServerClient()
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    return createSupabaseClient<Database>(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    })
  } catch (error) {
    console.warn("Failed to create admin Supabase client, falling back to mock:", error)
    return createMockServerClient()
  }
}

export const createClient = createServerSupabaseClient
export const getServerClient = createServerSupabaseClient
