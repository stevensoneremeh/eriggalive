import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

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

    const body = await request.json()
    const { postId } = body

    if (!postId) {
      return NextResponse.json({ error: "Post ID is required" }, { status: 400 })
    }

    // Check if user has already voted
    const { data: existingVote } = await supabase
      .from("community_post_votes")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", profile.id)
      .single()

    let voted = false

    if (existingVote) {
      // Remove vote
      const { error: deleteError } = await supabase
        .from("community_post_votes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", profile.id)

      if (deleteError) {
        console.error("Error removing vote:", deleteError)
        return NextResponse.json({ error: "Failed to remove vote" }, { status: 500 })
      }

      // Decrease vote count
      const { error: updateError } = await supabase
        .from("community_posts")
        .update({ vote_count: supabase.sql`vote_count - 1` })
        .eq("id", postId)

      if (updateError) {
        console.error("Error updating vote count:", updateError)
      }

      voted = false
    } else {
      // Add vote
      const { error: insertError } = await supabase.from("community_post_votes").insert({
        post_id: postId,
        user_id: profile.id,
      })

      if (insertError) {
        console.error("Error adding vote:", insertError)
        return NextResponse.json({ error: "Failed to add vote" }, { status: 500 })
      }

      // Increase vote count
      const { error: updateError } = await supabase
        .from("community_posts")
        .update({ vote_count: supabase.sql`vote_count + 1` })
        .eq("id", postId)

      if (updateError) {
        console.error("Error updating vote count:", updateError)
      }

      voted = true
    }

    return NextResponse.json({
      success: true,
      voted,
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
