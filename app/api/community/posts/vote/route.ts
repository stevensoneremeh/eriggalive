import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, coin_balance")
      .eq("auth_user_id", user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    const { postId, postCreatorId } = await request.json()

    if (!postId || !postCreatorId) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    // Check if user has already voted
    const { data: existingVote } = await supabase
      .from("community_post_votes")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", userData.id)
      .single()

    if (existingVote) {
      // Remove vote
      const { error: deleteError } = await supabase
        .from("community_post_votes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", userData.id)

      if (deleteError) {
        return NextResponse.json({ success: false, error: "Failed to remove vote" }, { status: 500 })
      }

      // Decrease vote count
      const { error: updateError } = await supabase
        .from("community_posts")
        .update({ vote_count: supabase.raw("vote_count - 1") })
        .eq("id", postId)

      if (updateError) {
        return NextResponse.json({ success: false, error: "Failed to update vote count" }, { status: 500 })
      }

      return NextResponse.json({ success: true, voted: false })
    } else {
      // Check if user has enough coins
      if (userData.coin_balance < 1) {
        return NextResponse.json({ success: false, error: "Insufficient coins to vote" }, { status: 400 })
      }

      // Add vote
      const { error: insertError } = await supabase.from("community_post_votes").insert({
        post_id: postId,
        user_id: userData.id,
      })

      if (insertError) {
        return NextResponse.json({ success: false, error: "Failed to add vote" }, { status: 500 })
      }

      // Increase vote count and deduct coin
      const { error: updateError } = await supabase
        .from("community_posts")
        .update({ vote_count: supabase.raw("vote_count + 1") })
        .eq("id", postId)

      if (updateError) {
        return NextResponse.json({ success: false, error: "Failed to update vote count" }, { status: 500 })
      }

      // Deduct coin from voter
      const { error: coinError } = await supabase
        .from("users")
        .update({ coin_balance: supabase.raw("coin_balance - 1") })
        .eq("id", userData.id)

      if (coinError) {
        return NextResponse.json({ success: false, error: "Failed to deduct coin" }, { status: 500 })
      }

      // Add coin to post creator
      const { error: rewardError } = await supabase
        .from("users")
        .update({ coin_balance: supabase.raw("coin_balance + 1") })
        .eq("id", postCreatorId)

      if (rewardError) {
        console.error("Failed to reward post creator:", rewardError)
      }

      return NextResponse.json({ success: true, voted: true })
    }
  } catch (error) {
    console.error("Vote API error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
