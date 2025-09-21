import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get("category")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    const supabase = createClient()

    // Use the database function to get posts with user data
    const { data: posts, error } = await supabase.rpc("get_community_posts_with_user_data", {
      category_filter: categoryId || null,
    })

    if (error) {
      console.error("Error fetching posts:", error)
      return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 })
    }

    // Apply pagination
    const paginatedPosts = posts?.slice(offset, offset + limit) || []

    // Transform the data to match frontend expectations
    const formattedPosts = paginatedPosts.map((post: any) => ({
      id: post.id,
      title: post.title,
      content: post.content,
      media_url: post.media_url,
      media_type: post.media_type,
      vote_count: post.vote_count,
      comment_count: post.comment_count,
      created_at: post.created_at,
      updated_at: post.updated_at,
      user_voted: post.user_voted,
      user: {
        id: post.user_id,
        username: post.username,
        full_name: post.full_name,
        avatar_url: post.avatar_url,
        tier: post.tier,
      },
      category: {
        id: post.category_id,
        name: post.category_name,
        color: post.category_color,
        icon: post.category_icon,
      },
    }))

    return NextResponse.json({
      posts: formattedPosts,
      total: posts?.length || 0,
      hasMore: offset + limit < (posts?.length || 0),
    })
  } catch (error) {
    console.error("Error in posts API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the user profile
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("id")
      .eq("auth_user_id", user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    const body = await request.json()
    const { title, content, category_id, media_url, media_type } = body

    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    // Create the post
    const { data: post, error: createError } = await supabase
      .from("community_posts")
      .insert({
        user_id: profile.id,
        category_id: category_id || null,
        title: title || null,
        content,
        media_url: media_url || null,
        media_type: media_type || null,
      })
      .select()
      .single()

    if (createError) {
      console.error("Error creating post:", createError)
      return NextResponse.json({ error: "Failed to create post" }, { status: 500 })
    }

    return NextResponse.json({ post }, { status: 201 })
  } catch (error) {
    console.error("Error in POST posts API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
