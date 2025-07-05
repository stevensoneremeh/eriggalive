import { createAdminSupabaseClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createAdminSupabaseClient()

    // Check if community_posts table exists, if not use posts table
    const { data: posts, error: postsError } = await supabase
      .from("posts")
      .select(`
        id,
        content,
        type,
        media_urls,
        media_types,
        thumbnail_urls,
        like_count,
        comment_count,
        view_count,
        is_featured,
        is_pinned,
        created_at,
        updated_at,
        user_id,
        hashtags,
        tags
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

    // Get unique user IDs
    const userIds = [...new Set(posts.map((post) => post.user_id))]

    // Fetch users
    const { data: users } = await supabase
      .from("users")
      .select("id, username, full_name, avatar_url, tier")
      .in("id", userIds)

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
          // Check for votes in post_votes or similar table
          const { data: votes } = await supabase
            .from("post_votes")
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

      return {
        ...post,
        user: postUser || {
          id: post.user_id,
          username: "Unknown User",
          full_name: "Unknown User",
          avatar_url: "/placeholder-user.jpg",
          tier: "grassroot",
        },
        category: {
          id: 1,
          name: post.type || "General",
          slug: post.type || "general",
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
    const supabase = await createAdminSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { content, type = "general", media_urls, media_types, hashtags } = body

    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    // Get user's internal ID
    const { data: userData } = await supabase.from("users").select("id").eq("auth_user_id", user.id).single()

    if (!userData) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    const { data: post, error } = await supabase
      .from("posts")
      .insert({
        user_id: userData.id,
        content,
        type,
        media_urls: media_urls || [],
        media_types: media_types || [],
        thumbnail_urls: [],
        hashtags: hashtags || [],
        tags: [],
        like_count: 0,
        comment_count: 0,
        view_count: 0,
        share_count: 0,
        is_featured: false,
        is_pinned: false,
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
