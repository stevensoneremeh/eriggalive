import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/types/database"

// Create a singleton instance
let supabaseClient: ReturnType<typeof createBrowserClient<Database>> | null = null

// Check if we're in a browser environment
const isBrowser = typeof window !== "undefined"

export function createClient() {
  // Return existing client if already created (singleton pattern)
  if (supabaseClient) return supabaseClient

  try {
    // Get environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // Check if environment variables are defined
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Missing Supabase environment variables")
      throw new Error("Missing Supabase environment variables")
    }

    // Create client
    supabaseClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      global: {
        headers: {
          "x-application-name": "eriggalive",
        },
      },
    })
    return supabaseClient
  } catch (error) {
    console.error("Error creating Supabase client:", error)
    throw new Error("Failed to initialize Supabase client")
  }
}

// Export a default client for convenience
export default createClient()
