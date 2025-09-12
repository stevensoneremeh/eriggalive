import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const body = await request.json()
    const { postId, coinAmount = 100 } = body

    if (!postId) {
      return NextResponse.json({ error: "Post ID is required" }, { status: 400 })
    }

    // Get internal user ID - try both table structures
    let internalUserId = null
    const { data: userProfile } = await supabase
      .from("user_profiles")
      .select("id")
      .eq("id", user.id)
      .single()

    if (userProfile) {
      internalUserId = userProfile.id
    } else {
      const { data: userData } = await supabase
        .from("users")
        .select("id")
        .eq("auth_user_id", user.id)
        .single()
      
      if (userData) {
        internalUserId = userData.id
      }
    }

    if (!internalUserId) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    // Try different RPC function names for compatibility
    let data, error
    
    // First try handle_post_vote_safe
    const result1 = await supabase.rpc("handle_post_vote_safe", {
      p_post_id: postId,
      p_voter_id: internalUserId,
      p_coin_amount: coinAmount,
    })
    
    if (result1.error && result1.error.code === "42883") {
      // Function doesn't exist, try handle_post_vote
      const result2 = await supabase.rpc("handle_post_vote", {
        p_post_id: postId,
        p_user_id: internalUserId,
        p_coin_amount: coinAmount,
      })
      data = result2.data
      error = result2.error
    } else {
      data = result1.data
      error = result1.error
    }

    if (error) {
      console.error("Vote error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Normalize response format
    const response = {
      success: true,
      voted: data?.voted || data?.action === 'added',
      message: data?.message || (data?.voted ? "Vote added!" : "Vote removed!")
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
