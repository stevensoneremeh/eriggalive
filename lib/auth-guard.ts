import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

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
  const { data: profile } = await supabase.from("users").select("*").eq("auth_user_id", session.user.id).single()

  return {
    session,
    user: session.user,
    profile,
  }
}
