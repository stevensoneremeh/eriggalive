import { createClient as supabaseCreateClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

const isBrowser = typeof window !== "undefined"

const isPreviewMode =
  isBrowser &&
  (window.location.hostname.includes("vusercontent.net") ||
    window.location.hostname.includes("v0.dev") ||
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

const createMockClient = () => {
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
    from: () => ({
      select: () => Promise.resolve({ data: [], error: { message: "Supabase not configured" } }),
      insert: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }),
      update: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }),
      delete: () => Promise.resolve({ error: { message: "Supabase not configured" } }),
    }),
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }),
        getPublicUrl: () => ({ data: { publicUrl: "" } }),
      }),
    },
    rpc: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }),
  } as any
}

export function createClient() {
  if (isPreviewMode) {
    console.warn("⚠️ Using mock client - Supabase environment variables not configured")
    return createMockClient()
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Missing Supabase environment variables, using mock client")
    return createMockClient()
  }

  try {
    return supabaseCreateClient<Database>(supabaseUrl, supabaseAnonKey)
  } catch (error) {
    console.error("Failed to create Supabase client:", error)
    return createMockClient()
  }
}

let supabaseClient: ReturnType<typeof createClient> | null = null

export function getSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = createClient()
  }
  return supabaseClient
}
