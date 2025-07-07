/**
 * Centralised Supabase helpers for **server-side** code (route handlers,
 * server actions, RSCs).
 *
 * Exports
 * ──────────────────────────────────────────────────────────────
 * • createServerSupabaseClient()  → regular server client that forwards cookies
 * • createAdminSupabaseClient()   → service-role client (no cookies)
 *
 * Back-compat aliases
 * • createClient                  (legacy name)
 * • createClientSupabase          (used by older code)
 *
 * NOTE: You **must** set the following env-vars in your project / Vercel:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY   (for createServerSupabaseClient)
 *   SUPABASE_SERVICE_ROLE_KEY       (for createAdminSupabaseClient)
 */

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

// ──────────────────────────────────────────────────────────────
// helpers
// ──────────────────────────────────────────────────────────────

function assertEnv(varName: string, value: string | undefined) {
  if (!value) {
    throw new Error(`[Supabase] Missing required env-var: ${varName}`)
  }
}

// ──────────────────────────────────────────────────────────────
// public client  (uses anon key + forwards cookies)
// ──────────────────────────────────────────────────────────────
export function createServerSupabaseClient(): SupabaseClient<Database> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  assertEnv("NEXT_PUBLIC_SUPABASE_URL", supabaseUrl)
  assertEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", anonKey)

  // cookies() MUST be called **inside** the request scope
  const cookieStore = cookies()

  return createServerClient<Database>(supabaseUrl!, anonKey!, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch {
          /* ignored – happens in RSC context */
        }
      },
    },
  })
}

// ──────────────────────────────────────────────────────────────
// admin / service-role client  (no cookies)
// ──────────────────────────────────────────────────────────────
export function createAdminSupabaseClient(): SupabaseClient<Database> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  assertEnv("NEXT_PUBLIC_SUPABASE_URL", supabaseUrl)
  assertEnv("SUPABASE_SERVICE_ROLE_KEY", serviceKey)

  return createServerClient<Database>(supabaseUrl!, serviceKey!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// ──────────────────────────────────────────────────────────────
// aliases for older imports
// ──────────────────────────────────────────────────────────────
export const createClient = createServerSupabaseClient // legacy
export const createClientSupabase = createServerSupabaseClient
