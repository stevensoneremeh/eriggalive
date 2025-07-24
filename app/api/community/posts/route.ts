import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      console.error("Auth error:", userError)
    }

    // Fetch posts with proper joins
    const { data: posts, error: postsError } = await supabase
      .from("community_posts")
      .select(`
        *,
        users!community_posts_user_id_fkey (
          id,
          username,
          full_name,
          avatar_url,
          subscription_tier
        ),
        community_categories!community_posts_category_id_fkey (
          id,
          name,
          slug,
          icon,
          color
        )
      `)
      .order("created_at", { ascending: false })

    if (postsError) {
      console.error("Posts error:", postsError)
      return NextResponse.json({ error: "Failed to fetch posts", details: postsError.message }, { status: 500 })
    }

    // Transform the data to match expected format
    const transformedPosts = (posts || []).map((post) => ({
      ...post,
      user: post.users
        ? {
            id: post.users.id,
            username: post.users.username,
            full_name: post.users.full_name,
            avatar_url: post.users.avatar_url,
            tier: post.users.subscription_tier,
          }
        : null,
      category: post.community_categories
        ? {
            id: post.community_categories.id,
            name: post.community_categories.name,
            slug: post.community_categories.slug,
            icon: post.community_categories.icon,
            color: post.community_categories.color,
          }
        : null,
      has_voted: false, // TODO: Check if current user has voted
      hashtags: post.hashtags || [],
    }))

    return NextResponse.json({ posts: transformedPosts })
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { content, categoryId, type = "post" } = await request.json()

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("id")
      .eq("auth_user_id", user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    // Create the post
    const { data: post, error: postError } = await supabase
      .from("community_posts")
      .insert({
        content,
        category_id: categoryId,
        user_id: profile.id,
        type,
        hashtags: [],
        vote_count: 0,
        comment_count: 0,
        view_count: 0,
      })
      .select()
      .single()

    if (postError) {
      console.error("Post creation error:", postError)
      return NextResponse.json({ error: "Failed to create post" }, { status: 500 })
    }

    return NextResponse.json({ success: true, post })
  } catch (error) {
    console.error("Error creating post:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
