/**
 * Server-side Supabase helper.
 *  – Injects the request/response cookies so RLS continues to work
 *  – Exposes `createClientSupabase` (+ legacy alias) & a convenience `supabase` getter
 */

import { cookies, headers } from "next/headers"
import { createClient as createSupabaseServerClient } from "@supabase/supabase-js"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

let _serverClient: SupabaseClient<Database> | null = null

export function createClientSupabase(): SupabaseClient<Database> {
  if (_serverClient) return _serverClient

  if (!supabaseUrl || !serviceKey) {
    throw new Error("[Supabase] SUPABASE_SERVICE_ROLE_KEY (or anon key) / URL missing in server environment.")
  }

  _serverClient = createSupabaseServerClient<Database>(supabaseUrl, serviceKey, {
    // Forward client cookies to maintain auth context for RLS
    global: {
      headers: {
        cookie: cookies().toString(),
        ...Object.fromEntries(headers()),
      },
    },
  })

  return _serverClient
}

// Convenience singleton
export const supabase = createClientSupabase()

// Legacy alias
export { createClientSupabase as createClient }
