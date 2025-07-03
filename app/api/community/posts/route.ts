import { createAdminSupabaseClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = createAdminSupabaseClient()

    // First, get posts with all required fields
    const { data: posts, error: postsError } = await supabase
      .from("community_posts")
      .select(`
        id,
        content,
        hashtags,
        media_url,
        media_type,
        vote_count,
        comment_count,
        view_count,
        is_pinned,
        is_featured,
        created_at,
        updated_at,
        user_id,
        category_id
      `)
      .eq("is_published", true)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .limit(20)

    if (postsError) {
      console.error("Error fetching posts:", postsError)
      return NextResponse.json({ posts: [], error: postsError.message }, { status: 500 })
    }

    if (!posts || posts.length === 0) {
      return NextResponse.json({ posts: [] })
    }

    // Get unique user IDs and category IDs
    const userIds = [...new Set(posts.map((post) => post.user_id))]
    const categoryIds = [...new Set(posts.map((post) => post.category_id))]

    // Fetch users
    const { data: users } = await supabase
      .from("users")
      .select("id, username, full_name, avatar_url, tier")
      .in("id", userIds)

    // Fetch categories
    const { data: categories } = await supabase
      .from("community_categories")
      .select("id, name, slug, icon, color")
      .in("id", categoryIds)

    // Get current user for vote status (if authenticated)
    let userVotes: number[] = []
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        // Get user's internal ID
        const { data: userData } = await supabase.from("users").select("id").eq("auth_user_id", user.id).single()

        if (userData) {
          const { data: votes } = await supabase
            .from("community_post_votes")
            .select("post_id")
            .eq("user_id", userData.id)
            .in(
              "post_id",
              posts.map((p) => p.id),
            )

          userVotes = votes?.map((v) => v.post_id) || []
        }
      }
    } catch (error) {
      console.warn("Could not fetch user vote status:", error)
    }

    // Combine the data
    const enrichedPosts = posts.map((post) => {
      const postUser = users?.find((u) => u.id === post.user_id)
      const postCategory = categories?.find((c) => c.id === post.category_id)

      return {
        ...post,
        user: postUser || {
          id: post.user_id,
          username: "Unknown User",
          full_name: "Unknown User",
          avatar_url: "/placeholder-user.jpg",
          tier: "grassroot",
        },
        category: postCategory || {
          id: post.category_id,
          name: "General",
          slug: "general",
          icon: "💬",
          color: "#3B82F6",
        },
        has_voted: userVotes.includes(post.id),
      }
    })

    return NextResponse.json({ posts: enrichedPosts })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json(
      {
        posts: [],
        error: "Failed to fetch posts",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createAdminSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { content, category_id, media_url, media_type, hashtags } = body

    if (!content || !category_id) {
      return NextResponse.json({ error: "Content and category are required" }, { status: 400 })
    }

    // Get user's internal ID
    const { data: userData } = await supabase.from("users").select("id").eq("auth_user_id", user.id).single()

    if (!userData) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    const { data: post, error } = await supabase
      .from("community_posts")
      .insert({
        user_id: userData.id,
        category_id,
        content,
        media_url,
        media_type,
        hashtags: hashtags || [],
        vote_count: 0,
        comment_count: 0,
        view_count: 0,
        is_published: true,
        is_deleted: false,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating post:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, post })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 })
  }
}
