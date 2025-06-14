import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Create a single supabase client for interacting with your database
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

// Export default for backward compatibility
export default supabase

// Helper function to get authenticated user
export const getCurrentUser = async () => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error) {
    console.error("Error getting current user:", error)
    return null
  }
  return user
}

// Helper function to get session
export const getCurrentSession = async () => {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()
  if (error) {
    console.error("Error getting current session:", error)
    return null
  }
  return session
}

// Helper function for authenticated requests
export const getAuthenticatedSupabase = () => {
  return supabase
}
