import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()

    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Get user's internal ID
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("auth_user_id", user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    const formData = await request.formData()
    const content = formData.get("content") as string
    const categoryId = Number.parseInt(formData.get("categoryId") as string)
    const mediaFile = formData.get("mediaFile") as File | null

    if (!content?.trim()) {
      return NextResponse.json({ success: false, error: "Content is required" }, { status: 400 })
    }

    if (!categoryId) {
      return NextResponse.json({ success: false, error: "Category is required" }, { status: 400 })
    }

    let mediaUrl = null
    let mediaType = null

    // Handle media upload if present
    if (mediaFile && mediaFile.size > 0) {
      const fileExt = mediaFile.name.split(".").pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `community-media/${fileName}`

      const { data: uploadData, error: uploadError } = await supabase.storage.from("media").upload(filePath, mediaFile)

      if (uploadError) {
        console.error("Upload error:", uploadError)
        return NextResponse.json({ success: false, error: "Failed to upload media" }, { status: 500 })
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("media").getPublicUrl(filePath)

      mediaUrl = publicUrl

      if (mediaFile.type.startsWith("image/")) mediaType = "image"
      else if (mediaFile.type.startsWith("video/")) mediaType = "video"
      else if (mediaFile.type.startsWith("audio/")) mediaType = "audio"
    }

    // Create the post
    const { data: postData, error: postError } = await supabase
      .from("community_posts")
      .insert({
        user_id: userData.id,
        category_id: categoryId,
        content,
        media_url: mediaUrl,
        media_type: mediaType,
        is_published: true,
        is_deleted: false,
        vote_count: 0,
      })
      .select(`
        *,
        user:users!community_posts_user_id_fkey(id, auth_user_id, username, full_name, avatar_url, tier),
        category:community_categories!community_posts_category_id_fkey(id, name, slug)
      `)
      .single()

    if (postError) {
      console.error("Post creation error:", postError)
      return NextResponse.json({ success: false, error: "Failed to create post" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      post: { ...postData, has_voted: false },
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { searchParams } = new URL(request.url)

    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const category = searchParams.get("category")
    const sort = searchParams.get("sort") || "newest"
    const search = searchParams.get("search")

    const offset = (page - 1) * limit

    let query = supabase
      .from("community_posts")
      .select(`
        *,
        user:users!community_posts_user_id_fkey(id, auth_user_id, username, full_name, avatar_url, tier),
        category:community_categories!community_posts_category_id_fkey(id, name, slug),
        votes:community_post_votes(user_id)
      `)
      .eq("is_published", true)
      .eq("is_deleted", false)

    if (category) {
      query = query.eq("category_id", Number.parseInt(category))
    }

    if (search) {
      query = query.ilike("content", `%${search}%`)
    }

    switch (sort) {
      case "oldest":
        query = query.order("created_at", { ascending: true })
        break
      case "top":
        query = query.order("vote_count", { ascending: false }).order("created_at", { ascending: false })
        break
      default:
        query = query.order("created_at", { ascending: false })
    }

    query = query.range(offset, offset + limit - 1)

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, posts: data || [] })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
