import { auth } from "@clerk/nextjs/server"
import { createClient } from "@/lib/supabase/client"
import type { Database } from "@/types/database"

type UserProfile = Database["public"]["Tables"]["users"]["Row"]

export async function getCurrentUser(): Promise<{ user: any; profile: UserProfile | null }> {
  const { userId } = auth()

  if (!userId) {
    return { user: null, profile: null }
  }

  const supabase = createClient()

  try {
    const { data: profile, error } = await supabase.from("users").select("*").eq("auth_user_id", userId).single()

    if (error) {
      console.error("Error fetching user profile:", error)
      return { user: { id: userId }, profile: null }
    }

    return { user: { id: userId }, profile }
  } catch (error) {
    console.error("Error in getCurrentUser:", error)
    return { user: { id: userId }, profile: null }
  }
}

export async function requireAuth() {
  const { userId } = auth()

  if (!userId) {
    throw new Error("Unauthorized")
  }

  return userId
}
