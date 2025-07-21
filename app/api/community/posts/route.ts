import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    // Get current user for bookmark and vote status
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

    // Get bookmark and vote status for current user if logged in
    let postsWithStatus = posts || []

    if (currentUserId && posts && posts.length > 0) {
      const postIds = posts.map((post) => post.id)

      // Get bookmarks
      const { data: bookmarks } = await supabase
        .from("user_bookmarks")
        .select("post_id")
        .eq("user_id", currentUserId)
        .in("post_id", postIds)

      // Get votes
      const { data: votes } = await supabase
        .from("community_post_votes")
        .select("post_id")
        .eq("user_id", currentUserId)
        .in("post_id", postIds)

      const bookmarkedPostIds = new Set(bookmarks?.map((b) => b.post_id) || [])
      const votedPostIds = new Set(votes?.map((v) => v.post_id) || [])

      postsWithStatus = posts.map((post) => ({
        ...post,
        is_bookmarked: bookmarkedPostIds.has(post.id),
        has_voted: votedPostIds.has(post.id),
        hashtags: Array.isArray(post.hashtags) ? post.hashtags : [],
      }))
    } else {
      postsWithStatus =
        posts?.map((post) => ({
          ...post,
          is_bookmarked: false,
          has_voted: false,
          hashtags: Array.isArray(post.hashtags) ? post.hashtags : [],
        })) || []
    }

    return NextResponse.json({
      success: true,
      posts: postsWithStatus,
    })
  } catch (error) {
    console.error("Posts API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { content, categoryId, media_url, media_type } = body

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    if (!categoryId) {
      return NextResponse.json({ error: "Category is required" }, { status: 400 })
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
    const hashtags = content.match(hashtagRegex)?.map((tag: string) => tag.slice(1)) || []

    // Create post
    const { data: post, error: insertError } = await supabase
      .from("community_posts")
      .insert({
        user_id: userData.id,
        category_id: Number.parseInt(categoryId),
        content: content.trim(),
        media_url,
        media_type,
        hashtags,
        is_published: true,
        is_deleted: false,
      })
      .select(`
        id,
        content,
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

    if (insertError) {
      console.error("Error creating post:", insertError)
      return NextResponse.json({ error: "Failed to create post" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      post: {
        ...post,
        is_bookmarked: false,
        has_voted: false,
        hashtags: Array.isArray(post.hashtags) ? post.hashtags : [],
      },
    })
  } catch (error) {
    console.error("Create post API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
