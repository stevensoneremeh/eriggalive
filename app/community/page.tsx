import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { CommunityFeed } from "@/components/community/community-feed"

export default async function CommunityPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Community</h1>
          <p className="text-gray-600">Connect with fellow Erigga fans</p>
        </div>
        <CommunityFeed />
      </div>
    </div>
  )
}
