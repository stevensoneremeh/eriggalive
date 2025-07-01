"use client"

import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

/**
 * In the browser we either return:
 *  – A real Supabase client (when env vars are present)
 *  – A lightweight mock (during v0 / Vercel “preview” where env vars are not injected)
 */

/* -------------------------------------------------------------------------- */
/* Utils                                                                      */
/* -------------------------------------------------------------------------- */

const isBrowser = typeof window !== "undefined"
const inPreview =
  isBrowser && (window.location.hostname.includes("vusercontent.net") || window.location.hostname.includes("v0.dev"))

function buildMock() {
  /* A **very** small subset of the client – only what our UI touches.        */
  return {
    auth: {
      /* Pretend we already have a session so pages that call `useAuth()` work */
      getSession: () =>
        Promise.resolve({
          data: {
            session: {
              user: {
                id: "mock-user-id",
                email: "preview@example.com",
                user_metadata: { username: "previewuser", full_name: "Preview User" },
              },
            },
          },
          error: null,
        }),
      getUser: () =>
        Promise.resolve({
          data: {
            user: {
              id: "mock-user-id",
              email: "preview@example.com",
              user_metadata: { username: "previewuser", full_name: "Preview User" },
            },
          },
          error: null,
        }),
      signInWithPassword: () => Promise.resolve({ data: {}, error: null }),
      signUp: () => Promise.resolve({ data: {}, error: null }),
      signOut: () => Promise.resolve({ error: null }),
      onAuthStateChange: (cb: any) => ({
        data: { subscription: { unsubscribe: () => void cb?.("SIGNED_OUT") } },
      }),
    },
    /* The `from()` helper is shimmed just enough for the community feed.      */
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
    }),
  } as any
}

/* -------------------------------------------------------------------------- */
/* Factory                                                                    */
/* -------------------------------------------------------------------------- */

export function createClient() {
  if (inPreview) {
    return buildMock()
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    console.warn("Supabase env vars missing – falling back to local mock")
    return buildMock()
  }

  /* createSupabaseClient works for browser OR server – here we call it once   */
  return createSupabaseClient<Database>(url, anonKey)
}
