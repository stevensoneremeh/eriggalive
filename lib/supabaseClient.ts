import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

// Check if we're in a browser environment
const isBrowser = typeof window !== "undefined"

// Check if we're in preview mode or missing env vars
const isPreviewMode =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  (isBrowser && (window.location.hostname.includes("vusercontent.net") || window.location.hostname.includes("v0.dev")))

// Create the actual Supabase client
function createSupabaseClient() {
  // If in preview mode or missing env vars, throw error for auth operations
  if (isPreviewMode) {
    console.warn("⚠️ Supabase environment variables not configured")
    // Return a minimal client that will fail auth operations gracefully
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

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  })
}

// Export the client
export const supabase = createSupabaseClient()
export default supabase
