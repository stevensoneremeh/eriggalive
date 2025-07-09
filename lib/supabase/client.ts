/**
 * --------------------------------------------------------------------
 *  Supabase Browser Client  with  Verbose Session Logging
 * --------------------------------------------------------------------
 *  – Singleton pattern (avoids duplicate clients on Fast-Refresh)
 *  – Uses @supabase/ssr `createBrowserClient`
 *  – Emits detailed logs for every auth-state change
 *  – Falls back to a harmless mock when env-vars are missing
 *  – Re-exports everything the rest of the codebase expects
 */

import { createBrowserClient, type SupabaseClient } from "@supabase/ssr"
import type { Database } from "@/types/database"

/* ------------------------------------------------------------------ */
/* Environment helpers                                                */
/* ------------------------------------------------------------------ */
const PLACEHOLDER_URL = "https://placeholder.supabase.co"
const PLACEHOLDER_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder-key"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? PLACEHOLDER_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? PLACEHOLDER_KEY

/* ------------------------------------------------------------------ */
/* Logger helpers                                                     */
/* ------------------------------------------------------------------ */
const LOG = "[Supabase-Client]"
const now = () => new Date().toISOString()
const log = (msg: string, obj?: unknown) => console.log(`${LOG} ${now()} – ${msg}`, obj ?? "")
const warn = (msg: string, obj?: unknown) => console.warn(`${LOG} ${now()} – ⚠️  ${msg}`, obj ?? "")
const errorLog = (msg: string, obj?: unknown) => console.error(`${LOG} ${now()} – ❌ ${msg}`, obj)

/* ------------------------------------------------------------------ */
/* Singleton creator                                                  */
/* ------------------------------------------------------------------ */
let client: SupabaseClient<Database> | undefined

/** Returns a singleton Supabase browser client */
export function createClient(): SupabaseClient<Database> {
  if (!client) {
    if (SUPABASE_URL !== PLACEHOLDER_URL && SUPABASE_ANON_KEY !== PLACEHOLDER_KEY) {
      log("Initialising Supabase client")
      client = createBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
        },
        global: {
          headers: { "X-Client-Info": "erigga-live-web-client" },
        },
      })

      /* ------------  verbose auth-state logging  ------------------- */
      client.auth.onAuthStateChange((event, session) => {
        console.log(`[Auth] ${event}`, {
          userId: session?.user?.id,
          email: session?.user?.email,
          expires: session?.expires_at,
        })
      })
    } else {
      /* --------------  mock for Preview / CI  ---------------------- */
      warn("Environment vars missing – using mock Supabase client")
      client = {
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
      } as any
    }
  }
  return client
}

/* ------------------------------------------------------------------ */
/* Public re-exports (what other files expect)                        */
/* ------------------------------------------------------------------ */
export const createClientSupabase = createClient
export const supabase = createClient()
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
