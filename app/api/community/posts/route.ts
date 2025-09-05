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

    let query = supabase
      .from("community_posts")
      .select(`
        *,
        user:user_profiles!community_posts_user_id_fkey(id, username, full_name, avatar_url, tier),
        category:community_categories!community_posts_category_id_fkey(id, name, slug)
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

    const { data: posts, error } = await query

    if (error) {
      console.error("Error fetching posts:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ posts: posts || [] })
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

    const { data: userProfile, error: profileError } = await supabase
      .from("user_profiles")
      .select("id, username, full_name, avatar_url, tier")
      .eq("id", authUser.id)
      .single()

    if (profileError || !userProfile) {
      console.error("[v0] User profile not found:", profileError)
      return NextResponse.json(
        { error: "User profile not found. Please complete your profile setup." },
        { status: 409 },
      )
    }

    const formData = await request.formData()
    const content = formData.get("content") as string
    const categoryId = formData.get("categoryId") as string

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
      user_id: authUser.id,
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
        user:user_profiles!community_posts_user_id_fkey(id, username, full_name, avatar_url, tier),
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
