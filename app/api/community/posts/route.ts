import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const sort = searchParams.get("sort") || "newest"

    // Get posts using the database function
    const { data: posts, error } = await supabase.rpc("get_community_posts_with_user_data", {
      category_filter: category || null,
    })

    if (error) {
      console.error("Error fetching posts:", error)
      return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 })
    }

    // Sort posts based on the sort parameter
    let sortedPosts = posts || []
    switch (sort) {
      case "popular":
        sortedPosts = sortedPosts.sort((a, b) => b.vote_count - a.vote_count)
        break
      case "discussed":
        sortedPosts = sortedPosts.sort((a, b) => b.comment_count - a.comment_count)
        break
      case "newest":
      default:
        sortedPosts = sortedPosts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
    }

    return NextResponse.json({ posts: sortedPosts })
  } catch (error) {
    console.error("Error in posts API:", error)
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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

    const body = await request.json()
    const { title, content, category_id, media_url, media_type } = body

    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    // Create the post
    const { data: post, error: postError } = await supabase
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

    if (postError) {
      console.error("Error creating post:", postError)
      return NextResponse.json({ error: "Failed to create post" }, { status: 500 })
    }

    return NextResponse.json({ post })
  } catch (error) {
    console.error("Error in POST posts API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
