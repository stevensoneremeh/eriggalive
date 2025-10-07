import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { db } from "@/lib/db/client"
import { sql } from "drizzle-orm"

export const dynamic = 'force-dynamic'
export const revalidate = 60 // Cache for 60 seconds

let cachedStats: any = null
let cacheTimestamp: number = 0
const CACHE_DURATION = 120000

export async function GET() {
  try {
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

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const profileResult = await db.execute(sql`
      SELECT role, tier FROM users WHERE auth_user_id = ${user.id} LIMIT 1
    `)
    const profile = (profileResult as any[])[0]

    const isAdmin =
      user.email === "info@eriggalive.com" ||
      profile?.role === "admin" ||
      profile?.role === "super_admin" ||
      profile?.tier === "enterprise"

    if (!isAdmin) {
      return NextResponse.json({ error: "Insufficient privileges" }, { status: 403 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const statsResult = await db.execute(sql`
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM users WHERE last_seen_at >= ${sevenDaysAgo.toISOString()}) as active_users,
        (SELECT COUNT(*) FROM users WHERE created_at >= ${today.toISOString()}) as new_users_today,
        (SELECT COUNT(*) FROM coin_transactions) as total_transactions,
        (SELECT COUNT(*) FROM events) as total_events,
        (SELECT COUNT(*) FROM withdrawals) as total_withdrawals,
        (SELECT COALESCE(SUM(amount), 0) FROM coin_transactions 
         WHERE transaction_type = 'purchase' AND status = 'completed') as total_revenue,
        (SELECT COALESCE(SUM(amount), 0) FROM coin_transactions 
         WHERE transaction_type = 'purchase' AND status = 'completed' 
         AND created_at >= ${today.toISOString()}) as revenue_today,
        (SELECT COUNT(*) FROM coin_transactions 
         WHERE created_at >= ${today.toISOString()}) as orders_today,
        (SELECT COALESCE(SUM(amount_naira), 0) FROM withdrawals 
         WHERE status = 'pending') as pending_withdrawal_amount
    `)

    const result = (statsResult as any[])[0]

    const stats = {
      totalUsers: Number(result.total_users) || 0,
      activeUsers: Number(result.active_users) || 0,
      newUsersToday: Number(result.new_users_today) || 0,
      totalTransactions: Number(result.total_transactions) || 0,
      totalEvents: Number(result.total_events) || 0,
      totalWithdrawals: Number(result.total_withdrawals) || 0,
      totalRevenue: Number(result.total_revenue) || 0,
      revenueToday: Number(result.revenue_today) || 0,
      ordersToday: Number(result.orders_today) || 0,
      pendingWithdrawalAmount: Number(result.pending_withdrawal_amount) || 0,
      lastUpdated: now,
    }

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