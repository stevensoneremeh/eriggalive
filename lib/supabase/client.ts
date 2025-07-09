/**
 * ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
 * ┃ Supabase BROWSER client – singleton + verbose auth logging    ┃
 * ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
 *
 *  • Uses @supabase/ssr createBrowserClient (works in Next.js)
 *  • Persists sessions & auto-refreshes tokens
 *  • Falls back to a harmless mock when env-vars are missing
 */

import { createBrowserClient, type SupabaseClient } from "@supabase/ssr"
import type { Database } from "@/types/database"

/* ──────────────────────────────────────────────────────────────── */
/* Environment helpers                                              */
/* ──────────────────────────────────────────────────────────────── */
const PLACEHOLDER_URL = "https://placeholder.supabase.co"
const PLACEHOLDER_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder-key"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? PLACEHOLDER_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? PLACEHOLDER_KEY

/* ──────────────────────────────────────────────────────────────── */
/* Logger helpers                                                   */
/* ──────────────────────────────────────────────────────────────── */
const LOG = "[Supabase-Client]"
const now = () => new Date().toISOString()
const log = (msg: string, obj?: unknown) => console.log(`${LOG} ${now()} – ${msg}`, obj ?? "")
const warn = (msg: string, obj?: unknown) => console.warn(`${LOG} ${now()} – ⚠️  ${msg}`, obj ?? "")
const errorLog = (msg: string, obj?: unknown) => console.error(`${LOG} ${now()} – ❌ ${msg}`, obj)

/* ──────────────────────────────────────────────────────────────── */
/* Singleton creator                                                */
/* ──────────────────────────────────────────────────────────────── */
let _supabase: SupabaseClient<Database> | undefined

export function createClient(): SupabaseClient<Database> {
  if (_supabase) return _supabase

  if (SUPABASE_URL !== PLACEHOLDER_URL && SUPABASE_ANON_KEY !== PLACEHOLDER_KEY) {
    log("Initialising Supabase browser client")
    _supabase = createBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
      global: { headers: { "X-Client-Info": "erigga-live-web" } },
    })

    /* verbose auth-state logging */
    _supabase.auth.onAuthStateChange((event, session) => {
      log(`Auth event: ${event}`, {
        userId: session?.user?.id,
        email: session?.user?.email,
        expires: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : null,
      })
    })
  } else {
    /* Preview / CI fallback */
    warn("Environment vars missing – using mock Supabase client")
    // @ts-expect-error – intentionally partial mock for previews
    _supabase = {
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({
          data: { subscription: { unsubscribe() {} } },
        }),
        signInWithPassword: async () => ({
          data: null,
          error: { message: "Supabase not configured" },
        }),
        signUp: async () => ({
          data: null,
          error: { message: "Supabase not configured" },
        }),
        signOut: async () => ({ error: null }),
      },
      from() {
        return {
          select: () => ({
            maybeSingle: async () => ({ data: null, error: null }),
            eq: () => ({
              maybeSingle: async () => ({ data: null, error: null }),
            }),
          }),
          insert: async () => ({
            data: null,
            error: { message: "Supabase not configured" },
          }),
          update() {
            return {
              eq: async () => ({
                data: null,
                error: { message: "Supabase not configured" },
              }),
            }
          },
        }
      },
    }
  }

  return _supabase
}

/* convenient re-exports */
export const supabase = createClient()
export const createClientSupabase = createClient
export const authLogger = {
  logCurrentSession: async () => {
    try {
      const { data } = await supabase.auth.getSession()
      log("Current session snapshot", data.session)
    } catch (e) {
      errorLog("Failed to get current session", e)
    }
  },
}

export default supabase
