"use server"

import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

/**
 * Ensures the user is authenticated. Redirects to sign-in if not.
 */
export async function requireAuth() {
  const supabase = createServerClient()

  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error) {
      console.error("Error getting session:", error)
    }

    if (!session) {
      redirect("/login")
    }

    return session
  } catch (error) {
    console.error("Auth check failed:", error)
    redirect("/login")
  }
}

/**
 * Returns the authenticated user along with their profile.
 * Creates a default profile if one doesn't exist.
 */
export async function getAuthenticatedUser() {
  const supabase = createServerClient()

  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      console.error("Error getting session:", sessionError)
      return null
    }

    if (!session) {
      return null
    }

    // Try to fetch the user's profile
    let { data: profile, error: profileError } = await supabase
      .from("users")
      .select("*")
      .eq("auth_user_id", session.user.id)
      .single()

    // If no profile exists, create one
    if (profileError && profileError.code === "PGRST116") {
      const newProfile = {
        auth_user_id: session.user.id,
        email: session.user.email!,
        username: session.user.user_metadata?.username || session.user.email?.split("@")[0] || "user",
        full_name: session.user.user_metadata?.full_name || null,
        phone: null,
        avatar_url: null,
        tier: "grassroot" as const,
        role: "user" as const,
        coins_balance: 500,
        referral_code: null,
      }

      const { data: createdProfile, error: insertError } = await supabase
        .from("users")
        .insert(newProfile)
        .select()
        .single()

      if (insertError) {
        console.error("Error creating profile:", insertError)
        // Return session with null profile rather than failing
        return {
          session,
          user: session.user,
          profile: null,
        }
      }

      profile = createdProfile
    } else if (profileError) {
      console.error("Error fetching profile:", profileError)
      // Return session with null profile rather than failing
      return {
        session,
        user: session.user,
        profile: null,
      }
    }

    return {
      session,
      user: session.user,
      profile,
    }
  } catch (error) {
    console.error("Unexpected error in getAuthenticatedUser:", error)
    return null
  }
}
