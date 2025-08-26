import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    const missionId = Number.parseInt(params.id)

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Get mission details
    const { data: mission, error: missionError } = await supabase
      .from("missions")
      .select("*")
      .eq("id", missionId)
      .single()

    if (missionError || !mission) {
      return NextResponse.json({ success: false, error: "Mission not found" }, { status: 404 })
    }

    // Get user's mission progress
    const { data: userMission, error: progressError } = await supabase
      .from("user_missions")
      .select("*")
      .eq("user_id", user.id)
      .eq("mission_id", missionId)
      .single()

    if (progressError || !userMission) {
      return NextResponse.json({ success: false, error: "Mission progress not found" }, { status: 404 })
    }

    // Check if mission is completed and not already claimed
    if (!userMission.is_completed) {
      return NextResponse.json({ success: false, error: "Mission not completed" }, { status: 400 })
    }

    if (userMission.claimed_at) {
      return NextResponse.json({ success: false, error: "Reward already claimed" }, { status: 400 })
    }

    // Update user's coins and points
    const { error: updateUserError } = await supabase
      .from("users")
      .update({
        coins: supabase.raw(`coins + ${mission.coins_reward}`),
        points: supabase.raw(`points + ${mission.points_reward}`),
      })
      .eq("id", user.id)

    if (updateUserError) {
      throw updateUserError
    }

    // Mark mission as claimed
    const { error: claimError } = await supabase
      .from("user_missions")
      .update({
        claimed_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .eq("mission_id", missionId)

    if (claimError) {
      throw claimError
    }

    return NextResponse.json({
      success: true,
      pointsEarned: mission.points_reward,
      coinsEarned: mission.coins_reward,
    })
  } catch (error) {
    console.error("Error claiming mission reward:", error)
    return NextResponse.json({ success: false, error: "Failed to claim reward" }, { status: 500 })
  }
}
