import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import DOMPurify from "isomorphic-dompurify"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const category = searchParams.get("category")
    const search = searchParams.get("search")

    const offset = (page - 1) * limit

    let query = supabase
      .from("community_posts")
      .select(`
        *,
        user:users!community_posts_user_id_fkey(
          id,
          username,
          full_name,
          avatar_url,
          tier
        ),
        category:community_categories!community_posts_category_id_fkey(
          id,
          name,
          slug,
          color,
          icon
        )
      `)
      .eq("is_published", true)
      .eq("is_deleted", false)

    if (category) {
      query = query.eq("category_id", Number.parseInt(category))
    }

    if (search) {
      query = query.ilike("content", `%${search}%`)
    }

    const { data: posts, error } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error("Error fetching posts:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ posts: posts || [] })
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
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !authUser) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Get user profile
    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select("*")
      .eq("auth_user_id", authUser.id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    const formData = await request.formData()
    const content = formData.get("content") as string
    const categoryId = formData.get("categoryId") as string
    const mediaFile = formData.get("mediaFile") as File | null

    if (!content?.trim() && !mediaFile) {
      return NextResponse.json({ error: "Please provide content or upload media" }, { status: 400 })
    }

    if (!categoryId) {
      return NextResponse.json({ error: "Please select a category" }, { status: 400 })
    }

    const sanitizedContent = DOMPurify.sanitize(content)

    let media_url: string | undefined = undefined
    let media_type: string | undefined = undefined
    let media_metadata: Record<string, any> | undefined = undefined

    // Handle media upload
    if (mediaFile && mediaFile.size > 0) {
      const fileExt = mediaFile.name.split(".").pop()
      const fileName = `${userProfile.id}-${Date.now()}.${fileExt}`
      const filePath = `community_media/${fileName}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("eriggalive-assets")
        .upload(filePath, mediaFile)

      if (uploadError) {
        console.error("Media upload error:", uploadError)
        return NextResponse.json({ error: `Media upload failed: ${uploadError.message}` }, { status: 500 })
      }

      const { data: publicUrlData } = supabase.storage.from("eriggalive-assets").getPublicUrl(uploadData.path)

      media_url = publicUrlData.publicUrl

      if (mediaFile.type.startsWith("image/")) media_type = "image"
      else if (mediaFile.type.startsWith("audio/")) media_type = "audio"
      else if (mediaFile.type.startsWith("video/")) media_type = "video"

      media_metadata = {
        name: mediaFile.name,
        size: mediaFile.size,
        type: mediaFile.type,
      }
    }

    // Create the post
    const { data: newPost, error: createError } = await supabase
      .from("community_posts")
      .insert({
        user_id: userProfile.id,
        category_id: Number.parseInt(categoryId),
        content: sanitizedContent,
        media_url,
        media_type,
        media_metadata,
        is_published: true,
        is_deleted: false,
        vote_count: 0,
        comment_count: 0,
      })
      .select(`
        *,
        user:users!community_posts_user_id_fkey(
          id,
          username,
          full_name,
          avatar_url,
          tier
        ),
        category:community_categories!community_posts_category_id_fkey(
          id,
          name,
          slug,
          color,
          icon
        )
      `)
      .single()

    if (createError) {
      console.error("Post creation error:", createError)
      return NextResponse.json({ error: createError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, post: newPost })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
