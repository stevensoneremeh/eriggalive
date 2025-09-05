import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      console.error("[v0] Auth error in missions:", authError)
      return NextResponse.json({ success: false, error: "Authentication failed" }, { status: 401 })
    }

    if (!user) {
      console.error("[v0] No user found in missions")
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { data: missions, error: missionsError } = await supabase
      .from("missions")
      .select("*")
      .eq("is_active", true)
      .order("mission_type", { ascending: true })

    if (missionsError) {
      console.error("[v0] Missions query error:", missionsError)
      if (missionsError.code === "42P01") {
        return NextResponse.json({ success: false, error: "Missions table not found" }, { status: 404 })
      }
      return NextResponse.json({ success: false, error: "Failed to fetch missions" }, { status: 500 })
    }

    const { data: userProgress, error: progressError } = await supabase
      .from("user_missions")
      .select("*")
      .eq("user_id", user.id)

    if (progressError) {
      console.error("[v0] User progress query error:", progressError)
      if (progressError.code === "42P01") {
        // Table doesn't exist, return missions without progress
        return NextResponse.json({
          success: true,
          missions: missions.map((mission) => ({ ...mission, user_progress: null })),
        })
      }
      return NextResponse.json({ success: false, error: "Failed to fetch user progress" }, { status: 500 })
    }

    // Combine missions with user progress
    const missionsWithProgress = missions.map((mission) => ({
      ...mission,
      user_progress: userProgress?.find((p) => p.mission_id === mission.id) || null,
    }))

    return NextResponse.json({
      success: true,
      missions: missionsWithProgress,
    })
  } catch (error) {
    console.error("[v0] Unexpected error in missions:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 },
    )
  }
}
