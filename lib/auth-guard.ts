import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import type { Database } from "@/types/database"

type Profile = Database["public"]["Tables"]["users"]["Row"]

export async function requireAuth() {
  const supabase = createServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/auth/signin")
  }

  return session
}

export async function getAuthenticatedUser() {
  const supabase = createServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return null
  }

  // Fetch user profile
  let { data: profile, error } = await supabase.from("users").select("*").eq("auth_user_id", session.user.id).single()

  // Create profile if it doesn't exist
  if (error && error.code === "PGRST116") {
    const newProfile = {
      auth_user_id: session.user.id,
      email: session.user.email!,
      username: session.user.user_metadata?.username || session.user.email?.split("@")[0] || "user",
      full_name: session.user.user_metadata?.full_name || null,
      tier: "grassroot" as const,
      role: "user" as const,
      coins: 500,
      level: 1,
      points: 0,
      is_verified: false,
      is_active: true,
      is_banned: false,
      login_count: 1,
      email_verified: !!session.user.email_confirmed_at,
      phone_verified: false,
      two_factor_enabled: false,
      preferences: {},
      metadata: {},
    }

    const { data: createdProfile } = await supabase.from("users").insert(newProfile).select().single()

    profile = createdProfile
  }

  return {
    session,
    user: session.user,
    profile,
  }
}
