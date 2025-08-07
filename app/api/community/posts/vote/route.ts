import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    // Get authenticated user
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

    const { postId } = await request.json()

    if (!postId) {
      return NextResponse.json({ error: "Post ID is required" }, { status: 400 })
    }

    // Check if post exists and get post details
    const { data: post, error: postError } = await supabase
      .from("community_posts")
      .select("user_id")
      .eq("id", postId)
      .single()

    if (postError || !post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    // Prevent self-voting
    if (post.user_id === userProfile.id) {
      return NextResponse.json({ error: "You cannot vote on your own post" }, { status: 400 })
    }

    // Check if user has already voted
    const { data: existingVote } = await supabase
      .from("community_post_votes")
      .select("*")
      .eq("post_id", postId)
      .eq("user_id", userProfile.id)
      .maybeSingle()

    let voted = false

    if (existingVote) {
      // Remove vote
      const { error: deleteError } = await supabase
        .from("community_post_votes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", userProfile.id)

      if (deleteError) {
        console.error("Error removing vote:", deleteError)
        return NextResponse.json({ error: "Failed to remove vote" }, { status: 500 })
      }

      // Decrease vote count
      const { error: updateError } = await supabase.rpc('decrement_vote_count', { post_id_input: postId })

      if (updateError) {
        console.error("Error updating vote count:", updateError)
      }

      voted = false
    } else {
      // Add vote
      const { error: insertError } = await supabase
        .from("community_post_votes")
        .insert({
          post_id: postId,
          user_id: userProfile.id
        })

      if (insertError) {
        console.error("Error adding vote:", insertError)
        return NextResponse.json({ error: "Failed to add vote" }, { status: 500 })
      }

      // Increase vote count
      const { error: updateError } = await supabase.rpc('increment_vote_count', { post_id_input: postId })

      if (updateError) {
        console.error("Error updating vote count:", updateError)
      }

      voted = true
    }

    revalidatePath("/community")
    return NextResponse.json({
      success: true,
      voted,
      message: voted ? "Vote added!" : "Vote removed!"
    })
  } catch (error: any) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
