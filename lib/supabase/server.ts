import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs"

/**
 * A thin alias so the rest of the codebase can keep importing
 * `createClient` from "@/lib/supabase/server".
 */
export const createClient = createServerSupabaseClient
