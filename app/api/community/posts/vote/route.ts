import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { publishEvent, ABLY_CHANNELS } from "@/lib/ably"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { postId, voteType } = body

    if (!postId || !["up", "down"].includes(voteType)) {
      return NextResponse.json({ error: "Invalid vote data" }, { status: 400 })
    }

    // Check if user already voted
    const { data: existingVote } = await supabase
      .from("community_post_votes")
      .select("*")
      .eq("post_id", postId)
      .eq("user_id", user.id)
      .single()

    let voted = false
    let voteCount = 0

    if (existingVote) {
      if (existingVote.vote_type === voteType) {
        // Remove vote if same type
        await supabase.from("community_post_votes").delete().eq("post_id", postId).eq("user_id", user.id)
        voted = false
      } else {
        // Update vote type
        await supabase
          .from("community_post_votes")
          .update({ vote_type: voteType })
          .eq("post_id", postId)
          .eq("user_id", user.id)
        voted = true
      }
    } else {
      // Create new vote
      await supabase.from("community_post_votes").insert({
        post_id: postId,
        user_id: user.id,
        vote_type: voteType,
      })
      voted = true
    }

    // Get updated vote count
    const { data: voteCountData } = await supabase
      .from("community_post_votes")
      .select("vote_type")
      .eq("post_id", postId)

    if (voteCountData) {
      const upVotes = voteCountData.filter((v) => v.vote_type === "up").length
      const downVotes = voteCountData.filter((v) => v.vote_type === "down").length
      voteCount = upVotes - downVotes
    }

    // Publish real-time event for vote update
    try {
      publishEvent(ABLY_CHANNELS.POST_VOTES(postId), "post:voted", {
        postId,
        voteCount,
        voted,
        userId: Number.parseInt(user.id),
      })
    } catch (ablyError) {
      console.error("Failed to publish vote event:", ablyError)
      // Don't fail the request if real-time publishing fails
    }

    return NextResponse.json({
      success: true,
      voted,
      voteCount,
    })
  } catch (error) {
    console.error("Error in vote API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
