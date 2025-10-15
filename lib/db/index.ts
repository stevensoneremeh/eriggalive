// Dual Database Routing System
// Routes reads to Neon (analytics DB) and writes to Supabase (primary DB)
// This reduces Supabase egress costs by offloading heavy reads to Neon

import { neon, neonConfig } from "@neondatabase/serverless"
import { createAdminClient } from "@/lib/supabase/admin"

// Configure Neon client
neonConfig.fetchConnectionCache = true

// Primary database (Supabase) - use for writes and real-time auth operations
export function getPrimaryDb() {
  return createAdminClient()
}

// Analytics database (Neon) - use for heavy reads, reporting, analytics
// Returns a SQL template tag function
export function getAnalyticsDb() {
  const neonDbUrl = process.env.NEON_DB_URL

  if (!neonDbUrl) {
    console.warn("[DB] NEON_DB_URL not configured, falling back to Supabase")
    // Fallback to Supabase if Neon is not configured
    return null
  }

  return neon(neonDbUrl)
}

// Helper to execute raw SQL queries on Neon
// Note: Neon uses template literals. For dynamic queries, use the returned sql function directly
export async function queryAnalytics<T = any>(query: TemplateStringsArray, ...params: any[]): Promise<T[]> {
  const sql = getAnalyticsDb()
  
  if (!sql) {
    console.warn("[DB] Using Supabase for analytics query (Neon not configured)")
    return []
  }

  try {
    const result = await sql(query, ...params)
    return result as T[]
  } catch (error) {
    console.error("[DB] Analytics query error:", error)
    throw error
  }
}

// Helper for admin dashboard stats (heavy read operation)
export async function getAdminDashboardStats() {
  const analyticsDb = getAnalyticsDb()

  if (!analyticsDb) {
    // Fallback to Supabase
    const supabase = getPrimaryDb()
    // Use materialized views if available
    const { data, error } = await supabase
      .from("admin_dashboard_stats")
      .select("*")
      .single()

    if (error) {
      console.error("[DB] Error fetching dashboard stats:", error)
      return null
    }

    return data
  }

  try {
    // Query Neon for analytics using template literal
    const result = await analyticsDb`
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM users WHERE last_seen_at >= NOW() - INTERVAL '30 days') as active_users_30d,
        (SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL '30 days') as new_users_30d,
        (SELECT COALESCE(SUM(amount), 0) FROM coin_transactions WHERE status = 'completed') as total_revenue,
        (SELECT COALESCE(SUM(amount), 0) FROM coin_transactions 
         WHERE status = 'completed' AND created_at >= DATE_TRUNC('month', NOW())) as monthly_revenue,
        (SELECT COUNT(*) FROM events WHERE status = 'upcoming') as upcoming_events,
        (SELECT COUNT(*) FROM live_streams WHERE status = 'active') as active_streams,
        (SELECT COUNT(*) FROM withdrawals WHERE status = 'pending') as pending_withdrawals,
        (SELECT COALESCE(SUM(amount_naira), 0) FROM withdrawals WHERE status = 'pending') as pending_withdrawal_amount
    `

    return result[0] || null
  } catch (error) {
    console.error("[DB] Error fetching dashboard stats from Neon:", error)
    return null
  }
}

// Helper for user activity summary (heavy read)
export async function getUserActivitySummary(limit = 100) {
  const analyticsDb = getAnalyticsDb()

  if (!analyticsDb) {
    // Fallback to Supabase
    const supabase = getPrimaryDb()
    const { data, error } = await supabase
      .from("user_activity_summary")
      .select("*")
      .limit(limit)

    if (error) {
      console.error("[DB] Error fetching user activity:", error)
      return []
    }

    return data
  }

  try {
    const result = await analyticsDb`
      SELECT
        u.id,
        u.username,
        u.email,
        u.tier,
        u.coins,
        u.last_seen_at,
        u.created_at,
        COUNT(DISTINCT t.id) as total_tickets,
        COUNT(DISTINCT ct.id) as total_transactions,
        COALESCE(SUM(ct.amount), 0) as total_spent
      FROM users u
      LEFT JOIN tickets t ON u.id = t.user_id
      LEFT JOIN coin_transactions ct ON u.id = ct.user_id
      GROUP BY u.id, u.username, u.email, u.tier, u.coins, u.last_seen_at, u.created_at
      ORDER BY u.last_seen_at DESC NULLS LAST
      LIMIT ${limit}
    `

    return result
  } catch (error) {
    console.error("[DB] Error fetching user activity from Neon:", error)
    return []
  }
}

// Helper for content overview (heavy read)
export async function getContentOverview() {
  const analyticsDb = getAnalyticsDb()

  if (!analyticsDb) {
    const supabase = getPrimaryDb()
    // Fetch from multiple tables
    const [events, videos, vault, posts] = await Promise.all([
      supabase.from("events").select("count"),
      supabase.from("videos").select("count"),
      supabase.from("vault_items").select("count"),
      supabase.from("community_posts").select("count"),
    ])

    return {
      events: events.count || 0,
      videos: videos.count || 0,
      vault: vault.count || 0,
      posts: posts.count || 0,
    }
  }

  try {
    const result = await analyticsDb`
      SELECT
        (SELECT COUNT(*) FROM events) as events,
        (SELECT COUNT(*) FROM videos) as videos,
        (SELECT COUNT(*) FROM vault_items) as vault,
        (SELECT COUNT(*) FROM community_posts) as posts
    `

    return result[0] || { events: 0, videos: 0, vault: 0, posts: 0 }
  } catch (error) {
    console.error("[DB] Error fetching content overview from Neon:", error)
    return { events: 0, videos: 0, vault: 0, posts: 0 }
  }
}

// Write operations should always use Supabase
export { getPrimaryDb as getWriteDb }
