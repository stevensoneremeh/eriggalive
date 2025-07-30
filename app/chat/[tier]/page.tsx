import { TierChat } from "@/components/tier-chat"
import { ChatSidebar } from "@/components/chat/chat-sidebar"
import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"

interface TierChatPageProps {
  params: {
    tier: string
  }
}

const validTiers = ["grassroot", "pioneer", "elder", "blood"]

export default async function TierChatPage({ params }: TierChatPageProps) {
  const supabase = await createClient()

  if (!validTiers.includes(params.tier.toLowerCase())) {
    notFound()
  }

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile) {
    redirect("/login")
  }

  // Check if user has access to this tier
  const userTier = profile.subscription_tier?.toLowerCase() || "grassroot"
  if (userTier !== params.tier.toLowerCase()) {
    redirect(`/chat/${userTier}`)
  }

  const tierName = params.tier.charAt(0).toUpperCase() + params.tier.slice(1)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <ChatSidebar userTier={profile.subscription_tier || "Grassroot"} />
          </div>

          <div className="lg:col-span-3">
            <div className="bg-background/50 border border-muted rounded-lg h-[600px]">
              <TierChat userTier={tierName} username={profile.username} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
