/**
 * Browser-side Supabase client (singleton).
 * Exposes:
 *  • createClient          ─ named  ✅
 *  • createClientSupabase  ─ named  ✅ (alias, keeps legacy imports working)
 *  • default               ─ same   ✅
 *
 * Usage:
 *   import { createClient } from '@/lib/supabase/client'
 *   const supabase = createClient()
 */
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  // Fail fast during build / runtime if env vars are missing.
  throw new Error("Supabase env vars are not set (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY).")
}

let _client: ReturnType<typeof createSupabaseClient> | undefined

export function createClient() {
  if (!_client) {
    _client = createSupabaseClient(supabaseUrl, supabaseAnonKey)
  }
  return _client
}

export const createClientSupabase = createClient
export default createClient
