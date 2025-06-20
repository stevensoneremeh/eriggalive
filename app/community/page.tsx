import { createServerSupabaseClient } from "@/lib/supabase/server"
import { CommunityPageClient } from "./community-page-client"
import { getDummyPosts } from "@/lib/community-actions"

async function getCurrentUser() {
  const supabase = createServerSupabaseClient()

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { user: null, profile: null }
    }

    // Get or create user profile
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("*")
      .eq("auth_user_id", user.id)
      .single()

    if (profileError && profileError.code !== "PGRST116") {
      // Try to create profile if it doesn't exist
      const { data: newProfile, error: createError } = await supabase
        .from("users")
        .insert({
          auth_user_id: user.id,
          username: user.user_metadata?.username || user.email?.split('@')[0] || 'user',
          full_name: user.user_metadata?.full_name || user.email || '',
          email: user.email || '',
          avatar_url: user.user_metadata?.avatar_url,
        })
        .select()
        .single()

      if (createError) {
        console.error("Failed to create user profile:", createError)
        return { user, profile: null }
      }

      return { user, profile: newProfile }
    }

    return { user, profile }
  } catch (error) {
    console.error("Error getting current user:", error)
    return { user: null, profile: null }
  }
}

async function getCommunityData() {
  const supabase = createServerSupabaseClient()

  try {
    // Get categories
    const { data: categories, error: categoriesError } = await supabase
      .from("community_categories")
      .select("*")
      .order("id")

    if (categoriesError) {
      console.error("Error fetching categories:", categoriesError)
    }

    // Get posts with user data and vote status
    const { data: posts, error: postsError } = await supabase
      .from("community_posts")
      .select(`
        *,
        user:users!community_posts_user_id_fkey(id, auth_user_id, username, full_name, avatar_url, tier),
        category:community_categories!community_posts_category_id_fkey(id, name, slug),
        votes:community_post_votes(user_id)
      `)
      .eq("is_published", true)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .limit(20)

    if (postsError) {
      console.error("Error fetching posts:", postsError)
    }

    // Fallback to dummy data if no posts exist
    const finalPosts = posts && posts.length > 0 ? posts : await getDummyPosts()

    // Fallback categories if none exist
    const finalCategories = categories && categories.length > 0 ? categories : [
      { id: 1, name: "General", slug: "general", description: "General discussions" },
      { id: 2, name: "Bars", slug: "bars", description: "Share your bars and lyrics" },
      { id: 3, name: "Stories", slug: "stories", description: "Tell your stories" },
      { id: 4, name: "Events", slug: "events", description: "Event discussions" },
    ]

    return {
      categories: finalCategories,
      posts: finalPosts,
    }
  } catch (error) {
    console.error("Error in getCommunityData:", error)
    return {
      categories: [
        { id: 1, name: "General", slug: "general", description: "General discussions" },
        { id: 2, name: "Bars", slug: "bars", description: "Share your bars and lyrics" },
        { id: 3, name: "Stories", slug: "stories", description: "Tell your stories" },
        { id: 4, name: "Events", slug: "events", description: "Event discussions" },
      ],
      posts: await getDummyPosts(),
    }
  }
}

export default async function CommunityPage() {
  const { user, profile } = await getCurrentUser()
  const { categories, posts } = await getCommunityData()

  return (
    <CommunityPageClient 
      user={user} 
      profile={profile} 
      initialPosts={posts} 
      categories={categories} 
    />
  )
}