/**
 * Authentication utilities
 */
import { createServerSupabaseClient } from "@/lib/supabase/server"
import type { Database } from "@/types/database"

type UserProfile = Database["public"]["Tables"]["users"]["Row"]

export async function getCurrentUser(): Promise<{
  user: any | null
  profile: UserProfile | null
  error: string | null
}> {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      return { user: null, profile: null, error: authError.message }
    }

    if (!user) {
      return { user: null, profile: null, error: null }
    }

    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("*")
      .eq("auth_user_id", user.id)
      .maybeSingle()

    if (profileError) {
      return { user, profile: null, error: profileError.message }
    }

    return { user, profile, error: null }
  } catch (error) {
    return {
      user: null,
      profile: null,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

export async function requireAuth() {
  const { user, profile, error } = await getCurrentUser()

  if (error) throw new Error(`Authentication error: ${error}`)
  if (!user || !profile) throw new Error("Authentication required")

  return { user, profile }
}

export async function requireAdmin() {
  const { user, profile } = await requireAuth()

  if (profile.role !== "admin" && profile.tier !== "admin") {
    throw new Error("Admin access required")
  }

  return { user, profile }
}

export const clientAuth = {
  // Re-export for compatibility
}
