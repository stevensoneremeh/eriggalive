
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
      console.error("[missions] Auth error:", authError)
      return NextResponse.json({ success: false, error: "Authentication failed" }, { status: 401 })
    }

    if (!user) {
      console.error("[missions] No user found")
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Fetch all active missions
    const { data: missions, error: missionsError } = await supabase
      .from("missions")
      .select("*")
      .eq("is_active", true)
      .order("mission_type", { ascending: true })
      .order("created_at", { ascending: false })

    if (missionsError) {
      console.error("[missions] Query error:", missionsError)
      
      // If table doesn't exist, return sample missions
      if (missionsError.code === "42P01") {
        return NextResponse.json({
          success: true,
          missions: [
            {
              id: 1,
              title: "Welcome to EriggaLive",
              description: "Complete your profile and join the community",
              mission_type: "daily",
              category: "onboarding",
              points_reward: 100,
              coins_reward: 50,
              requirements: { profile_completed: 1 },
              is_active: true,
              user_progress: {
                progress: { profile_completed: 0 },
                is_completed: false
              }
            },
            {
              id: 2,
              title: "Stream a Track",
              description: "Listen to any Erigga track in the vault",
              mission_type: "daily",
              category: "engagement",
              points_reward: 50,
              coins_reward: 25,
              requirements: { tracks_streamed: 1 },
              is_active: true,
              user_progress: {
                progress: { tracks_streamed: 0 },
                is_completed: false
              }
            },
            {
              id: 3,
              title: "Community Contributor",
              description: "Make 10 posts in the community",
              mission_type: "weekly",
              category: "social",
              points_reward: 500,
              coins_reward: 200,
              requirements: { posts_made: 10 },
              is_active: true,
              user_progress: {
                progress: { posts_made: 0 },
                is_completed: false
              }
            },
            {
              id: 4,
              title: "Erigga Superfan",
              description: "Stream 100 tracks and earn superfan status",
              mission_type: "achievement",
              category: "milestone",
              points_reward: 2000,
              coins_reward: 1000,
              requirements: { tracks_streamed: 100 },
              is_active: true,
              user_progress: {
                progress: { tracks_streamed: 0 },
                is_completed: false
              }
            },
            {
              id: 5,
              title: "Holiday Special",
              description: "Complete holiday activities during special event",
              mission_type: "special",
              category: "event",
              points_reward: 1000,
              coins_reward: 500,
              requirements: { holiday_activities: 5 },
              is_active: true,
              user_progress: {
                progress: { holiday_activities: 0 },
                is_completed: false
              }
            }
          ],
        })
      }
      return NextResponse.json({ success: false, error: "Failed to fetch missions" }, { status: 500 })
    }

    // Fetch user's mission progress
    const { data: userProgress, error: progressError } = await supabase
      .from("user_missions")
      .select("*")
      .eq("user_id", user.id)

    if (progressError && progressError.code !== "42P01") {
      console.error("[missions] User progress query error:", progressError)
    }

    // Combine missions with user progress
    const missionsWithProgress = (missions || []).map((mission) => ({
      ...mission,
      user_progress: userProgress?.find((p) => p.mission_id === mission.id) || {
        progress: {},
        is_completed: false
      },
    }))

    return NextResponse.json({
      success: true,
      missions: missionsWithProgress,
    })
  } catch (error) {
    console.error("[missions] Unexpected error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: process.env.NODE_ENV === "development" ? (error as Error).message : undefined,
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { action, mission_id, progress_data } = body

    if (action === "update_progress") {
      // Update user mission progress
      const { data: existingProgress } = await supabase
        .from("user_missions")
        .select("*")
        .eq("user_id", user.id)
        .eq("mission_id", mission_id)
        .single()

      if (existingProgress) {
        // Update existing progress
        const { error: updateError } = await supabase
          .from("user_missions")
          .update({
            progress: { ...existingProgress.progress, ...progress_data },
            updated_at: new Date().toISOString()
          })
          .eq("user_id", user.id)
          .eq("mission_id", mission_id)

        if (updateError) {
          return NextResponse.json({ success: false, error: "Failed to update progress" }, { status: 500 })
        }
      } else {
        // Create new progress entry
        const { error: insertError } = await supabase
          .from("user_missions")
          .insert({
            user_id: user.id,
            mission_id,
            progress: progress_data,
            is_completed: false
          })

        if (insertError) {
          return NextResponse.json({ success: false, error: "Failed to create progress" }, { status: 500 })
        }
      }

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("[missions] POST error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
