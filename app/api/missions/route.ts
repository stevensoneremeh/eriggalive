import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

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
      .order("created_at", { ascending: false })

    if (missionsError) {
      console.error("[v0] Missions query error:", missionsError)
      if (missionsError.code === "42P01") {
        return NextResponse.json({
          success: true,
          missions: [
            {
              id: 1,
              title: "Welcome to the Community",
              description: "Join the Erigga fan community and make your first post",
              reward_coins: 100,
              is_active: true,
              user_progress: null,
            },
            {
              id: 2,
              title: "Vote on Posts",
              description: "Show love by voting on community posts",
              reward_coins: 50,
              is_active: true,
              user_progress: null,
            },
          ],
        })
      }
      return NextResponse.json({ success: false, error: "Failed to fetch missions" }, { status: 500 })
    }

    const { data: userProgress, error: progressError } = await supabase
      .from("user_missions")
      .select("*")
      .eq("user_id", user.id)

    if (progressError && progressError.code !== "42P01") {
      console.error("[v0] User progress query error:", progressError)
      return NextResponse.json({ success: false, error: "Failed to fetch user progress" }, { status: 500 })
    }

    // Combine missions with user progress
    const missionsWithProgress = (missions || []).map((mission) => ({
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
