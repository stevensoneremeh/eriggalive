import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Get current user for like status
    const {
      data: { user },
    } = await supabase.auth.getUser()

    let userInternalId: number | undefined
    if (user) {
      const { data: userData } = await supabase.from("users").select("id").eq("auth_user_id", user.id).single()
      userInternalId = userData?.id
    }

    // Fetch comments with user data and like status
    const { data: comments, error } = await supabase
      .from("community_comments")
      .select(`
        *,
        user:users!community_comments_user_id_fkey(id, auth_user_id, username, full_name, avatar_url, tier),
        likes:community_comment_likes(user_id)
      `)
      .eq("post_id", Number.parseInt(id))
      .eq("is_deleted", false)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Error fetching comments:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    // Process comments to include like status and organize replies
    const processedComments = (comments || []).map((comment: any) => ({
      ...comment,
      has_liked: userInternalId ? comment.likes.some((like: any) => like.user_id === userInternalId) : false,
    }))

    return NextResponse.json({ success: true, comments: processedComments })
  } catch (error: any) {
    console.error("Error in comments API:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const body = await request.json()

    const { content, parent_comment_id } = body

    if (!content?.trim()) {
      return NextResponse.json({ success: false, error: "Comment content is required" }, { status: 400 })
    }

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    // Get user profile
    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select("id")
      .eq("auth_user_id", user.id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json({ success: false, error: "User profile not found" }, { status: 404 })
    }

    // Create comment
    const { data: newComment, error: commentError } = await supabase
      .from("community_comments")
      .insert({
        post_id: Number.parseInt(id),
        user_id: userProfile.id,
        content: content.trim(),
        parent_comment_id: parent_comment_id || null,
      })
      .select(`
        *,
        user:users!community_comments_user_id_fkey(id, auth_user_id, username, full_name, avatar_url, tier)
      `)
      .single()

    if (commentError) {
      console.error("Error creating comment:", commentError)
      return NextResponse.json({ success: false, error: commentError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, comment: newComment })
  } catch (error: any) {
    console.error("Error in create comment API:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
