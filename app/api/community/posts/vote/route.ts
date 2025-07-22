import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

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
    const { data: voterProfile, error: profileError } = await supabase
      .from("users")
      .select("*")
      .eq("auth_user_id", authUser.id)
      .single()

    if (profileError || !voterProfile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    const { postId, postCreatorAuthId } = await request.json()

    if (!postId) {
      return NextResponse.json({ error: "Post ID is required" }, { status: 400 })
    }

    // Check if trying to vote on own post
    const { data: postData } = await supabase.from("community_posts").select("user_id").eq("id", postId).single()

    if (postData && postData.user_id === voterProfile.id) {
      return NextResponse.json(
        {
          error: "You cannot vote on your own post",
          code: "SELF_VOTE",
        },
        { status: 400 },
      )
    }

    // Check if already voted
    const { data: existingVote } = await supabase
      .from("community_post_votes")
      .select("*")
      .eq("post_id", postId)
      .eq("user_id", voterProfile.id)
      .single()

    if (existingVote) {
      // Remove vote
      const { error: deleteError } = await supabase
        .from("community_post_votes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", voterProfile.id)

      if (deleteError) {
        console.error("Vote delete error:", deleteError)
        return NextResponse.json({ error: deleteError.message }, { status: 500 })
      }

      // Update post vote count
      const { error: updateError } = await supabase
        .from("community_posts")
        .update({ vote_count: supabase.sql`vote_count - 1` })
        .eq("id", postId)

      if (updateError) {
        console.error("Vote count update error:", updateError)
      }

      return NextResponse.json({
        success: true,
        voted: false,
        message: "Vote removed successfully",
      })
    } else {
      // Add vote
      const { error: insertError } = await supabase.from("community_post_votes").insert({
        post_id: postId,
        user_id: voterProfile.id,
      })

      if (insertError) {
        console.error("Vote insert error:", insertError)
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }

      // Update post vote count
      const { error: updateError } = await supabase
        .from("community_posts")
        .update({ vote_count: supabase.sql`vote_count + 1` })
        .eq("id", postId)

      if (updateError) {
        console.error("Vote count update error:", updateError)
      }

      return NextResponse.json({
        success: true,
        voted: true,
        message: "Voted successfully!",
      })
    }
  } catch (error) {
    console.error("Vote API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
