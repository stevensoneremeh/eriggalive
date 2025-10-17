import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { RealtimeCommunityClient } from "./realtime-community-client"

async function getCurrentUser() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect("/login")
  }

  // Get user profile
  const { data: profile } = await supabase.from("users").select("*").eq("auth_user_id", user.id).single()

  return { user, profile }
}

async function getCommunityData() {
  const supabase = await createClient()

  // Get categories
  const { data: categories } = await supabase
    .from("community_categories")
    .select("*")
    .eq("is_active", true)
    .order("display_order")

  // Get initial posts with user data and vote status
  const { data: posts } = await supabase
    .from("community_posts")
    .select(`
      *,
      users!inner (
        id, username, full_name, email, avatar_url, tier, reputation_score
      ),
      community_categories!inner (
        id, name, slug, color, icon
      )
    `)
    .eq("is_published", true)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false })
    .limit(20)

  return {
    categories: categories || [],
    posts: posts || [],
  }
}

export default async function RealtimeCommunityPage() {
  const { user, profile } = await getCurrentUser()
  const { categories, posts } = await getCommunityData()

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Setting up your profile...</h1>
          <p className="text-gray-600">Please wait while we create your community profile.</p>
        </div>
      </div>
    )
  }

  return <RealtimeCommunityClient user={user} profile={profile} initialPosts={posts} categories={categories} />
}
