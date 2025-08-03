import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/types/database"
import { cookies } from "next/headers"

export const isProduction = () => process.env.NODE_ENV === "production"
export const isDevelopment = () => process.env.NODE_ENV === "development"

export const isPreviewMode = () =>
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_VERCEL_ENV === "preview"

export function createMockServerClient(): SupabaseClient<Database> {
  console.warn("⚠️ Using mock server client - Supabase environment variables not configured")

  const mockQueryBuilder = {
    eq: (column: string, value: any) => ({
      ...mockQueryBuilder,
      single: () => Promise.resolve({ data: null, error: null }),
      maybeSingle: () => Promise.resolve({ data: null, error: null }),
    }),
    order: (column: string, options?: { ascending: boolean }) => ({
      ...mockQueryBuilder,
      limit: (limit: number) => Promise.resolve({ data: [], error: null }),
      range: (start: number, end: number) => Promise.resolve({ data: [], error: null }),
    }),
    limit: (limit: number) => Promise.resolve({ data: [], error: null }),
    range: (start: number, end: number) => Promise.resolve({ data: [], error: null }),
    is: (column: string, value: any) => mockQueryBuilder,
    ilike: (column: string, value: string) => mockQueryBuilder,
    or: (conditions: string) => mockQueryBuilder,
    single: () => Promise.resolve({ data: null, error: null }),
    maybeSingle: () => Promise.resolve({ data: null, error: null }),
  }

  // @ts-expect-error – minimal mock implementation for server-side operations
  return {
    from: (table: string) => ({
      select: (columns?: string) => mockQueryBuilder,
      insert: (data: any) => ({
        select: (columns?: string) => ({
          single: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
      upsert: (data: any) => Promise.resolve({ data: [], error: null }),
      update: (data: any) => ({
        eq: (column: string, value: any) => ({
          select: (columns?: string) => ({
            single: () => Promise.resolve({ data: null, error: null }),
          }),
        }),
      }),
      delete: () => ({
        eq: (column: string, value: any) => Promise.resolve({ data: null, error: null }),
        in: (column: string, values: any[]) => Promise.resolve({ error: null }),
      }),
    }),
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
    },
    rpc: (functionName: string, params: any) => Promise.resolve({ data: null, error: null }),
    storage: {
      from: (bucket: string) => ({
        upload: (path: string, file: any) => Promise.resolve({ data: null, error: null }),
        getPublicUrl: (path: string) => ({ data: { publicUrl: "" } }),
      }),
    },
  }
}

export const createServerClient = () => {
  const cookieStore = cookies()
  return createServerComponentClient<Database>({ cookies: () => cookieStore })
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

export const createClient = createServerClient
export const getServerClient = createServerClient
