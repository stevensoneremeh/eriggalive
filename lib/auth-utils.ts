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
      console.error("Error fetching user profile:", profileError)
      return { user, profile: null, error: profileError.message }
    }

    return { user, profile, error: null }
  } catch (error) {
    console.error("Error in getCurrentUser:", error)
    return {
      user: null,
      profile: null,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

export async function requireAuth(): Promise<{
  user: any
  profile: UserProfile
}> {
  const { user, profile, error } = await getCurrentUser()

  if (error) {
    throw new Error(`Authentication error: ${error}`)
  }

  if (!user || !profile) {
    throw new Error("Authentication required")
  }

  return { user, profile }
}

export async function requireAdmin(): Promise<{
  user: any
  profile: UserProfile
}> {
  const { user, profile } = await requireAuth()

  if (profile.role !== "admin") {
    throw new Error("Admin access required")
  }

  return { user, profile }
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function isValidUsername(username: string): boolean {
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
  return usernameRegex.test(username)
}

export function generateSecurePassword(length = 12): string {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
  let password = ""
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length))
  }
  return password
}

export function sanitizeUserInput(input: string): string {
  return input.trim().replace(/[<>]/g, "")
}

export function hashUserId(userId: string): string {
  // Simple hash for user ID obfuscation (not cryptographically secure)
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36)
}
