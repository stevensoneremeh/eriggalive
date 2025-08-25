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

    const { data: wallet, error: walletError } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", user.id)
      .single()

    const { data: membership, error: membershipError } = await supabase
      .from("memberships")
      .select("*, membership_tiers(*)")
      .eq("user_id", user.id)
      .single()

    return {
      user,
      wallet: wallet || { balance: 0 },
      membership: membership || { tier_id: "FREE" },
      error: null,
    }
  } catch (error) {
    console.error("Authentication error:", error)
    return { error: "Authentication failed", user: null, wallet: null, membership: null }
  }
}

export async function GET(request: NextRequest) {
  try {
    const { user, wallet, membership, error: authError } = await verifyUser(request)
    if (authError || !user) {
      return NextResponse.json({ success: false, error: authError || "Unauthorized" }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      balance: wallet?.balance || 0,
      membership: {
        tier: membership?.tier_id || "FREE",
        label: membership?.membership_tiers?.label || "ECor Erigga Citizen",
        expires_at: membership?.expires_at,
        status: membership?.status || "active",
      },
      user: {
        id: user.id,
        email: user.email,
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
