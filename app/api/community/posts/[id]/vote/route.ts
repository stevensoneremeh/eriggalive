
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

    // Check if user already voted
    const { data: existingVote } = await supabase
      .from('community_post_votes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .single()

    if (existingVote) {
      // Remove vote
      await supabase
        .from('community_post_votes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id)

      // Decrement vote count
      await supabase.rpc('decrement_post_vote_count', { post_id: postId })

      // Get updated count
      const { data: post } = await supabase
        .from('community_posts')
        .select('vote_count')
        .eq('id', postId)
        .single()

      return NextResponse.json({
        success: true,
        voted: false,
        voteCount: post?.vote_count || 0
      })
    } else {
      // Add vote
      await supabase
        .from('community_post_votes')
        .insert({ post_id: postId, user_id: user.id })

      // Increment vote count
      await supabase.rpc('increment_post_vote_count', { post_id: postId })

      // Get updated count
      const { data: post } = await supabase
        .from('community_posts')
        .select('vote_count')
        .eq('id', postId)
        .single()

      return NextResponse.json({
        success: true,
        voted: true,
        voteCount: post?.vote_count || 1
      })
    }
  } catch (error) {
    console.error("Error toggling vote:", error)
    return NextResponse.json({ success: false, error: "Failed to toggle vote" }, { status: 500 })
  }
}
