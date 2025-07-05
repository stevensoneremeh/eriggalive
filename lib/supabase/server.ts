import { createClient } from "@supabase/supabase-js"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

/**
 * Server-side Supabase client (singleton).
 * Works in Route Handlers, Server Actions, and Server Components.
 *
 * All legacy imports below are supported:
 *   import { createClientSupabase } from "@/lib/supabase/server"
 *   import createServerSupabase     from "@/lib/supabase/server"
 */
let _serverClient: SupabaseClient<Database> | null = null

function initServerClient() {
  if (_serverClient) return _serverClient

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error(
      "Supabase environment variables are missing on the server. " +
        "Add `NEXT_PUBLIC_SUPABASE_URL` and " +
        "`SUPABASE_SERVICE_ROLE_KEY` (or anon key) in Vercel.",
    )
  }

  _serverClient = createClient<Database>(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
  return _serverClient
}

export const createClientSupabase = initServerClient // legacy alias
export const createServerSupabase = initServerClient // alt alias
export default initServerClient
