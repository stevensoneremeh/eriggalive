import { Suspense } from "react"
import { CommunityFeed } from "@/components/community/community-feed"
import { CommunityHeader } from "@/components/community/community-header"
import { CommunityStats } from "@/components/community/community-stats"
import { Navigation } from "@/components/navigation"
import supabase from "@/lib/supabase/client"

export default async function CommunityPage() {
  // const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()
  let profile = null

  if (user) {
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single()
    profile = data
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Navigation user={profile} />

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            <CommunityHeader />
            <Suspense fallback={<div className="animate-pulse bg-muted h-96 rounded-lg" />}>
              <CommunityFeed />
            </Suspense>
          </div>

          <div className="lg:col-span-1">
            <Suspense fallback={<div className="animate-pulse bg-muted h-48 rounded-lg" />}>
              <CommunityStats />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  )
}
