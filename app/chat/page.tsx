import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export default async function ChatPage() {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile) {
    redirect("/auth/login")
  }

  // Redirect to user's tier chat by default
  const userTier = profile.subscription_tier?.toLowerCase() || "grassroot"
  redirect(`/chat/${userTier}`)
}
