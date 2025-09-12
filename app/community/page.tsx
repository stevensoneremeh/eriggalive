import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { CompleteWorkingCommunityClient } from "./complete-working/complete-working-client"

async function getCurrentUser() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect("/login")
  }

  // Get user profile - try both table structures for compatibility
  let profile = null
  try {
    // First try user_profiles table
    const { data: userProfile, error: profileError } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    if (userProfile && typeof userProfile === 'object') {
      profile = { ...userProfile, email: user.email }
    } else {
      // Fallback to users table
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("auth_user_id", user.id)
        .single()
      
      if (userData && typeof userData === 'object') {
        profile = { ...userData, email: user.email }
      }
    }
  } catch (error) {
    // Profile might not exist yet, let the client handle it
    console.log("Profile fetch error:", error)
  }

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

  // Get initial posts with user data - try both table structures
  let posts: any[] = []
  try {
    // First try with user_profiles
    const { data: userProfilePosts } = await supabase
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

    if (userProfilePosts && userProfilePosts.length > 0) {
      posts = userProfilePosts
    } else {
      // Fallback to users table
      const { data: userPosts } = await supabase
        .from("community_posts")
        .select(`
          *,
          users!inner (
            id, username, full_name, avatar_url, tier, reputation_score
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
      
      posts = userPosts || []
    }
  } catch (error) {
    console.log("Posts fetch error:", error)
  }

  return {
    categories: categories || [],
    posts: posts || [],
  }
}

export default async function CommunityPage() {
  const { user, profile } = await getCurrentUser()
  const { categories, posts } = await getCommunityData()

  return <CompleteWorkingCommunityClient user={user} profile={profile} initialPosts={posts} categories={categories} />
}