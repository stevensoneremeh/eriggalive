import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const FEATURE_UI_FIXES_V1 = process.env.NEXT_PUBLIC_FEATURE_UI_FIXES_V1 === "true"

// Mock missions data for when the feature is not fully implemented
const mockMissions = [
  {
    id: "daily-login",
    title: "Daily Login",
    description: "Log in to the platform",
    reward_coins: 10,
    reward_points: 5,
    type: "daily",
    status: "completed",
    progress: 1,
    target: 1,
  },
  {
    id: "community-post",
    title: "Share Your Thoughts",
    description: "Create a post in the community",
    reward_coins: 25,
    reward_points: 15,
    type: "daily",
    status: "available",
    progress: 0,
    target: 1,
  },
  {
    id: "vault-visit",
    title: "Explore the Vault",
    description: "Visit the media vault",
    reward_coins: 15,
    reward_points: 10,
    type: "daily",
    status: "available",
    progress: 0,
    target: 1,
  },
]

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required",
          code: "AUTH_ERROR",
        },
        { status: 401 },
      )
    }

    // Try to get missions from database
    try {
      const { data: missions, error: missionsError } = await supabase
        .from("missions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (missionsError) {
        console.log("Missions table not available, using mock data")
        return NextResponse.json({
          success: true,
          missions: mockMissions,
          isMockData: true,
        })
      }

      return NextResponse.json({
        success: true,
        missions: missions || mockMissions,
        isMockData: !missions || missions.length === 0,
      })
    } catch (error) {
      console.log("Missions feature not implemented, using mock data")
      return NextResponse.json({
        success: true,
        missions: mockMissions,
        isMockData: true,
      })
    }
  } catch (error) {
    console.error("Missions API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        code: "INTERNAL_ERROR",
      },
      { status: 500 },
    )
  }
}

// Handle unsupported methods
export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: "Method not allowed",
      code: "METHOD_NOT_ALLOWED",
    },
    { status: 405 },
  )
}

export async function PUT() {
  return NextResponse.json(
    {
      success: false,
      error: "Method not allowed",
      code: "METHOD_NOT_ALLOWED",
    },
    { status: 405 },
  )
}

export async function DELETE() {
  return NextResponse.json(
    {
      success: false,
      error: "Method not allowed",
      code: "METHOD_NOT_ALLOWED",
    },
    { status: 405 },
  )
}
