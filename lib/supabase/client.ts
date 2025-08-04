import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/types/database"

const createMockClient = () => {
  console.warn("⚠️ Using mock client - Supabase environment variables not configured")

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
    select: (columns?: string) => mockQueryBuilder,
    insert: (data: any) => ({
      select: (columns?: string) => ({
        single: () => Promise.resolve({ data: null, error: null }),
      }),
    }),
    update: (data: any) => ({
      eq: (column: string, value: any) => ({
        select: (columns?: string) => ({
          single: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
    }),
    delete: () => ({
      eq: (column: string, value: any) => Promise.resolve({ error: null }),
      in: (column: string, values: any[]) => Promise.resolve({ error: null }),
    }),
  }

  return {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      signInWithPassword: () =>
        Promise.resolve({
          data: { user: null, session: null },
          error: { message: "Supabase not configured" },
        }),
      signUp: () =>
        Promise.resolve({
          data: { user: null, session: null },
          error: { message: "Supabase not configured" },
        }),
      signOut: () => Promise.resolve({ error: null }),
      resetPasswordForEmail: () => Promise.resolve({ error: { message: "Supabase not configured" } }),
      updateUser: () =>
        Promise.resolve({
          data: { user: null },
          error: { message: "Supabase not configured" },
        }),
      onAuthStateChange: (callback: any) => {
        return {
          data: {
            subscription: {
              unsubscribe: () => {},
            },
          },
        }
      },
    },
    from: (table: string) => ({
      select: (columns?: string) => mockQueryBuilder,
      insert: (data: any) => ({
        select: (columns?: string) => ({
          single: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
      update: (data: any) => ({
        eq: (column: string, value: any) => ({
          select: (columns?: string) => ({
            single: () => Promise.resolve({ data: null, error: null }),
          }),
        }),
      }),
      delete: () => ({
        eq: (column: string, value: any) => Promise.resolve({ error: null }),
        in: (column: string, values: any[]) => Promise.resolve({ error: null }),
      }),
    }),
    storage: {
      from: (bucket: string) => ({
        upload: (path: string, file: File) => Promise.resolve({ data: null, error: null }),
        getPublicUrl: (path: string) => ({ data: { publicUrl: "" } }),
      }),
    },
    rpc: (functionName: string, params: any) => Promise.resolve({ data: null, error: null }),
  } as any
}

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return createMockClient()
  }

  try {
    return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
  } catch (error) {
    console.error("Failed to create Supabase client:", error)
    return createMockClient()
  }
}

// Export a singleton instance for convenience
export const supabase = createClient()
