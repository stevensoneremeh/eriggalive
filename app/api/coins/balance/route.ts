import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabase } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabase()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user profile with current coin balance
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("coins_balance")
      .eq("user_id", user.id)
      .single()

    if (profileError) {
      console.error("Profile fetch error:", profileError)
      return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 })
    }

    return NextResponse.json({
      balance: profile?.coins_balance || 0,
      success: true,
    })
  } catch (error) {
    console.error("Balance fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
