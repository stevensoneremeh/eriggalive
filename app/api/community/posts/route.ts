import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    // Get current user for bookmark status
    const {
      data: { user },
    } = await supabase.auth.getUser()
    let currentUserId: number | null = null

    if (user) {
      const { data: userData } = await supabase.from("users").select("id").eq("auth_user_id", user.id).single()

      currentUserId = userData?.id || null
    }

    // Build query
    let query = supabase
      .from("community_posts")
      .select(`
        id,
        content,
        media_url,
        media_type,
        hashtags,
        vote_count,
        comment_count,
        view_count,
        is_pinned,
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
      .range(offset, offset + limit - 1)

    if (category && category !== "all") {
      query = query.eq("category.slug", category)
    }

    const { data: posts, error } = await query

    if (error) {
      console.error("Error fetching posts:", error)
      return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 })
    }

    // Get bookmark status for current user if logged in
    let postsWithBookmarks = posts || []

    if (currentUserId && posts && posts.length > 0) {
      const postIds = posts.map((post) => post.id)

      const { data: bookmarks } = await supabase
        .from("user_bookmarks")
        .select("post_id")
        .eq("user_id", currentUserId)
        .in("post_id", postIds)

      const bookmarkedPostIds = new Set(bookmarks?.map((b) => b.post_id) || [])

      postsWithBookmarks = posts.map((post) => ({
        ...post,
        is_bookmarked: bookmarkedPostIds.has(post.id),
        has_voted: false, // Will be implemented when we add voting
      }))
    }

    return NextResponse.json({ posts: postsWithBookmarks })
  } catch (error) {
    console.error("Posts API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { content, category_id, media_url, media_type } = body

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's internal ID
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("auth_user_id", user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Extract hashtags from content
    const hashtagRegex = /#[\w]+/g
    const hashtags = content.match(hashtagRegex) || []

    // Create post
    const { data: post, error: insertError } = await supabase
      .from("community_posts")
      .insert({
        user_id: userData.id,
        category_id: category_id || null,
        content: content.trim(),
        media_url,
        media_type,
        hashtags,
      })
      .select(`
        id,
        content,
        media_url,
        media_type,
        hashtags,
        vote_count,
        comment_count,
        created_at,
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

    if (insertError) {
      console.error("Error creating post:", insertError)
      return NextResponse.json({ error: "Failed to create post" }, { status: 500 })
    }

    return NextResponse.json({ post })
  } catch (error) {
    console.error("Create post API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
