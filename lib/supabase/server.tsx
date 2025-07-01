import { createClient as createSupabaseClient } from "@supabase/supabase-js"

import type { Database } from "@/types/supabase"

export function createServerSupabaseClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    { auth: { persistSession: false } },
  )
}
