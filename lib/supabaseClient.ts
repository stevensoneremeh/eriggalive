import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Create the Supabase client
function createSupabaseClient() {
  // Check if we have the required environment variables
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("❌ Missing Supabase environment variables:")
    console.error("- NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl ? "✅ Set" : "❌ Missing")
    console.error("- NEXT_PUBLIC_SUPABASE_ANON_KEY:", supabaseAnonKey ? "✅ Set" : "❌ Missing")

    // Throw an error to make it clear what's wrong
    throw new Error(
      "Supabase environment variables are not configured. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your environment variables.",
    )
  }

  // Create and return the real Supabase client
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  })
}

// Export the client
export const supabase = createSupabaseClient()
export default supabase
