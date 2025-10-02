
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const supabase = await createClient()

    // Verify admin access
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("users")
      .select("role, tier")
      .eq("auth_user_id", user.id)
      .single()

    const isAdmin =
      profile?.role === "admin" ||
      profile?.role === "super_admin" ||
      profile?.tier === "blood" ||
      profile?.tier === "blood_brotherhood"

    if (!isAdmin) {
      return NextResponse.json({ error: "Insufficient privileges" }, { status: 403 })
    }

    // Fetch real statistics
    const [usersCount, transactionsCount, eventsCount, withdrawalsCount] = await Promise.all([
      supabase.from("users").select("*", { count: "exact", head: true }),
      supabase.from("coin_transactions").select("*", { count: "exact", head: true }),
      supabase.from("events").select("*", { count: "exact", head: true }),
      supabase.from("withdrawals").select("*", { count: "exact", head: true }),
    ])

    // Calculate revenue
    const { data: completedTransactions } = await supabase
      .from("coin_transactions")
      .select("amount")
      .eq("transaction_type", "purchase")
      .eq("status", "completed")

    const totalRevenue = completedTransactions?.reduce((sum, tx) => sum + tx.amount, 0) || 0

    // Get pending withdrawals
    const { data: pendingWithdrawals } = await supabase
      .from("withdrawals")
      .select("amount_naira")
      .eq("status", "pending")

    const pendingAmount = pendingWithdrawals?.reduce((sum, w) => sum + (w.amount_naira || 0), 0) || 0

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers: usersCount.count || 0,
        totalTransactions: transactionsCount.count || 0,
        totalEvents: eventsCount.count || 0,
        totalWithdrawals: withdrawalsCount.count || 0,
        totalRevenue,
        pendingWithdrawalAmount: pendingAmount,
      },
    })
  } catch (error) {
    console.error("Dashboard stats error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
