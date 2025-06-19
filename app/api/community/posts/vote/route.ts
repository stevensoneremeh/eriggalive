import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

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
    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select("*")
      .eq("auth_user_id", user.id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json({ success: false, error: "User profile not found" }, { status: 404 })
    }

    const { postId, postCreatorId } = await request.json()

    if (!postId || !postCreatorId) {
      return NextResponse.json({ success: false, error: "Post ID and creator ID are required" }, { status: 400 })
    }

    // Check if user is trying to vote on their own post
    if (postCreatorId === userProfile.id) {
      return NextResponse.json({ success: false, error: "You cannot vote on your own post" }, { status: 400 })
    }

    // Check if user has enough coins
    if (userProfile.coins < 100) {
      return NextResponse.json({ success: false, error: "Insufficient coins to vote" }, { status: 400 })
    }

    // Get post creator's auth_user_id
    const { data: postCreator, error: creatorError } = await supabase
      .from("users")
      .select("auth_user_id")
      .eq("id", postCreatorId)
      .single()

    if (creatorError || !postCreator) {
      return NextResponse.json({ success: false, error: "Post creator not found" }, { status: 404 })
    }

    // Call the voting function
    const { data, error } = await supabase.rpc("handle_post_vote", {
      p_post_id: postId,
      p_voter_auth_id: user.id,
      p_post_creator_auth_id: postCreator.auth_user_id,
      p_coin_amount: 100,
    })

    if (error) {
      console.error("Vote error:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      voted: data,
      message: data ? "Vote added successfully!" : "Vote removed successfully!",
    })
  } catch (error: any) {
    console.error("API error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
