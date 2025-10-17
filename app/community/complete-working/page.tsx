import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { CompleteWorkingCommunityClient } from "./complete-working-client"

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
  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (profileError) {
    console.error("Profile error:", profileError)
    // Profile might not exist yet, let the client handle it
    return { user, profile: null }
  }

  return { user, profile: { ...profile, email: user.email } }
}

async function getCommunityData() {
  const supabase = await createClient()

  // Get categories
  const { data: categories } = await supabase
    .from("community_categories")
    .select("*")
    .eq("is_active", true)
    .order("display_order")

  // Get initial posts with user data
  const { data: posts } = await supabase
    .from("community_posts")
    .select(`
      *,
      user_profiles!inner (
        id, username, full_name, avatar_url, tier, coins, reputation_score
      ),
      community_categories!inner (
        id, name, slug, icon, color
      ),
      post_votes (
        user_id
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

export default async function CompleteWorkingCommunityPage() {
  const { user, profile } = await getCurrentUser()
  const { categories, posts } = await getCommunityData()

  return <CompleteWorkingCommunityClient user={user} profile={profile} initialPosts={posts} categories={categories} />
}
