import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get wallet with recent transactions
    const { data: wallet, error: walletError } = await supabase
      .from("wallets")
      .select(`
        *,
        wallet_ledger (
          id,
          type,
          amount_coins,
          reason,
          ref_id,
          created_at
        )
      `)
      .eq("user_id", user.id)
      .single()

    if (walletError) {
      console.error("Wallet fetch error:", walletError)
      return NextResponse.json({ error: "Failed to fetch wallet" }, { status: 500 })
    }

    // Sort transactions by date (newest first)
    const transactions =
      wallet.wallet_ledger?.sort(
        (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      ) || []

    return NextResponse.json({
      success: true,
      wallet: {
        balance_coins: wallet.balance_coins,
        transactions: transactions.slice(0, 20), // Last 20 transactions
      },
    })
  } catch (error) {
    console.error("Balance API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
