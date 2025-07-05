import { cookies } from "next/headers"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { createClient as createBrowserlessClient } from "@supabase/supabase-js"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

/* ------------------------------------------------------------------
   🌐  ONE-TIME (singleton) SERVER COMPONENT / ACTION CLIENT
   ------------------------------------------------------------------ */
let _serverClient: SupabaseClient<Database> | null = null

function initServerClient(): SupabaseClient<Database> {
  if (_serverClient) return _serverClient

  // The helper automatically reads NEXT_PUBLIC_SUPABASE_URL + ANON KEY
  const cookieStore = cookies()
  _serverClient = createServerComponentClient<Database>({ cookies: () => cookieStore })

  return _serverClient
}

/* ------------------------------------------------------------------
   🛠️  ADMIN-LEVEL CLIENT  (uses SERVICE_ROLE_KEY)
   ------------------------------------------------------------------ */
export function createAdminSupabaseClient(): SupabaseClient<Database> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL // fallback for older env var names
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error("Missing SUPABASE env vars — add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY")
  }

  return createBrowserlessClient<Database>(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

/* ------------------------------------------------------------------
   ✨  PUBLIC EXPORTS  ── aliases to keep every historic import working
   ------------------------------------------------------------------ */
export const createClient = initServerClient // many files `import { createClient }`
export const createServerClient = initServerClient // alternative name
export const createServerSupabaseClient = initServerClient // legacy name
export const createClientSupabase = initServerClient // another legacy name

export default initServerClient
