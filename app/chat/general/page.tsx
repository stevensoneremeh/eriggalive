import { GeneralChat } from "@/components/chat/general-chat"
import { ChatSidebar } from "@/components/chat/chat-sidebar"
import { Navigation } from "@/components/navigation"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function GeneralChatPage() {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Navigation user={profile} />

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <ChatSidebar userTier={profile.subscription_tier || "Grassroot"} />
          </div>

          <div className="lg:col-span-3">
            <div className="bg-background/50 border border-muted rounded-lg h-[600px]">
              <GeneralChat username={profile.username} userTier={profile.subscription_tier || "Grassroot"} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
