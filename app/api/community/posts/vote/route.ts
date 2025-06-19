import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

const VOTE_COIN_AMOUNT = 100

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
    const { data: voterProfile, error: profileError } = await supabase
      .from("users")
      .select("*")
      .eq("auth_user_id", user.id)
      .single()

    if (profileError || !voterProfile) {
      return NextResponse.json({ success: false, error: "User profile not found" }, { status: 404 })
    }

    const { postId, postCreatorId } = await request.json()

    if (!postId || !postCreatorId) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    // Check if trying to vote on own post
    const { data: postData } = await supabase.from("community_posts").select("user_id").eq("id", postId).single()

    if (postData && postData.user_id === voterProfile.id) {
      return NextResponse.json({
        success: false,
        error: "You cannot vote on your own post.",
        code: "SELF_VOTE",
      })
    }

    // Check if user has enough coins
    if (voterProfile.coins < VOTE_COIN_AMOUNT) {
      return NextResponse.json({
        success: false,
        error: "Not enough Erigga Coins to vote.",
        code: "INSUFFICIENT_FUNDS",
      })
    }

    // Check if user has already voted
    const { data: existingVote } = await supabase
      .from("community_post_votes")
      .select("id")
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
        return NextResponse.json({ success: false, error: deleteError.message }, { status: 500 })
      }

      // Refund coins to voter
      await supabase
        .from("users")
        .update({ coins: voterProfile.coins + VOTE_COIN_AMOUNT })
        .eq("id", voterProfile.id)

      // Remove coins from post creator
      const { data: creatorData } = await supabase.from("users").select("coins").eq("id", postCreatorId).single()
      if (creatorData) {
        await supabase
          .from("users")
          .update({ coins: Math.max(0, creatorData.coins - VOTE_COIN_AMOUNT) })
          .eq("id", postCreatorId)
      }

      // Update post vote count
      await supabase.rpc("decrement_post_votes", { post_id: postId })

      return NextResponse.json({
        success: true,
        voted: false,
        message: `Vote removed! ${VOTE_COIN_AMOUNT} coins refunded.`,
      })
    } else {
      // Add vote
      const { error: insertError } = await supabase
        .from("community_post_votes")
        .insert({ post_id: postId, user_id: voterProfile.id })

      if (insertError) {
        return NextResponse.json({ success: false, error: insertError.message }, { status: 500 })
      }

      // Transfer coins from voter to post creator
      await supabase
        .from("users")
        .update({ coins: voterProfile.coins - VOTE_COIN_AMOUNT })
        .eq("id", voterProfile.id)

      const { data: creatorData } = await supabase.from("users").select("coins").eq("id", postCreatorId).single()
      if (creatorData) {
        await supabase
          .from("users")
          .update({ coins: creatorData.coins + VOTE_COIN_AMOUNT })
          .eq("id", postCreatorId)
      }

      // Update post vote count
      await supabase.rpc("increment_post_votes", { post_id: postId })

      return NextResponse.json({
        success: true,
        voted: true,
        message: `Voted successfully! ${VOTE_COIN_AMOUNT} coins transferred.`,
      })
    }
  } catch (error: any) {
    console.error("Vote API error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
