import { createClient as supabaseCreateClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables")
}

// Singleton pattern
let supabaseInstance: ReturnType<typeof supabaseCreateClient<Database>> | null = null

export function createSupabaseClient() {
  if (!supabaseInstance) {
    supabaseInstance = supabaseCreateClient<Database>(supabaseUrl, supabaseAnonKey, {
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

// ---- Back-compat aliases ----
export const createClient = createSupabaseClient // <- legacy import support
export const createClientSupabase = createSupabaseClient // <- additional legacy alias
export const supabase = createSupabaseClient() // singleton instance
export default supabase
