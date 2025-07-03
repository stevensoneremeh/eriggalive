import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

// For client components
export function createClientSupabase() {
  return createClientComponentClient<Database>()
}

// For server components and API routes
export function createServerSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// Default export for backward compatibility
export default function createSupabaseClient() {
  return createClientComponentClient<Database>()
}

// Alias for compatibility with older imports
//      import { createClientSupabase } from "@/lib/supabase/client"
export const createClientSupabaseAlias = createClientSupabase
