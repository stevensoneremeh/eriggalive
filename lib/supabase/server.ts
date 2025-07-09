/**
 * Centralised Supabase helpers for Server Components, Route Handlers and
 * background jobs.  All functions are SINGLETONS to avoid re-instantiation.
 *
 * ┌────────────────────────────────────────────────────────────┐
 * │  Named exports                                            │
 * ├────────────────────────────────────────────────────────────┤
 * │  • createServerSupabaseClient()  – anonymous key client    │
 * │  • createAdminSupabaseClient()   – service-role client     │
 * │  • createClient()                – alias of the former     │
 * └────────────────────────────────────────────────────────────┘
 *
 *   default export === createServerSupabaseClient
 */

import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import type { Database } from "@/types/database"

/* -------------------------------------------------------------------------- */
/*  Anonymous-key client (for requests bound to a user session / cookies)     */
/* -------------------------------------------------------------------------- */
let _serverClient: ReturnType<typeof createServerComponentClient<Database>> | undefined

export function createServerSupabaseClient() {
  if (_serverClient) return _serverClient
  const cookieStore = cookies()
  _serverClient = createServerComponentClient<Database>({ cookies: () => cookieStore })
  return _serverClient
}

/* -------------------------------------------------------------------------- */
/*  Service-role client (full DB access, no cookies)                          */
/* -------------------------------------------------------------------------- */
let _adminClient: ReturnType<typeof createSupabaseClient<Database>> | undefined

export function createAdminSupabaseClient() {
  if (_adminClient) return _adminClient

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    throw new Error(
      "Missing Supabase environment variables: " + "NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
    )
  }

  _adminClient = createSupabaseClient<Database>(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  return _adminClient
}

/* -------------------------------------------------------------------------- */
/*  Aliases / default export                                                  */
/* -------------------------------------------------------------------------- */
export const createClient = createServerSupabaseClient
export default createServerSupabaseClient
