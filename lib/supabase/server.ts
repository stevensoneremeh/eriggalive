import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js"

// ---------------------------------------------------------------------------
// Environment checks
// ---------------------------------------------------------------------------
const url = process.env.SUPABASE_URL
const anon = process.env.SUPABASE_ANON_KEY
const service = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !anon) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables")
}

// ---------------------------------------------------------------------------
// Singleton helpers (server-only)
// ---------------------------------------------------------------------------
let _anonClient: SupabaseClient | undefined
let _serviceClient: SupabaseClient | undefined

/**
 * Standard server-side client that uses the **anon** key.
 * Most of the application should call this.
 */
export function createClient(): SupabaseClient {
  if (!_anonClient) {
    _anonClient = createSupabaseClient(url, anon, {
      auth: { persistSession: false },
    })
  }
  return _anonClient
}

/**
 * Alias kept for backward compatibility.
 */
export const createServerSupabaseClient = createClient

/**
 * Elevated client that uses the **service-role** key.
 * NEVER expose this on the client!
 */
export function createAdminSupabaseClient(): SupabaseClient {
  if (!service) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set – cannot create admin client")
  }
  if (!_serviceClient) {
    _serviceClient = createSupabaseClient(url, service, {
      auth: { persistSession: false },
    })
  }
  return _serviceClient
}
