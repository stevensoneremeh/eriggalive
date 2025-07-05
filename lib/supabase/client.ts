import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

/**
 * Browser-side Supabase client (singleton).
 *
 * Exposes three identical entry-points so **all existing code keeps working**:
 *   1.  import { createClient } from "@/lib/supabase/client"
 *   2.  import { createClientSupabase } from "@/lib/supabase/client"
 *   3.  import createClientSupabase from "@/lib/supabase/client"
 */
let _client: SupabaseClient<Database> | null = null

function initClient() {
  if (_client) return _client

  // Read the public env vars injected at build-time.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Pass them explicitly (they’re required on the client).
  if (supabaseUrl && supabaseKey) {
    _client = createClientComponentClient<Database>({
      supabaseUrl,
      supabaseKey,
    })
  } else {
    // Fall back to the default behaviour and warn the developer.
    console.warn(
      "Supabase env vars missing – falling back to createClientComponentClient() without explicit keys. " +
        "Double-check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    )
    _client = createClientComponentClient<Database>()
  }

  return _client
}

export const createClient = initClient
export const createClientSupabase = initClient // legacy alias
export default initClient
