import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    // Get authenticated user with proper error handling
    let user = null
    try {
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError) {
        console.error("Auth error:", authError)
        return NextResponse.json({ success: false, error: "Authentication failed" }, { status: 401 })
      }

      user = authUser
    } catch (error) {
      console.error("Failed to get user:", error)
      return NextResponse.json({ success: false, error: "Authentication service unavailable" }, { status: 503 })
    }

    if (!user) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    // Get user wallet data with error handling
    let wallet = null
    try {
      const { data: walletData, error: walletError } = await supabase
        .from("user_wallets")
        .select("*")
        .eq("user_id", user.id)
        .single()

      if (walletError && walletError.code !== "PGRST116") {
        console.error("Wallet error:", walletError)
      } else {
        wallet = walletData
      }
    } catch (error) {
      console.error("Failed to fetch wallet:", error)
    }

    // Get user membership data with error handling
    let membership = null
    try {
      const { data: membershipData, error: membershipError } = await supabase
        .from("user_memberships")
        .select("*, membership_tiers(*)")
        .eq("user_id", user.id)
        .single()

      if (membershipError && membershipError.code !== "PGRST116") {
        console.error("Membership error:", membershipError)
      } else {
        membership = membershipData
      }
    } catch (error) {
      console.error("Failed to fetch membership:", error)
    }

    return NextResponse.json({
      success: true,
      balance: wallet?.coin_balance || 0,
      walletBalance: 0, // Placeholder for future wallet balance feature
      membership: membership
        ? {
            tier: membership.tier_id,
            status: membership.status,
            expires_at: membership.expires_at,
            tier_info: membership.membership_tiers,
          }
        : null,
      wallet_info: wallet
        ? {
            total_earned: wallet.total_earned || 0,
            total_spent: wallet.total_spent || 0,
            last_bonus_at: wallet.last_bonus_at,
          }
        : null,
    })
  } catch (error) {
    console.error("Balance API error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
