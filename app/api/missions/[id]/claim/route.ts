
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
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
      // If table doesn't exist, return sample mission for testing
      if (missionError?.code === "42P01") {
        return NextResponse.json({
          success: true,
          pointsEarned: 100,
          coinsEarned: 50,
          message: "Sample mission completed! (Database not set up yet)"
        })
      }
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

    // Get current user profile for coin/point balance
    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select("coins, points")
      .eq("auth_user_id", user.id)
      .single()

    if (profileError) {
      console.error("Profile fetch error:", profileError)
      return NextResponse.json({ success: false, error: "User profile not found" }, { status: 404 })
    }

    // Update user's coins and points
    const newCoins = (userProfile.coins || 0) + (mission.coins_reward || 0)
    const newPoints = (userProfile.points || 0) + (mission.points_reward || 0)

    const { error: updateUserError } = await supabase
      .from("users")
      .update({
        coins: newCoins,
        points: newPoints,
        updated_at: new Date().toISOString()
      })
      .eq("auth_user_id", user.id)

    if (updateUserError) {
      console.error("User update error:", updateUserError)
      return NextResponse.json({ success: false, error: "Failed to update user balance" }, { status: 500 })
    }

    // Mark mission as claimed
    const { error: claimError } = await supabase
      .from("user_missions")
      .update({
        claimed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq("user_id", user.id)
      .eq("mission_id", missionId)

    if (claimError) {
      console.error("Claim error:", claimError)
      return NextResponse.json({ success: false, error: "Failed to claim reward" }, { status: 500 })
    }

    // Create transaction record for coins earned
    if (mission.coins_reward > 0) {
      await supabase.from("coin_transactions").insert({
        user_id: user.id,
        amount: mission.coins_reward,
        transaction_type: "mission_reward",
        description: `Mission completed: ${mission.title}`,
        status: "completed",
        reference: `mission_${missionId}_${Date.now()}`
      })
    }

    return NextResponse.json({
      success: true,
      pointsEarned: mission.points_reward || 0,
      coinsEarned: mission.coins_reward || 0,
      message: `Congratulations! You've earned ${mission.points_reward || 0} points and ${mission.coins_reward || 0} coins!`
    })
  } catch (error) {
    console.error("Error claiming mission reward:", error)
    return NextResponse.json({ success: false, error: "Failed to claim reward" }, { status: 500 })
  }
}
