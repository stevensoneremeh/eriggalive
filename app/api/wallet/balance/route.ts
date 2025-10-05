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

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, coins, tier")
      .eq("auth_user_id", user.id)
      .single()

    if (userError) {
      console.error("User data error:", userError)
      return NextResponse.json({ success: false, error: "User data not found" }, { status: 404 })
    }

    // Get user wallet data
    const { data: wallet, error: walletError } = await supabase
      .from("user_wallets")
      .select("*")
      .eq("user_id", userData.id)
      .single()

    // Get user membership data
    const { data: membership, error: membershipError } = await supabase
      .from("user_memberships")
      .select("*, membership_tiers(*)")
      .eq("user_id", userData.id)
      .single()

    if (walletError && walletError.code !== "PGRST116") {
      console.error("Wallet error:", walletError)
    }

    if (membershipError && membershipError.code !== "PGRST116") {
      console.error("Membership error:", membershipError)
    }

    const coinBalance = userData.coins || 0
    const walletCoinBalance = wallet?.coin_balance || 0

    if (wallet && Math.abs(coinBalance - walletCoinBalance) > 0) {
      console.log(`Syncing wallet balance: users.coins=${coinBalance}, wallet.coin_balance=${walletCoinBalance}`)
      await supabase
        .from("user_wallets")
        .update({
          coin_balance: coinBalance,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userData.id)
    }

    return NextResponse.json({
      success: true,
      balance: coinBalance,
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
            total_earned: wallet.total_earned,
            total_spent: wallet.total_spent,
            last_bonus_at: wallet.last_bonus_at,
            synced_balance: coinBalance, // Include synced balance for debugging
          }
        : null,
    })
  } catch (error) {
    console.error("Balance API error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
