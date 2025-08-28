import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const FEATURE_UI_FIXES_V1 = process.env.NEXT_PUBLIC_FEATURE_UI_FIXES_V1 === "true"

// Mock referrals data for when the feature is not fully implemented
const mockReferrals = {
  totalReferrals: 0,
  totalEarnings: 0,
  referralCode: "ERIGGA2025",
  referrals: [],
}

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

    // Try to get referrals from database
    try {
      const { data: referrals, error: referralsError } = await supabase
        .from("referrals")
        .select("*")
        .eq("referrer_id", user.id)
        .order("created_at", { ascending: false })

      if (referralsError) {
        console.log("Referrals table not available, using mock data")
        return NextResponse.json({
          success: true,
          data: mockReferrals,
          isMockData: true,
        })
      }

      // Calculate totals
      const totalReferrals = referrals?.length || 0
      const totalEarnings = referrals?.reduce((sum, ref) => sum + (ref.reward_amount || 0), 0) || 0

      return NextResponse.json({
        success: true,
        data: {
          totalReferrals,
          totalEarnings,
          referralCode: `ERIGGA${user.id.slice(-4).toUpperCase()}`,
          referrals: referrals || [],
        },
        isMockData: false,
      })
    } catch (error) {
      console.log("Referrals feature not implemented, using mock data")
      return NextResponse.json({
        success: true,
        data: mockReferrals,
        isMockData: true,
      })
    }
  } catch (error) {
    console.error("Referrals API error:", error)
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
