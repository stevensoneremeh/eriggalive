/**
 * Server-side Supabase client (singleton).
 * Exposes:
 *  • createClient                   ─ named  ✅
 *  • createServerSupabaseClient     ─ named  ✅ (alias, matches previous code)
 *  • default                        ─ same   ✅
 */
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Supabase env vars are not set (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).")
}

let _serverClient: ReturnType<typeof createSupabaseClient> | undefined

export function createClient() {
  if (!_serverClient) {
    _serverClient = createSupabaseClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }
  return _serverClient
}

export const createServerSupabaseClient = createClient
export default createClient
