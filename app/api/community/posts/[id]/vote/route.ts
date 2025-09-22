
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

    // Get or create user profile
    let { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select("id")
      .eq("auth_user_id", user.id)
      .single()

    if (profileError || !userProfile) {
      console.log("User profile not found for voting, creating profile")
      
      // Create user profile if it doesn't exist
      const { data: newUserProfile, error: createError } = await supabase
        .from('users')
        .insert({
          auth_user_id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          username: user.user_metadata?.username || user.email?.split('@')[0] || 'user',
          tier: 'erigga_citizen',
          coins: 100,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select("id")
        .single()

      if (createError || !newUserProfile) {
        console.error("Failed to create user profile for voting:", createError)
        return NextResponse.json({ success: false, error: "Unable to create user profile" }, { status: 500 })
      }
      
      userProfile = newUserProfile
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
