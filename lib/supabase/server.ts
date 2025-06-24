"use server"

import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr" // or whichever helper you were using
import type { Database } from "@/types/database"

/**
 * Server-side Supabase client.
 * Must be an async export in a `"use server"` file
 * to satisfy Next.js 13+ build rules.
 */
export async function createClient() {
  // Although this is a synchronous call, marking it async
  // satisfies the compiler requirement that ALL exports be async.
  return createServerClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    cookies,
  })
}
