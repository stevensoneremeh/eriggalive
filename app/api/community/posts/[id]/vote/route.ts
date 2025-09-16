import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()

    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const postId = Number.parseInt(params.id)

    if (isNaN(postId)) {
      return NextResponse.json({ error: "Invalid post ID" }, { status: 400 })
    }

    // Check if user already voted
    const { data: existingVote } = await supabase
      .from("community_post_votes")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", user.id)
      .single()

    if (existingVote) {
      // Remove vote
      const { error: deleteError } = await supabase
        .from("community_post_votes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", user.id)

      if (deleteError) throw deleteError

      // Decrement vote count
      const { error: updateError } = await supabase
        .from("community_posts")
        .update({ vote_count: supabase.raw("vote_count - 1") })
        .eq("id", postId)

      if (updateError) throw updateError

      return NextResponse.json({ voted: false, message: "Vote removed" })
    } else {
      // Add vote
      const { error: insertError } = await supabase
        .from("community_post_votes")
        .insert({ post_id: postId, user_id: user.id })

      if (insertError) throw insertError

      // Increment vote count
      const { error: updateError } = await supabase
        .from("community_posts")
        .update({ vote_count: supabase.raw("vote_count + 1") })
        .eq("id", postId)

      if (updateError) throw updateError

      return NextResponse.json({ voted: true, message: "Vote added" })
    }
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
