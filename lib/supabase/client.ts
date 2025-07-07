/**
 * Browser-side Supabase helper.
 *  – Uses the singleton pattern so the client is created only once
 *  – Exposes BOTH `createClientSupabase` (new name) and `createClient` (legacy)
 *  – Falls back gracefully if env-vars are missing to avoid “Failed to fetch”
 */

import { createClient as createSupabaseBrowserClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"
import type { SupabaseClient } from "@supabase/supabase-js"

// Public env-vars (must be set in Vercel → Project Settings → Environment Variables)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

let _client: SupabaseClient<Database> | null = null

export function createClientSupabase(): SupabaseClient<Database> {
  if (_client) return _client

  if (!supabaseUrl || !supabaseAnonKey) {
    // Warn once and create a dummy client that always throws
    console.warn(
      "[Supabase] NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is missing. " +
        "All Supabase calls will fail until those env-vars are provided.",
    )

    // A minimal proxy so calling code doesn’t crash with “undefined is not a function”
    const handler = {
      get() {
        throw new Error("Supabase env-vars missing – cannot perform database call.")
      },
    }
    // @ts-expect-error – we knowingly cast a proxy to SupabaseClient to keep API shape
    _client = new Proxy({}, handler) as SupabaseClient<Database>
    return _client
  }

  _client = createSupabaseBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
  return _client
}

// Singleton instance for convenient importing
export const supabase = createClientSupabase()

// Legacy alias so older code (`import { createClient } …`) keeps working
export { createClientSupabase as createClient }
