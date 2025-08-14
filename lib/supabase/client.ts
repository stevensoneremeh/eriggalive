import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/types/database"

// Check if we're in a browser environment
const isBrowser = typeof window !== "undefined"

// Singleton client instance
let client: ReturnType<typeof createBrowserClient<Database>> | undefined

export function createClient() {
  // Return existing client if it exists
  if (client) {
    return client
  }

  // Validate environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables. Please check your .env.local file.")
  }

  try {
    client = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      global: {
        headers: {
          "X-Client-Info": "eriggalive-web",
        },
      },
    })

    return client
  } catch (error) {
    console.error("Failed to create Supabase client:", error)
    throw error
  }
}

// Export singleton getter
export function getSupabaseClient() {
  return createClient()
}
