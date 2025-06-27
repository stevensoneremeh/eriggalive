"use server"

import { cookies } from "next/headers"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

/**
 * Returns a Supabase client that forwards the
 * user's cookies (auth session) on each request.
 */
export async function createServerSupabaseClient() {
  const cookieStore = cookies()

  // ❶ `async` is required only to satisfy the “use server” rule;
  //    we return synchronously.
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: {
      headers: {
        // Forward cookies (if any) to Supabase auth middleware
        Cookie: cookieStore
          .getAll()
          .map((c) => `${c.name}=${c.value}`)
          .join("; "),
      },
    },
  })
}

/**
 * Service-role client — **never** expose this on the client side.
 */
export async function createAdminSupabaseClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    // Service-role key is required for elevated privileges
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

/** Returns a cookie-forwarding Supabase client (alias for createServerSupabaseClient). */
export async function createClient() {
  return createServerSupabaseClient()
}
