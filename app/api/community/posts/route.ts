import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import DOMPurify from "isomorphic-dompurify"

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    // Get user profile
    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select("*")
      .eq("auth_user_id", user.id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json({ success: false, error: "User profile not found" }, { status: 404 })
    }

    const formData = await request.formData()
    const content = formData.get("content") as string
    const categoryId = formData.get("categoryId") as string
    const mediaFile = formData.get("mediaFile") as File | null

    if (!content?.trim() && !mediaFile) {
      return NextResponse.json({ success: false, error: "Content or media is required" }, { status: 400 })
    }

    if (!categoryId) {
      return NextResponse.json({ success: false, error: "Category is required" }, { status: 400 })
    }

    // Sanitize content
    const sanitizedContent = content ? DOMPurify.sanitize(content) : ""

    // Handle media upload
    let mediaUrl: string | undefined
    let mediaType: string | undefined
    let mediaMetadata: Record<string, any> | undefined

    if (mediaFile && mediaFile.size > 0) {
      const fileExt = mediaFile.name.split(".").pop()
      const fileName = `${userProfile.id}-${Date.now()}.${fileExt}`
      const filePath = `community_media/${fileName}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("eriggalive-assets")
        .upload(filePath, mediaFile)

      if (uploadError) {
        console.error("Media upload error:", uploadError)
        return NextResponse.json(
          { success: false, error: `Media upload failed: ${uploadError.message}` },
          { status: 500 },
        )
      }

      const { data: publicUrlData } = supabase.storage.from("eriggalive-assets").getPublicUrl(uploadData.path)
      mediaUrl = publicUrlData.publicUrl

      if (mediaFile.type.startsWith("image/")) mediaType = "image"
      else if (mediaFile.type.startsWith("audio/")) mediaType = "audio"
      else if (mediaFile.type.startsWith("video/")) mediaType = "video"

      mediaMetadata = {
        name: mediaFile.name,
        size: mediaFile.size,
        type: mediaFile.type,
      }
    }

    // Create post
    const { data: newPost, error: insertError } = await supabase
      .from("community_posts")
      .insert({
        user_id: userProfile.id,
        category_id: Number.parseInt(categoryId),
        content: sanitizedContent,
        media_url: mediaUrl,
        media_type: mediaType,
        media_metadata: mediaMetadata,
      })
      .select(`
        *,
        user:users!community_posts_user_id_fkey(id, auth_user_id, username, full_name, avatar_url, tier),
        category:community_categories!community_posts_category_id_fkey(id, name, slug)
      `)
      .single()

    if (insertError) {
      console.error("Post creation error:", insertError)
      return NextResponse.json({ success: false, error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      post: { ...newPost, has_voted: false },
    })
  } catch (error: any) {
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
    const categoryId = searchParams.get("categoryId")
    const sort = searchParams.get("sort") || "newest"
    const search = searchParams.get("search")

    const offset = (page - 1) * limit

    // Get current user for vote status
    const {
      data: { user },
    } = await supabase.auth.getUser()

    let userInternalId: number | undefined
    if (user) {
      const { data: userData } = await supabase.from("users").select("id").eq("auth_user_id", user.id).single()
      userInternalId = userData?.id
    }

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

    if (categoryId) {
      query = query.eq("category_id", Number.parseInt(categoryId))
    }

    if (search) {
      query = query.ilike("content", `%${search}%`)
    }

    // Apply sorting
    switch (sort) {
      case "newest":
        query = query.order("created_at", { ascending: false })
        break
      case "oldest":
        query = query.order("created_at", { ascending: true })
        break
      case "top":
        query = query.order("vote_count", { ascending: false }).order("created_at", { ascending: false })
        break
    }

    query = query.range(offset, offset + limit - 1)

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    const postsWithVoteStatus = (data || []).map((post: any) => ({
      ...post,
      has_voted: userInternalId ? post.votes.some((vote: any) => vote.user_id === userInternalId) : false,
    }))

    return NextResponse.json({
      success: true,
      posts: postsWithVoteStatus,
      hasMore: postsWithVoteStatus.length === limit,
    })
  } catch (error: any) {
    console.error("API error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
