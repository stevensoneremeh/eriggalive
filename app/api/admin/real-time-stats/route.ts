import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const metric = searchParams.get('metric') || 'all'

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

    // Fetch only requested metric to reduce load
    let data: any = {}

    switch (metric) {
      case 'users':
        const { count: userCount } = await supabase
          .from("users")
          .select("*", { count: "exact", head: true })
        data.totalUsers = userCount || 0
        break

      case 'active':
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        const { count: activeCount } = await supabase
          .from("users")
          .select("*", { count: "exact", head: true })
          .gte("last_seen_at", oneDayAgo)
        data.activeUsers = activeCount || 0
        break

      case 'revenue':
        const { data: transactions } = await supabase
          .from("coin_transactions")
          .select("amount")
          .eq("transaction_type", "purchase")
          .eq("status", "completed")
          .limit(1000)
        data.totalRevenue = transactions?.reduce((sum: number, tx: any) => sum + (tx.amount || 0), 0) || 0
        break

      default:
        // Return basic counts only for 'all'
        const [users, transactionCount, events] = await Promise.all([
          supabase.from("users").select("*", { count: "exact", head: true }),
          supabase.from("coin_transactions").select("*", { count: "exact", head: true }),
          supabase.from("events").select("*", { count: "exact", head: true }),
        ])

        data.totalUsers = users.count || 0
        data.totalTransactions = transactionCount.count || 0
        data.totalEvents = events.count || 0
    }

    return NextResponse.json({
      success: true,
      data,
      metric,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
      }
    })
  } catch (error) {
    console.error("Real-time stats error:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}