import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

async function verifyUser(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { error: "Authentication required", user: null, profile: null }
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    if (profileError || !profile) {
      return { error: "User profile not found", user: null, profile: null }
    }

    return { user, profile, error: null }
  } catch (error) {
    console.error("Authentication error:", error)
    return { error: "Authentication failed", user: null, profile: null }
  }
}

export async function GET(request: NextRequest) {
  try {
    const { user, profile, error: authError } = await verifyUser(request)
    if (authError || !user || !profile) {
      return NextResponse.json({ success: false, error: authError || "Unauthorized" }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      balance: {
        coins_balance: profile.coins_balance || 0,
        wallet_balance: profile.wallet_balance || 0,
        membership_tier: profile.membership_tier || "free",
        membership_expires_at: profile.membership_expires_at,
        total_spent: profile.total_spent || 0,
      },
      user: {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        membership_tier: profile.membership_tier,
      },
    })
  } catch (error) {
    console.error("Balance API error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function POST() {
  return NextResponse.json({ success: false, error: "Method not allowed" }, { status: 405 })
}
