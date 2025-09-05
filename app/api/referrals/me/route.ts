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

    if (authError) {
      console.error("[v0] Auth error in referrals/me:", authError)
      return NextResponse.json({ success: false, error: "Authentication failed" }, { status: 401 })
    }

    if (!user) {
      console.error("[v0] No user found in referrals/me")
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Get user's referral data
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("referral_code, referral_count")
      .eq("id", user.id)
      .single()

    if (userError) {
      console.error("[v0] Database error in referrals/me:", userError)
      if (userError.code === "PGRST116") {
        return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
      }
      return NextResponse.json({ success: false, error: "Database query failed" }, { status: 500 })
    }

    if (!userData) {
      console.error("[v0] No user data found for ID:", user.id)
      return NextResponse.json({ success: false, error: "User data not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      referralCode: userData.referral_code,
      referralCount: userData.referral_count || 0,
    })
  } catch (error) {
    console.error("[v0] Unexpected error in referrals/me:", error)
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
