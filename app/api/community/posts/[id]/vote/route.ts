import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user profile
    const { data: profile } = await supabase.from("users").select("id").eq("auth_user_id", user.id).single()

    if (!profile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    const postId = params.id

    // Check if user has already voted
    const { data: existingVote } = await supabase
      .from("community_post_votes")
      .select("*")
      .eq("post_id", postId)
      .eq("user_id", profile.id)
      .single()

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

      // Decrement vote count
      const { error: updateError } = await supabase.rpc("decrement_post_votes", { post_id: postId })

      if (updateError) {
        console.error("Error decrementing vote count:", updateError)
      }

      return NextResponse.json({ voted: false, message: "Vote removed" })
    } else {
      // Add vote
      const { error: insertError } = await supabase
        .from("community_post_votes")
        .insert({ post_id: postId, user_id: profile.id })

      if (insertError) {
        console.error("Error adding vote:", insertError)
        return NextResponse.json({ error: "Failed to add vote" }, { status: 500 })
      }

      // Increment vote count
      const { error: updateError } = await supabase.rpc("increment_post_votes", { post_id: postId })

      if (updateError) {
        console.error("Error incrementing vote count:", updateError)
      }

      return NextResponse.json({ voted: true, message: "Vote added" })
    }
  } catch (error) {
    console.error("Error in POST /api/community/posts/[id]/vote:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
