import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    const { data: wallet, error: walletError } = await supabase
      .from("user_wallets")
      .select("*")
      .eq("user_id", user.id)
      .single()

    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("coins")
      .eq("id", user.id)
      .single()

    const { data: membership, error: membershipError } = await supabase
      .from("user_memberships")
      .select("*, membership_tiers(*)")
      .eq("user_id", user.id)
      .single()

    if (walletError && walletError.code !== "PGRST116") {
      console.error("Wallet error:", walletError)
    }

    if (membershipError && membershipError.code !== "PGRST116") {
      console.error("Membership error:", membershipError)
    }

    return NextResponse.json({
      success: true,
      balance: wallet?.coin_balance || profile?.coins || 0,
      walletBalance: wallet?.balance_naira || 0,
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
            total_earned: wallet.total_earned,
            total_spent: wallet.total_spent,
            last_bonus_at: wallet.last_bonus_at,
          }
        : null,
    })
  } catch (error) {
    console.error("Balance API error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
