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

    // Get user's referral data
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("referral_code, referral_count")
      .eq("id", user.id)
      .single()

    if (userError) {
      throw userError
    }

    return NextResponse.json({
      success: true,
      referralCode: userData.referral_code,
      referralCount: userData.referral_count || 0,
    })
  } catch (error) {
    console.error("Error fetching referral data:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch referral data" }, { status: 500 })
  }
}
