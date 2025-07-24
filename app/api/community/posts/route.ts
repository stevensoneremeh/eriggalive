import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Fetch posts with user and category information using proper joins
    const { data: posts, error } = await supabase
      .from("community_posts")
      .select(`
        id,
        content,
        type,
        media_url,
        media_type,
        hashtags,
        vote_count,
        comment_count,
        view_count,
        created_at,
        updated_at,
        user:users!community_posts_user_id_fkey (
          id,
          username,
          full_name,
          avatar_url,
          tier
        ),
        category:community_categories!community_posts_category_id_fkey (
          id,
          name,
          slug,
          icon,
          color
        )
      `)
      .eq("is_published", true)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 })
    }

    // Check if user has voted on each post
    let postsWithVotes = posts || []

    if (user && posts && posts.length > 0) {
      // Get user profile to get the internal user ID
      const { data: userProfile } = await supabase.from("users").select("id").eq("auth_user_id", user.id).single()

      if (userProfile) {
        const postIds = posts.map((post) => post.id)

        const { data: votes } = await supabase
          .from("community_post_votes")
          .select("post_id")
          .eq("user_id", userProfile.id)
          .in("post_id", postIds)

        const votedPostIds = new Set(votes?.map((vote) => vote.post_id) || [])

        postsWithVotes = posts.map((post) => ({
          ...post,
          has_voted: votedPostIds.has(post.id),
          hashtags: Array.isArray(post.hashtags) ? post.hashtags : [],
        }))
      }
    } else {
      postsWithVotes =
        posts?.map((post) => ({
          ...post,
          has_voted: false,
          hashtags: Array.isArray(post.hashtags) ? post.hashtags : [],
        })) || []
    }

    return NextResponse.json({
      success: true,
      posts: postsWithVotes,
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Get user profile
    const { data: profile } = await supabase.from("users").select("id").eq("auth_user_id", user.id).single()

    if (!profile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    const body = await request.json()
    const { content, categoryId, type = "post" } = body

    if (!content || !categoryId) {
      return NextResponse.json({ error: "Content and category are required" }, { status: 400 })
    }

    // Create the post
    const { data: post, error } = await supabase
      .from("community_posts")
      .insert({
        user_id: profile.id,
        category_id: categoryId,
        content: content.trim(),
        type,
        hashtags: [],
        is_published: true,
        is_deleted: false,
      })
      .select(`
        id,
        content,
        type,
        media_url,
        media_type,
        hashtags,
        vote_count,
        comment_count,
        view_count,
        created_at,
        updated_at,
        user:users!community_posts_user_id_fkey (
          id,
          username,
          full_name,
          avatar_url,
          tier
        ),
        category:community_categories!community_posts_category_id_fkey (
          id,
          name,
          slug,
          icon,
          color
        )
      `)
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to create post" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      post: {
        ...post,
        hashtags: Array.isArray(post.hashtags) ? post.hashtags : [],
      },
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
