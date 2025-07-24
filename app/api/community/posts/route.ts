import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Fetch posts with user and category information using simple joins
    const { data: posts, error } = await supabase
      .from("community_posts")
      .select(`
        id,
        content,
        type,
        media_url,
        media_type,
        hashtags,
        vote_count,
        comment_count,
        view_count,
        created_at,
        updated_at,
        user_id,
        category_id
      `)
      .eq("is_published", true)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 })
    }

    if (!posts || posts.length === 0) {
      return NextResponse.json({
        success: true,
        posts: [],
      })
    }

    // Get unique user IDs and category IDs
    const userIds = [...new Set(posts.map((post) => post.user_id))]
    const categoryIds = [...new Set(posts.map((post) => post.category_id).filter(Boolean))]

    // Fetch users separately
    const { data: users } = await supabase
      .from("users")
      .select("id, username, full_name, avatar_url, tier")
      .in("id", userIds)

    // Fetch categories separately
    const { data: categories } = await supabase
      .from("community_categories")
      .select("id, name, slug, icon, color")
      .in("id", categoryIds)

    // Create lookup maps
    const userMap = new Map(users?.map((user) => [user.id, user]) || [])
    const categoryMap = new Map(categories?.map((cat) => [cat.id, cat]) || [])

    // Check if user has voted on each post
    let votedPostIds = new Set()
    if (user) {
      // Get user profile to get the internal user ID
      const { data: userProfile } = await supabase.from("users").select("id").eq("auth_user_id", user.id).single()

      if (userProfile) {
        const postIds = posts.map((post) => post.id)
        const { data: votes } = await supabase
          .from("community_post_votes")
          .select("post_id")
          .eq("user_id", userProfile.id)
          .in("post_id", postIds)

        votedPostIds = new Set(votes?.map((vote) => vote.post_id) || [])
      }
    }

    // Combine the data
    const postsWithRelations = posts.map((post) => ({
      ...post,
      user: userMap.get(post.user_id) || null,
      category: categoryMap.get(post.category_id) || null,
      has_voted: votedPostIds.has(post.id),
      hashtags: Array.isArray(post.hashtags) ? post.hashtags : [],
    }))

    return NextResponse.json({
      success: true,
      posts: postsWithRelations,
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Get user profile
    const { data: profile } = await supabase.from("users").select("id").eq("auth_user_id", user.id).single()

    if (!profile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    const body = await request.json()
    const { content, categoryId, type = "post" } = body

    if (!content || !categoryId) {
      return NextResponse.json({ error: "Content and category are required" }, { status: 400 })
    }

    // Create the post
    const { data: post, error } = await supabase
      .from("community_posts")
      .insert({
        user_id: profile.id,
        category_id: categoryId,
        content: content.trim(),
        type,
        hashtags: [],
        is_published: true,
        is_deleted: false,
      })
      .select("*")
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to create post" }, { status: 500 })
    }

    // Fetch the user and category data separately
    const { data: userData } = await supabase
      .from("users")
      .select("id, username, full_name, avatar_url, tier")
      .eq("id", post.user_id)
      .single()

    const { data: categoryData } = await supabase
      .from("community_categories")
      .select("id, name, slug, icon, color")
      .eq("id", post.category_id)
      .single()

    return NextResponse.json({
      success: true,
      post: {
        ...post,
        user: userData,
        category: categoryData,
        hashtags: Array.isArray(post.hashtags) ? post.hashtags : [],
      },
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
