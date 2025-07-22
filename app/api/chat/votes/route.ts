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
    const { message_id, vote_type } = body

    if (!message_id || !["up", "down"].includes(vote_type)) {
      return NextResponse.json({ error: "Invalid vote data" }, { status: 400 })
    }

    // Get user profile
    const { data: profile } = await supabase.from("users").select("id").eq("auth_user_id", user.id).single()

    if (!profile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    // Check if user already voted
    const { data: existingVote } = await supabase
      .from("chat_message_votes")
      .select("*")
      .eq("message_id", message_id)
      .eq("user_id", profile.id)
      .single()

    let voted = false
    let voteCount = 0

    if (existingVote) {
      if (existingVote.vote_type === vote_type) {
        // Remove vote if same type
        await supabase.from("chat_message_votes").delete().eq("message_id", message_id).eq("user_id", profile.id)
        voted = false
      } else {
        // Update vote type
        await supabase
          .from("chat_message_votes")
          .update({ vote_type })
          .eq("message_id", message_id)
          .eq("user_id", profile.id)
        voted = true
      }
    } else {
      // Create new vote
      await supabase.from("chat_message_votes").insert({
        message_id,
        user_id: profile.id,
        vote_type,
      })
      voted = true
    }

    // Get updated vote count
    const { data: message } = await supabase
      .from("chat_messages")
      .select("vote_count, room_id")
      .eq("id", message_id)
      .single()

    if (message) {
      voteCount = message.vote_count

      // Publish real-time event for vote update
      try {
        await publishEvent(ABLY_CHANNELS.CHAT_VOTES(message_id), "vote:updated", {
          message_id,
          vote_count: voteCount,
          voted,
          user_id: profile.id,
        })
      } catch (ablyError) {
        console.error("Failed to publish vote event:", ablyError)
        // Don't fail the request if real-time publishing fails
      }
    }

    return NextResponse.json({
      success: true,
      voted,
      vote_count: voteCount,
    })
  } catch (error) {
    console.error("Error in vote API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
