import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export async function requireAuth() {
  const supabase = await createClient()

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      redirect("/login")
    }

    return user
  } catch (error) {
    console.error("Auth guard error:", error)
    redirect("/login")
  }
}

export async function getServerUser() {
  const supabase = await createClient()

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      console.error("Error getting server user:", error)
      return null
    }

    return user
  } catch (error) {
    console.error("Server user error:", error)
    return null
  }
}

export async function getServerProfile(userId: string) {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase.from("users").select("*").eq("auth_user_id", userId).single()

    if (error) {
      console.error("Error getting server profile:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Server profile error:", error)
    return null
  }
}
