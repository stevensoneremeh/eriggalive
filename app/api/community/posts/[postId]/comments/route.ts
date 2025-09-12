import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function GET(request: NextRequest, { params }: { params: { postId: string } }) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const postId = params.postId

    if (!postId) {
      return NextResponse.json({ error: "Post ID is required" }, { status: 400 })
    }

    // Try different database schemas for compatibility
    let comments: any[] = []
    
    try {
      // First try with user_profiles
      const { data: userProfileComments, error: profileError } = await supabase
        .from("community_comments")
        .select(`
          *,
          user_profiles!inner(id, username, full_name, avatar_url, tier)
        `)
        .eq("post_id", postId)
        .eq("is_deleted", false)
        .order("created_at", { ascending: true })

      if (userProfileComments && userProfileComments.length > 0) {
        comments = userProfileComments.map(comment => ({
          ...comment,
          user: comment.user_profiles
        }))
      } else {
        throw profileError || new Error("No comments with user_profiles")
      }
    } catch (userProfileError) {
      // Fallback to users table
      const { data: userComments, error: userError } = await supabase
        .from("community_comments")
        .select(`
          *,
          user:users!community_comments_user_id_fkey(id, username, full_name, avatar_url, tier)
        `)
        .eq("post_id", postId)
        .eq("is_deleted", false)
        .order("created_at", { ascending: true })

      if (userError) {
        console.error("Error fetching comments:", userError)
        return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 })
      }

      comments = userComments || []
    }

    return NextResponse.json({ success: true, comments })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { postId: string } }) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const postId = params.postId

    if (!postId) {
      return NextResponse.json({ error: "Post ID is required" }, { status: 400 })
    }

    // Get authenticated user
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !authUser) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Get user profile - try both table structures
    let userProfile = null
    
    const { data: userProfileData } = await supabase
      .from("user_profiles")
      .select("id, username, full_name, avatar_url, tier")
      .eq("id", authUser.id)
      .single()
    
    if (userProfileData) {
      userProfile = userProfileData
    } else {
      const { data: userData } = await supabase
        .from("users")
        .select("id, username, full_name, avatar_url, tier")
        .eq("auth_user_id", authUser.id)
        .single()
      
      if (userData) {
        userProfile = userData
      }
    }

    if (!userProfile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    // Handle both JSON and FormData
    let content: string
    const contentType = request.headers.get("content-type")
    
    if (contentType?.includes("application/json")) {
      const body = await request.json()
      content = body.content
    } else {
      const formData = await request.formData()
      content = formData.get("content") as string
    }

    if (!content?.trim()) {
      return NextResponse.json({ error: "Comment content is required" }, { status: 400 })
    }

    if (content.trim().length > 1000) {
      return NextResponse.json({ error: "Comment is too long (max 1000 characters)" }, { status: 400 })
    }

    // Create comment
    const { data: newComment, error: insertError } = await supabase
      .from("community_comments")
      .insert({
        post_id: postId,
        user_id: userProfile.id,
        content: content.trim(),
        is_deleted: false,
      })
      .select("*")
      .single()

    if (insertError) {
      console.error("Error creating comment:", insertError)
      return NextResponse.json({ error: "Failed to create comment" }, { status: 500 })
    }

    // Update post comment count
    await supabase.rpc('increment_comment_count', { post_id_input: Number.parseInt(postId) })

    const responseComment = {
      ...newComment,
      user: userProfile,
    }

    return NextResponse.json({ success: true, comment: responseComment })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}