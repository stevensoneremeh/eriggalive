import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("id, created_at")
      .eq("auth_user_id", user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    // Return default stats for now
    const stats = {
      totalPosts: 0,
      totalVotes: 0,
      totalComments: 0,
      coinsEarned: 100, // Default welcome bonus
      coinsSpent: 0,
      joinedDate: profile.created_at || new Date().toISOString(),
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("User stats API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
