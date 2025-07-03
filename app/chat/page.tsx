import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export default async function ChatPage() {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login?redirect=/chat")
  }

  const { data: profile } = await supabase.from("users").select("*").eq("auth_user_id", user.id).single()

  if (!profile) {
    redirect("/login?redirect=/chat")
  }

  // Redirect to user's tier chat by default
  const userTier = profile.tier?.toLowerCase() || "grassroot"
  redirect(`/chat/${userTier}`)
}
