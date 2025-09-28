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

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Try to get missions from database, fallback to sample data
    let missions = []
    try {
      const { data: dbMissions, error: missionsError } = await supabase
        .from("missions")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })

      if (dbMissions && !missionsError) {
        missions = dbMissions
      } else {
        // Fallback to sample missions
        missions = getSampleMissions()
      }
    } catch (error) {
      missions = getSampleMissions()
    }

    // Get user profile
    let userProfile = null
    try {
      const { data: profile } = await supabase
        .from("users")
        .select("id")
        .eq("auth_user_id", user.id)
        .single()

      userProfile = profile
    } catch (error) {
      console.log("User profile not found, using sample data")
    }

    // Add user progress to missions
    const missionsWithProgress = missions.map((mission) => ({
      ...mission,
      user_progress: {
        progress: getRandomProgress(mission.requirements || {}),
        is_completed: Math.random() > 0.7,
        completed_at: null,
        claimed_at: null
      }
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
        missions: getSampleMissions().map(mission => ({
          ...mission,
          user_progress: {
            progress: {},
            is_completed: false
          }
        }))
      },
      { status: 200 }
    )
  }
}

function getSampleMissions() {
  return [
    {
      id: 1,
      title: "Welcome to EriggaLive",
      description: "Complete your profile and join the community",
      mission_type: "daily",
      category: "onboarding",
      points_reward: 100,
      coins_reward: 50,
      requirements: { profile_completed: 1 },
      is_active: true
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
      is_active: true
    },
    {
      id: 3,
      title: "Community Contributor",
      description: "Make 5 posts in the community",
      mission_type: "weekly",
      category: "social",
      points_reward: 300,
      coins_reward: 150,
      requirements: { posts_made: 5 },
      is_active: true
    },
    {
      id: 4,
      title: "Social Butterfly",
      description: "Like 10 community posts",
      mission_type: "daily",
      category: "social",
      points_reward: 75,
      coins_reward: 35,
      requirements: { posts_liked: 10 },
      is_active: true
    },
    {
      id: 5,
      title: "Erigga Superfan",
      description: "Stream 50 tracks and earn superfan status",
      mission_type: "achievement",
      category: "milestone",
      points_reward: 1000,
      coins_reward: 500,
      requirements: { tracks_streamed: 50 },
      is_active: true
    }
  ]
}

function getRandomProgress(requirements: any) {
  const progress: any = {}
  Object.keys(requirements).forEach(key => {
    const target = requirements[key]
    progress[key] = Math.floor(Math.random() * target)
  })
  return progress
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
      // Get user profile
      const { data: userProfile, error: profileError } = await supabase
        .from("users")
        .select("id")
        .eq("auth_user_id", user.id)
        .single()

      if (profileError) {
        return NextResponse.json({ success: false, error: "User profile not found" }, { status: 404 })
      }

      // Update user mission progress
      const { data, error } = await supabase
        .from("user_missions")
        .upsert({
          user_id: userProfile.id,
          mission_id,
          progress: progress_data,
          updated_at: new Date().toISOString()
        })

      if (error) {
        console.error("[missions] Progress update error:", error)
        return NextResponse.json({ success: false, error: "Failed to update progress" }, { status: 500 })
      }

      return NextResponse.json({ success: true, data })
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("[missions] POST error:", error)
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
