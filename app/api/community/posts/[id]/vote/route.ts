
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const postId = parseInt(params.id)

    // Get user profile
    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select("id")
      .eq("auth_user_id", user.id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json({ success: false, error: "User profile not found" }, { status: 404 })
    }

    // Check if user already voted
    const { data: existingVote } = await supabase
      .from("community_post_votes")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", userProfile.id)
      .single()

    let voted = false
    let voteCount = 0

    if (existingVote) {
      // Remove vote
      await supabase
        .from("community_post_votes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", userProfile.id)
      
      voted = false
    } else {
      // Add vote
      await supabase
        .from("community_post_votes")
        .insert({
          post_id: postId,
          user_id: userProfile.id,
          vote_type: "upvote"
        })
      
      voted = true
    }

    // Get updated vote count
    const { count } = await supabase
      .from("community_post_votes")
      .select("*", { count: "exact", head: true })
      .eq("post_id", postId)

    voteCount = count || 0

    // Update the post's vote count
    await supabase
      .from("community_posts")
      .update({ vote_count: voteCount })
      .eq("id", postId)

    return NextResponse.json({
      success: true,
      voted,
      voteCount
    })
  } catch (error) {
    console.error("Error toggling vote:", error)
    return NextResponse.json({ success: false, error: "Failed to toggle vote" }, { status: 500 })
  }
}
