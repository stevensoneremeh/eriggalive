import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

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

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, username, referral_code, referral_count")
      .eq("auth_user_id", user.id)
      .single()

    if (userError) {
      console.error("[v0] Database error in referrals/me:", userError)
      if (userError.code === "42P01") {
        return NextResponse.json({
          success: true,
          referralCode: `REF${user.id.slice(0, 8).toUpperCase()}`,
          referralCount: 0,
        })
      }
      if (userError.code === "PGRST116") {
        const { data: newUser, error: createError } = await supabase
          .from("users")
          .insert({
            auth_user_id: user.id,
            email: user.email,
            username: user.email?.split("@")[0] || "user",
            referral_code: `REF${user.id.slice(0, 8).toUpperCase()}`,
            referral_count: 0,
          })
          .select()
          .single()

        if (createError) {
          console.error("[v0] Error creating user:", createError)
          return NextResponse.json({
            success: true,
            referralCode: `REF${user.id.slice(0, 8).toUpperCase()}`,
            referralCount: 0,
          })
        }

        return NextResponse.json({
          success: true,
          referralCode: newUser.referral_code,
          referralCount: newUser.referral_count || 0,
        })
      }
      return NextResponse.json({ success: false, error: "Database query failed" }, { status: 500 })
    }

    if (!userData) {
      console.error("[v0] No user data found for ID:", user.id)
      return NextResponse.json({ success: false, error: "User data not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      referralCode: userData.referral_code || `REF${user.id.slice(0, 8).toUpperCase()}`,
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
