
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"
export const revalidate = 30 // Cache for 30 seconds

// In-memory cache to prevent excessive requests
let cachedStats: any = null
let cacheTimestamp: number = 0
const CACHE_DURATION = 30000 // 30 seconds

export async function GET() {
  try {
    // Return cached data if available and fresh
    const now = Date.now()
    if (cachedStats && (now - cacheTimestamp) < CACHE_DURATION) {
      return NextResponse.json({
        success: true,
        stats: cachedStats,
        cached: true,
      }, {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        }
      })
    }

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
      user.email === "info@eriggalive.com" ||
      profile?.role === "admin" ||
      profile?.role === "super_admin" ||
      profile?.tier === "enterprise"

    if (!isAdmin) {
      return NextResponse.json({ error: "Insufficient privileges" }, { status: 403 })
    }

    // Fetch statistics with optimized queries (count only, no data)
    const [usersCount, transactionsCount, eventsCount, withdrawalsCount] = await Promise.all([
      supabase.from("users").select("*", { count: "exact", head: true }),
      supabase.from("coin_transactions").select("*", { count: "exact", head: true }),
      supabase.from("events").select("*", { count: "exact", head: true }),
      supabase.from("withdrawals").select("*", { count: "exact", head: true }),
    ])

    // Calculate revenue (use aggregation if available)
    const { data: revenueData } = await supabase
      .from("coin_transactions")
      .select("amount")
      .eq("transaction_type", "purchase")
      .eq("status", "completed")
      .limit(1000) // Limit to prevent excessive data transfer

    const totalRevenue = revenueData?.reduce((sum: number, tx: any) => sum + (tx.amount || 0), 0) || 0

    // Get pending withdrawals
    const { data: pendingWithdrawals } = await supabase
      .from("withdrawals")
      .select("amount_naira")
      .eq("status", "pending")
      .limit(1000)

    const pendingAmount = pendingWithdrawals?.reduce((sum: number, w: any) => sum + (w.amount_naira || 0), 0) || 0

    // Get active users count (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { count: activeUsersCount } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .gte("last_seen_at", oneDayAgo)

    const stats = {
      totalUsers: usersCount.count || 0,
      activeUsers: activeUsersCount || 0,
      totalTransactions: transactionsCount.count || 0,
      totalEvents: eventsCount.count || 0,
      totalWithdrawals: withdrawalsCount.count || 0,
      totalRevenue,
      pendingWithdrawalAmount: pendingAmount,
      lastUpdated: now,
    }

    // Update cache
    cachedStats = stats
    cacheTimestamp = now

    return NextResponse.json({
      success: true,
      stats,
      cached: false,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      }
    })
  } catch (error) {
    console.error("Dashboard stats error:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
