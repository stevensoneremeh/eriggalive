import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Missing Supabase environment variables")
}

// Singleton pattern
let supabaseInstance: ReturnType<typeof createSupabaseClient<Database>> | null = null

export function createClientSupabase() {
  if (!supabaseInstance && supabaseUrl && supabaseAnonKey) {
    supabaseInstance = createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: "pkce",
      },
      global: {
        headers: { "X-Client-Info": "erigga-live-web" },
      },
    })
  }
  return supabaseInstance
}

// Export all required aliases
export const createClient = createClientSupabase
export const supabase = createClientSupabase()
export default supabase
