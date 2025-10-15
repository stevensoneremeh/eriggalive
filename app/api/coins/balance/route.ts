import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user profile with coins balance
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("coins_balance")
      .eq("id", user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    // Get transaction history
    const { data: transactions, error: txError } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10)

    const balanceData = {
      currentBalance: profile.coins_balance || 0,
      transactions: transactions || [],
    }

    return NextResponse.json({
      success: true,
      balance: balanceData,
    })
  } catch (error) {
    console.error("Balance fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}