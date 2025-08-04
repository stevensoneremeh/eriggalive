import { createClient } from "@/lib/supabase/client"

// Export the client for use throughout the app
export const supabase = createClient()

// Helper function to check if Supabase is configured
export const isSupabaseConfigured = () => {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

// Helper function to get user profile
export const getUserProfile = async (authUserId: string) => {
  if (!isSupabaseConfigured()) {
    return { data: null, error: { message: "Supabase not configured" } }
  }

  try {
    const { data, error } = await supabase.from("users").select("*").eq("auth_user_id", authUserId).single()

    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

// Helper function to create user profile
export const createUserProfile = async (userData: any) => {
  if (!isSupabaseConfigured()) {
    return { data: null, error: { message: "Supabase not configured" } }
  }

  try {
    const { data, error } = await supabase.from("users").insert(userData).select().single()

    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}
