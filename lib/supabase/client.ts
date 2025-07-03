import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js"

/**
 * Browser-side singleton Supabase client.
 * Use `import { createClient } from '@/lib/supabase/client'`
 * everywhere in the app.
 */
let supabase: SupabaseClient | null = null

export function createClient() {
  if (supabase) return supabase

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anon) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY")
  }

  supabase = createSupabaseClient(url, anon)
  return supabase
}
