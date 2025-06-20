
import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"
import { cookies } from "next/headers"

/* -------------------------------------------------------------------------- */
/*                              ENV & UTIL HELPERS                            */
/* -------------------------------------------------------------------------- */

export const isProduction = () => process.env.NODE_ENV === "production"
export const isDevelopment = () => process.env.NODE_ENV === "development"

/**
 * Return TRUE when we are building locally / in preview and do **not** have a
 * real Supabase URL or key.  In this mode we serve mock data so the build
 * never contacts Supabase (useful for Vercel previews & storybook).
 */
export const isPreviewMode = () =>
  !process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_VERCEL_ENV === "preview"

/* -------------------------------------------------------------------------- */
/*                                    MOCK                                    */
/* -------------------------------------------------------------------------- */

/**
 * A **very** small mock client – only the methods currently used at
 * build-time: `.from().select()` and `.from().insert()`.
 * Extend as needed; it purposefully returns empty data so UI can still render.
 */
export function createMockServerClient(): SupabaseClient<Database> {
  // @ts-expect-error – we are faking the minimal API surface
  return {
    from: () => ({
      select: () => Promise.resolve({ data: [], error: null }),
      insert: () => Promise.resolve({ data: [], error: null }),
      upsert: () => Promise.resolve({ data: [], error: null }),
      update: () => Promise.resolve({ data: [], error: null }),
      delete: () => Promise.resolve({ data: [], error: null }),
      eq: function() { return this },
      single: () => Promise.resolve({ data: null, error: null }),
      order: function() { return this },
      limit: function() { return this },
      range: function() { return this },
    }),
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
    },
    rpc: () => Promise.resolve({ data: null, error: null }),
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ data: null, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: "" } }),
      }),
    },
  }
}

/* -------------------------------------------------------------------------- */
/*                             REAL SUPABASE CLIENTS                          */
/* -------------------------------------------------------------------------- */

/**
 * Standard server-side client built with the ANON key.
 * No `req/res` objects are required, so it is safe during Next.js prerender.
 */
export function createServerSupabaseClient(): SupabaseClient<Database> {
  if (isPreviewMode()) return createMockServerClient()

  const supabaseUrl = process.env.SUPABASE_URL as string
  const supabaseKey = process.env.SUPABASE_ANON_KEY as string

  return createSupabaseClient<Database>(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  })
}

/**
 * Server-side client that can access cookies for auth state
 */
export function createServerSupabaseClientWithAuth(): SupabaseClient<Database> {
  if (isPreviewMode()) return createMockServerClient()

  const cookieStore = cookies()
  const supabaseUrl = process.env.SUPABASE_URL as string
  const supabaseKey = process.env.SUPABASE_ANON_KEY as string

  return createSupabaseClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
    },
    global: {
      headers: {
        Cookie: cookieStore.toString(),
      },
    },
  })
}

/**
 * Elevated-privilege client that uses the SERVICE_ROLE key.
 * NEVER expose this to the browser!
 */
export function createAdminSupabaseClient(): SupabaseClient<Database> {
  if (isPreviewMode()) return createMockServerClient()

  const supabaseUrl = process.env.SUPABASE_URL as string
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string

  return createSupabaseClient<Database>(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  })
}

/* -------------------------------------------------------------------------- */
/*                         BACKWARDS-COMPATIBILITY EXPORTS                    */
/* -------------------------------------------------------------------------- */

/**
 * Some modules import `createClient` instead of `createServerSupabaseClient`.
 * Exporting an alias keeps them working without edits.
 */
export const createClient = createServerSupabaseClient

/**
 * Older code imported `getServerClient`.  Provide the same implementation.
 */
export const getServerClient = createServerSupabaseClient
