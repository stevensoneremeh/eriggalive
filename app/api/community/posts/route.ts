import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const category = searchParams.get("category")
    const sort = searchParams.get("sort") || "recent"
    const limit = Number.parseInt(searchParams.get("limit") || "50")

    // Get category ID if filtering by specific category
    let categoryFilter = null
    if (category && category !== "all") {
      const { data: categoryData } = await supabase
        .from("community_categories")
        .select("id")
        .eq("slug", category)
        .single()

      if (categoryData) {
        categoryFilter = categoryData.id
      }
    }

    // Use the database function for better performance
    const { data, error } = await supabase.rpc("get_community_posts_with_user_data", {
      category_filter: categoryFilter,
    })

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 })
    }

    // Sort posts on the server side
    let sortedPosts = data || []
    switch (sort) {
      case "popular":
        sortedPosts = sortedPosts.sort((a: any, b: any) => b.vote_count - a.vote_count)
        break
      case "trending":
        sortedPosts = sortedPosts.sort((a: any, b: any) => b.comment_count - a.comment_count)
        break
      default:
        sortedPosts = sortedPosts.sort(
          (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )
    }

    return NextResponse.json({ posts: sortedPosts.slice(0, limit) })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const body = await request.json()
    const { title, content, category_id, media_url, media_type } = body

    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 })
    }

    // Extract hashtags from content
    const hashtags = content.match(/#\w+/g)?.map((tag: string) => tag.toLowerCase()) || []

    // Get user ID from users table
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("auth_user_id", user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const { data, error } = await supabase
      .from("community_posts")
      .insert({
        title: title.trim(),
        content: content.trim(),
        category_id: category_id || null,
        user_id: userData.id,
        media_url,
        media_type,
        hashtags,
        is_published: true,
        vote_count: 0,
        comment_count: 0,
      })
      .select(`
        *,
        users (
          id,
          username,
          full_name,
          avatar_url,
          tier
        ),
        community_categories (
          id,
          name,
          slug,
          color,
          icon
        )
      `)
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to create post" }, { status: 500 })
    }

    return NextResponse.json({ post: data }, { status: 201 })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
