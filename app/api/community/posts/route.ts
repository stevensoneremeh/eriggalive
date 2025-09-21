import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    let query = supabase
      .from("community_posts")
      .select(
        `
        *,
        users!community_posts_user_id_fkey (
          id,
          username,
          full_name,
          avatar_url,
          tier
        ),
        community_categories!community_posts_category_id_fkey (
          id,
          name,
          slug,
          icon,
          color
        )
      `,
      )
      .eq("is_published", true)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (category && category !== "all") {
      query = query.eq("category_id", category)
    }

    const { data: posts, error } = await query

    if (error) {
      console.error("Error fetching posts:", error)
      return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 })
    }

    // Get vote status for authenticated users
    if (user && posts) {
      const postIds = posts.map((post) => post.id)
      const { data: userVotes } = await supabase
        .from("community_post_votes")
        .select("post_id")
        .in("post_id", postIds)
        .eq("user_id", user.id)

      const votedPostIds = new Set(userVotes?.map((vote) => vote.post_id) || [])

      posts.forEach((post) => {
        post.has_voted = votedPostIds.has(post.id)
      })
    }

    return NextResponse.json({ posts })
  } catch (error) {
    console.error("Error in GET /api/community/posts:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user profile
    const { data: profile } = await supabase.from("users").select("id").eq("auth_user_id", user.id).single()

    if (!profile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    const body = await request.json()
    const { title, content, category_id, media_url, media_type, hashtags } = body

    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    const { data: post, error } = await supabase
      .from("community_posts")
      .insert({
        user_id: profile.id,
        title: title || null,
        content,
        category_id: category_id || null,
        media_url: media_url || null,
        media_type: media_type || null,
        hashtags: hashtags || [],
      })
      .select(
        `
        *,
        users!community_posts_user_id_fkey (
          id,
          username,
          full_name,
          avatar_url,
          tier
        ),
        community_categories!community_posts_category_id_fkey (
          id,
          name,
          slug,
          icon,
          color
        )
      `,
      )
      .single()

    if (error) {
      console.error("Error creating post:", error)
      return NextResponse.json({ error: "Failed to create post" }, { status: 500 })
    }

    return NextResponse.json({ post })
  } catch (error) {
    console.error("Error in POST /api/community/posts:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
