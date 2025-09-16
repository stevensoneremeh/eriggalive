import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const category = searchParams.get("category")
    const sort = searchParams.get("sort") || "recent"
    const limit = Number.parseInt(searchParams.get("limit") || "50")

    let query = supabase
      .from("community_posts")
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
      .eq("is_published", true)
      .eq("is_deleted", false)

    // Filter by category
    if (category && category !== "all") {
      const { data: categoryData } = await supabase
        .from("community_categories")
        .select("id")
        .eq("slug", category)
        .single()

      if (categoryData) {
        query = query.eq("category_id", categoryData.id)
      }
    }

    // Sort posts
    switch (sort) {
      case "popular":
        query = query.order("vote_count", { ascending: false })
        break
      case "trending":
        query = query.order("comment_count", { ascending: false })
        break
      default:
        query = query.order("created_at", { ascending: false })
    }

    const { data, error } = await query.limit(limit)

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 })
    }

    return NextResponse.json({ posts: data || [] })
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

    const { data, error } = await supabase
      .from("community_posts")
      .insert({
        title: title.trim(),
        content: content.trim(),
        category_id: category_id || 1,
        user_id: user.id,
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
