import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest, { params }: { params: { id: string, commentId: string } }) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const commentId = parseInt(params.commentId)

    // Get user profile
    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select("id")
      .eq("auth_user_id", user.id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json({ success: false, error: "User profile not found" }, { status: 404 })
    }

    // Check if user already liked
    const { data: existingLike } = await supabase
      .from("community_comment_likes")
      .select("id")
      .eq("comment_id", commentId)
      .eq("user_id", userProfile.id)
      .single()

    let liked = false
    let likeCount = 0

    if (existingLike) {
      // Remove like
      await supabase
        .from("community_comment_likes")
        .delete()
        .eq("comment_id", commentId)
        .eq("user_id", userProfile.id)
      
      liked = false
    } else {
      // Add like
      await supabase
        .from("community_comment_likes")
        .insert({
          comment_id: commentId,
          user_id: userProfile.id
        })
      
      liked = true
    }

    // Get updated like count
    const { count } = await supabase
      .from("community_comment_likes")
      .select("*", { count: "exact", head: true })
      .eq("comment_id", commentId)

    likeCount = count || 0

    // Update the comment's like count
    await supabase
      .from("community_comments")
      .update({ like_count: likeCount })
      .eq("id", commentId)

    return NextResponse.json({
      success: true,
      liked,
      likeCount
    })
  } catch (error) {
    console.error("Error toggling comment like:", error)
    return NextResponse.json({ success: false, error: "Failed to toggle comment like" }, { status: 500 })
  }
}
