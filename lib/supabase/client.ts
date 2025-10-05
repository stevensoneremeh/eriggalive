import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/types/database"

<<<<<<< HEAD
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
=======
export function createClient() {
  // Validate environment variables
>>>>>>> new
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
<<<<<<< HEAD
=======
    console.warn("Missing Supabase environment variables. Some features may not work properly.")
    // Return a mock client that prevents crashes
>>>>>>> new
    return createMockClient()
  }

  try {
<<<<<<< HEAD
    return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
=======
    return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
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
>>>>>>> new
  } catch (error) {
    console.error("Failed to create Supabase client:", error)
    return createMockClient()
  }
}

<<<<<<< HEAD
// Export a singleton instance for convenience
export const supabase = createClient()
=======
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
>>>>>>> new
