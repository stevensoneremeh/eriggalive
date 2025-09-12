import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get("categoryId")
    const sortBy = searchParams.get("sortBy") || "newest"
    const limit = Number.parseInt(searchParams.get("limit") || "20")

    const supabase = createRouteHandlerClient({ cookies })

    // Try different database schemas for compatibility
    let posts: any[] = []
    let error: any = null
    
    // First try with user_profiles table
    try {
      let query = supabase
        .from("community_posts")
        .select(`
          *,
          user_profiles!inner(id, username, full_name, avatar_url, tier, coins, reputation_score),
          community_categories!inner(id, name, slug, icon, color),
          post_votes(user_id)
        `)
        .eq("is_published", true)
        .eq("is_deleted", false)

      if (categoryId && categoryId !== "all") {
        query = query.eq("category_id", Number.parseInt(categoryId))
      }

      // Apply sorting
      switch (sortBy) {
        case "newest":
          query = query.order("created_at", { ascending: false })
          break
        case "oldest":
          query = query.order("created_at", { ascending: true })
          break
        case "top":
          query = query.order("vote_count", { ascending: false })
          break
        default:
          query = query.order("created_at", { ascending: false })
      }

      query = query.limit(limit)

      const { data: userProfilePosts, error: profileError } = await query

      if (userProfilePosts && userProfilePosts.length > 0) {
        posts = userProfilePosts
      } else {
        // Throw error to trigger fallback - either because of actual error or empty results
        throw profileError || new Error("No posts found with user_profiles schema")
      }
    } catch (userProfileError) {
      // Fallback to users table
      let query = supabase
        .from("community_posts")
        .select(`
          *,
          user:users!community_posts_user_id_fkey(id, username, full_name, avatar_url, tier),
          category:community_categories!community_posts_category_id_fkey(id, name, slug),
          post_votes(user_id)
        `)
        .eq("is_published", true)
        .eq("is_deleted", false)

      if (categoryId && categoryId !== "all") {
        query = query.eq("category_id", Number.parseInt(categoryId))
      }

      // Apply sorting
      switch (sortBy) {
        case "newest":
          query = query.order("created_at", { ascending: false })
          break
        case "oldest":
          query = query.order("created_at", { ascending: true })
          break
        case "top":
          query = query.order("vote_count", { ascending: false })
          break
        default:
          query = query.order("created_at", { ascending: false })
      }

      query = query.limit(limit)

      const { data: usersPosts, error: usersError } = await query

      if (usersError) {
        console.error("Error fetching posts:", usersError)
        return NextResponse.json({ error: usersError.message }, { status: 500 })
      }

      posts = usersPosts || []
    }

    // Normalize response format for client
    const normalizedPosts = (posts || []).map(post => ({
      ...post,
      user_profiles: post.user || post.user_profiles,
      community_categories: post.category || post.community_categories,
    }))

    return NextResponse.json({ success: true, posts: normalizedPosts })
  } catch (error: any) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Get authenticated user
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !authUser) {
      console.error("[v0] Auth error:", authError)
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    console.log("[v0] Authenticated user:", authUser.email)

    // Try both user table structures for compatibility
    let userProfile = null
    let profileError = null
    
    // First try user_profiles table
    const { data: userProfileData, error: userProfileError } = await supabase
      .from("user_profiles")
      .select("id, username, full_name, avatar_url, tier")
      .eq("id", authUser.id)
      .single()
    
    if (userProfileData) {
      userProfile = userProfileData
    } else {
      // Fallback to users table
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id, username, full_name, avatar_url, tier")
        .eq("auth_user_id", authUser.id)
        .single()
      
      if (userData) {
        userProfile = userData
      } else {
        profileError = userError || userProfileError
      }
    }

    if (!userProfile) {
      console.error("[v0] User profile not found:", profileError)
      return NextResponse.json(
        { error: "User profile not found. Please complete your profile setup." },
        { status: 409 },
      )
    }

    // Handle both JSON and FormData
    let content: string, categoryId: string
    const contentType = request.headers.get("content-type")
    
    if (contentType?.includes("application/json")) {
      const body = await request.json()
      content = body.content
      categoryId = body.categoryId
    } else {
      const formData = await request.formData()
      content = formData.get("content") as string
      categoryId = formData.get("categoryId") as string
    }

    if (!content?.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    if (!categoryId) {
      return NextResponse.json({ error: "Category is required" }, { status: 400 })
    }

    const categoryIdNum = Number.parseInt(categoryId)
    if (isNaN(categoryIdNum)) {
      return NextResponse.json({ error: "Invalid category ID" }, { status: 400 })
    }

    const { data: category, error: categoryError } = await supabase
      .from("community_categories")
      .select("id, name, slug")
      .eq("id", categoryIdNum)
      .eq("is_active", true)
      .single()

    if (categoryError || !category) {
      console.error("[v0] Category not found:", categoryError)
      return NextResponse.json({ error: "Category not found or inactive" }, { status: 409 })
    }

    // Validate content for URLs
    const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/gi
    if (urlRegex.test(content)) {
      return NextResponse.json({ error: "Posts cannot contain external links or URLs" }, { status: 400 })
    }

    if (content.trim().length > 2000) {
      return NextResponse.json({ error: "Post content is too long (max 2000 characters)" }, { status: 400 })
    }

    const postData = {
      user_id: userProfile.id,
      category_id: categoryIdNum,
      content: content.trim(),
      is_published: true,
      is_deleted: false,
      vote_count: 0,
      comment_count: 0,
    }

    console.log("[v0] Creating post with data:", postData)

    const { data: newPost, error: insertError } = await supabase
      .from("community_posts")
      .insert(postData)
      .select(`
        *,
        user:users!community_posts_user_id_fkey(id, username, full_name, avatar_url, tier),
        category:community_categories!community_posts_category_id_fkey(id, name, slug)
      `)
      .single()

    if (insertError) {
      console.error("[v0] Error creating post:", insertError)

      if (insertError.code === "23503") {
        return NextResponse.json(
          { error: "Foreign key constraint violation. Please refresh and try again." },
          { status: 409 },
        )
      }

      if (insertError.code === "23505") {
        return NextResponse.json(
          { error: "Duplicate post detected. Please wait before posting again." },
          { status: 409 },
        )
      }

      if (insertError.code === "23514") {
        return NextResponse.json({ error: "Post content violates community guidelines." }, { status: 409 })
      }

      return NextResponse.json(
        {
          error: insertError.message || "Failed to create post",
          code: insertError.code,
        },
        { status: 500 },
      )
    }

    const responsePost = {
      ...newPost,
      user: newPost.user || userProfile,
      category: newPost.category || category,
    }

    console.log("[v0] Post created successfully:", responsePost.id)

    revalidatePath("/community")
    return NextResponse.json({ success: true, post: responsePost })
  } catch (error: any) {
    console.error("[v0] API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
