import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const category = searchParams.get("category")
    const offset = (page - 1) * limit

    let query = supabase
      .from("community_posts")
      .select(`
        *,
        user_profiles!inner (
          id, username, full_name, avatar_url, tier, coins, reputation_score
        ),
        community_categories!inner (
          id, name, slug, icon, color
        ),
        post_votes (
          user_id
        )
      `)
      .eq("is_published", true)
      .eq("is_deleted", false)

    if (category) {
      query = query.eq("category_id", Number.parseInt(category))
    }

    const { data: posts, error } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error("Error fetching posts:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get current user to check vote status
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Add vote status for current user
    const postsWithVoteStatus =
      posts?.map((post) => ({
        ...post,
        has_voted: user ? post.post_votes.some((vote: any) => vote.user_id === user.id) : false,
        post_votes: undefined, // Remove votes array from response
      })) || []

    return NextResponse.json({
      posts: postsWithVoteStatus,
      success: true,
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const body = await request.json()
    const { content, categoryId } = body

    if (!content?.trim() || !categoryId) {
      return NextResponse.json({ error: "Content and category are required" }, { status: 400 })
    }

    // Extract hashtags from content
    const hashtags = content.match(/#\w+/g)?.map((tag: string) => tag.slice(1)) || []

    // Create post
    const { data: post, error: postError } = await supabase
      .from("community_posts")
      .insert({
        user_id: user.id,
        category_id: Number.parseInt(categoryId),
        content: content.trim(),
        hashtags,
      })
      .select(`
        *,
        user_profiles!inner (
          id, username, full_name, avatar_url, tier, coins, reputation_score
        ),
        community_categories!inner (
          id, name, slug, icon, color
        )
      `)
      .single()

    if (postError) {
      console.error("Error creating post:", postError)
      return NextResponse.json({ error: "Failed to create post" }, { status: 500 })
    }

    return NextResponse.json({
      post: { ...post, has_voted: false },
      success: true,
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
