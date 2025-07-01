import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Create a singleton client for browser usage
let client: ReturnType<typeof createClient<Database>> | null = null

export function createBrowserClient() {
  if (!client) {
    client = createClient<Database>(supabaseUrl, supabaseAnonKey)
  }
  return client
}
