import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const commentId = Number.parseInt(params.id)

    if (isNaN(commentId)) {
      return NextResponse.json({ error: "Invalid comment ID" }, { status: 400 })
    }

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

    // Check if user has already liked this comment
    const { data: existingLike } = await supabase
      .from("community_comment_likes")
      .select("id")
      .eq("comment_id", commentId)
      .eq("user_id", profile.id)
      .single()

    let liked = false

    if (existingLike) {
      // Remove like
      const { error: deleteError } = await supabase
        .from("community_comment_likes")
        .delete()
        .eq("comment_id", commentId)
        .eq("user_id", profile.id)

      if (deleteError) {
        console.error("Error removing like:", deleteError)
        return NextResponse.json({ error: "Failed to remove like" }, { status: 500 })
      }

      // Decrease like count
      const { error: updateError } = await supabase
        .from("community_comments")
        .update({ like_count: supabase.sql`like_count - 1` })
        .eq("id", commentId)

      if (updateError) {
        console.error("Error updating like count:", updateError)
        return NextResponse.json({ error: "Failed to update like count" }, { status: 500 })
      }

      liked = false
    } else {
      // Add like
      const { error: insertError } = await supabase.from("community_comment_likes").insert({
        comment_id: commentId,
        user_id: profile.id,
      })

      if (insertError) {
        console.error("Error adding like:", insertError)
        return NextResponse.json({ error: "Failed to add like" }, { status: 500 })
      }

      // Increase like count
      const { error: updateError } = await supabase
        .from("community_comments")
        .update({ like_count: supabase.sql`like_count + 1` })
        .eq("id", commentId)

      if (updateError) {
        console.error("Error updating like count:", updateError)
        return NextResponse.json({ error: "Failed to update like count" }, { status: 500 })
      }

      liked = true
    }

    return NextResponse.json({
      success: true,
      liked,
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
