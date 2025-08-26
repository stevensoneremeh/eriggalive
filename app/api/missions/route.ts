import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Get all active missions
    const { data: missions, error: missionsError } = await supabase
      .from("missions")
      .select("*")
      .eq("is_active", true)
      .order("mission_type", { ascending: true })

    if (missionsError) {
      throw missionsError
    }

    // Get user's mission progress
    const { data: userProgress, error: progressError } = await supabase
      .from("user_missions")
      .select("*")
      .eq("user_id", user.id)

    if (progressError) {
      throw progressError
    }

    // Combine missions with user progress
    const missionsWithProgress = missions.map((mission) => ({
      ...mission,
      user_progress: userProgress.find((p) => p.mission_id === mission.id),
    }))

    return NextResponse.json({
      success: true,
      missions: missionsWithProgress,
    })
  } catch (error) {
    console.error("Error fetching missions:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch missions" }, { status: 500 })
  }
}
