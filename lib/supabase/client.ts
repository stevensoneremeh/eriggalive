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
  // `createClientComponentClient` automatically reads
  // NEXT_PUBLIC_SUPABASE_URL & NEXT_PUBLIC_SUPABASE_ANON_KEY.
  _client = createClientComponentClient<Database>()
  return _client
}

export const createClient = initClient
export const createClientSupabase = initClient // legacy alias
export default initClient
