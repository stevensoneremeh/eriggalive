import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

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

    const formData = await request.formData()
    const content = formData.get("content") as string
    const categoryId = formData.get("categoryId") as string

    if (!content?.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    if (!categoryId) {
      return NextResponse.json({ error: "Category is required" }, { status: 400 })
    }

    // Validate content for URLs
    const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/gi
    if (urlRegex.test(content)) {
      return NextResponse.json({ error: "Posts cannot contain external links or URLs" }, { status: 400 })
    }

    const postData = {
      user_id: authUser.id,
      category_id: Number.parseInt(categoryId),
      content: content.trim(),
      is_published: true,
      is_deleted: false,
    }

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
      console.error("Error creating post:", insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    revalidatePath("/community")
    return NextResponse.json({ success: true, post: newPost })
  } catch (error: any) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
