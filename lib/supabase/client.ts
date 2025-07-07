/**
 * Supabase helper for **browser / client-side** code.
 *
 * Exports:
 * • supabase                       → singleton client
 * • createClientSupabase()         → factory (rarely needed on client)
 */

import { createClient } from "@supabase/supabase-js"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

// ──────────────────────────────────────────────────────────────
// env-var validation
// ──────────────────────────────────────────────────────────────
function assertEnv(varName: string, value: string | undefined) {
  if (!value) {
    throw new Error(`[Supabase] Missing required env-var: ${varName}`)
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

assertEnv("NEXT_PUBLIC_SUPABASE_URL", supabaseUrl)
assertEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", anonKey)

// ──────────────────────────────────────────────────────────────
// singleton client (recommended for most client-side calls)
// ──────────────────────────────────────────────────────────────
let _client: SupabaseClient<Database> | null = null

export function createClientSupabase(): SupabaseClient<Database> {
  if (_client) return _client
  _client = createClient<Database>(supabaseUrl!, anonKey!)
  return _client
}

export const supabase = createClientSupabase()
