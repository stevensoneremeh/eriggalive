import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const FEATURE_UI_FIXES_V1 = process.env.NEXT_PUBLIC_FEATURE_UI_FIXES_V1 === "true"

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

    // Get user profile with current coin balance
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("id, coins")
      .eq("auth_user_id", user.id)
      .single()

    if (profileError) {
      console.error("Profile fetch error:", profileError)
      return NextResponse.json(
        {
          success: false,
          error: "User profile not found",
          code: "PROFILE_ERROR",
        },
        { status: 404 },
      )
    }

    let walletBalance = 0

    // Try to get wallet balance if feature is enabled
    if (FEATURE_UI_FIXES_V1) {
      try {
        const { data: wallet } = await supabase
          .from("user_wallets")
          .select("coin_balance")
          .eq("user_id", user.id)
          .single()

        walletBalance = wallet?.coin_balance || 0
      } catch (error) {
        console.log("Wallet table not available, using profile coins")
        walletBalance = profile.coins || 0
      }
    }

    return NextResponse.json({
      success: true,
      balance: profile.coins || 0,
      walletBalance: walletBalance,
      userId: user.id,
      profileId: profile.id,
    })
  } catch (error) {
    console.error("Balance API error:", error)
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
