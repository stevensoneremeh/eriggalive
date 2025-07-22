import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { publishEvent, ABLY_CHANNELS } from "@/lib/ably"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get("categoryId")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const offset = (page - 1) * limit

    let query = supabase
      .from("community_posts")
      .select(`
        *,
        author:profiles!community_posts_author_id_fkey(
          id,
          username,
          full_name,
          avatar_url,
          tier
        ),
        category:community_categories!community_posts_category_id_fkey(
          id,
          name,
          slug,
          color
        ),
        _count:community_post_votes(count),
        user_vote:community_post_votes!left(vote_type),
        user_bookmark:user_bookmarks!left(id)
      `)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (categoryId && categoryId !== "all") {
      query = query.eq("category_id", Number.parseInt(categoryId))
    }

    const { data: posts, error } = await query

    if (error) {
      console.error("Error fetching posts:", error)
      return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 })
    }

    // Transform the data to include vote counts and user interactions
    const transformedPosts =
      posts?.map((post) => ({
        ...post,
        vote_count: post._count?.[0]?.count || 0,
        user_voted: post.user_vote?.[0]?.vote_type || null,
        user_bookmarked: !!post.user_bookmark?.[0]?.id,
      })) || []

    return NextResponse.json({ posts: transformedPosts })
  } catch (error) {
    console.error("Error in posts API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, content, category_id, media_urls, media_type } = body

    if (!title || !content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 })
    }

    // Insert the post
    const { data: post, error: insertError } = await supabase
      .from("community_posts")
      .insert({
        title,
        content,
        author_id: user.id,
        category_id: category_id || null,
        media_urls: media_urls || [],
        media_type: media_type || null,
      })
      .select(`
        *,
        author:profiles!community_posts_author_id_fkey(
          id,
          username,
          full_name,
          avatar_url,
          tier
        ),
        category:community_categories!community_posts_category_id_fkey(
          id,
          name,
          slug,
          color
        )
      `)
      .single()

    if (insertError) {
      console.error("Error creating post:", insertError)
      return NextResponse.json({ error: "Failed to create post" }, { status: 500 })
    }

    // Publish real-time event for new post
    try {
      publishEvent(ABLY_CHANNELS.COMMUNITY_FEED, "post:created", {
        post: {
          ...post,
          vote_count: 0,
          user_voted: null,
          user_bookmarked: false,
        },
        categoryId: category_id,
      })
    } catch (ablyError) {
      console.error("Failed to publish real-time event:", ablyError)
      // Don't fail the request if real-time publishing fails
    }

    return NextResponse.json({
      post: {
        ...post,
        vote_count: 0,
        user_voted: null,
        user_bookmarked: false,
      },
    })
  } catch (error) {
    console.error("Error in POST posts API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
