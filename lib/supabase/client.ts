import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/types/database"

// Check if Supabase environment variables are available
export const isSupabaseConfigured =
  typeof process.env.NEXT_PUBLIC_SUPABASE_URL === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_URL.length > 0 &&
  typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length > 0

let clientInstance: ReturnType<typeof createBrowserClient<Database>> | undefined

export function createClient() {
  // Return existing client if it exists (singleton pattern)
  if (clientInstance) {
    return clientInstance
  }

  // Check if Supabase is configured
  if (!isSupabaseConfigured) {
    throw new Error("Supabase environment variables are not configured. Please check your environment variables.")
  }

  try {
    clientInstance = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )

    return clientInstance
  } catch (error) {
    console.error("Failed to create Supabase client:", error)
    throw new Error("Failed to initialize Supabase client")
  }
}

export const supabase = createClient()
