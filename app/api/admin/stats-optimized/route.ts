
import { NextResponse } from 'next/server'
import { verifyAdminAccess } from '@/lib/utils/admin-auth'
import { getNeonStats } from '@/lib/db/neon-client'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Verify admin access using established pattern
    const { isAdmin, error: authError } = await verifyAdminAccess()
    if (!isAdmin) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 403 })
    }

    // Use Neon for analytics queries to reduce Supabase egress
    const stats = await getNeonStats()

    return NextResponse.json({
      success: true,
      stats: {
        total_users: stats.total_users,
        active_users_30d: stats.active_users_30d,
        new_users_30d: stats.new_users_30d,
        total_revenue: stats.total_revenue,
        monthly_revenue: stats.monthly_revenue,
        upcoming_events: stats.upcoming_events,
        active_streams: stats.active_streams,
        pending_withdrawals: stats.pending_withdrawals,
        pending_withdrawal_amount: stats.pending_withdrawal_amount,
        last_updated: stats.last_updated
      },
      cached: true
    })
  } catch (error) {
    console.error('Error in optimized stats endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Endpoint to manually refresh stats
export async function POST() {
  try {
    // Verify admin access using established pattern
    const { isAdmin, error: authError } = await verifyAdminAccess()
    if (!isAdmin) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 403 })
    }

    const supabase = await createClient()

    // Manually refresh materialized views
    const { error: refreshError } = await supabase.rpc('refresh_admin_stats')

    if (refreshError) {
      console.error('Error refreshing stats:', refreshError)
      return NextResponse.json(
        { error: 'Failed to refresh statistics' },
        { status: 500 }
      )
    }

    // Get fresh stats
    const { data: stats } = await supabase
      .rpc('get_admin_dashboard_stats')
      .single()

    return NextResponse.json({
      message: 'Stats refreshed successfully',
      totalUsers: Number(stats?.total_users) || 0,
      activeUsers: Number(stats?.active_users_30d) || 0,
      newUsers: Number(stats?.new_users_30d) || 0,
      totalRevenue: Number(stats?.total_revenue) || 0,
      monthlyRevenue: Number(stats?.monthly_revenue) || 0,
      upcomingEvents: Number(stats?.upcoming_events) || 0,
      activeStreams: Number(stats?.active_streams) || 0,
      pendingWithdrawals: Number(stats?.pending_withdrawals) || 0,
      pendingWithdrawalAmount: Number(stats?.pending_withdrawal_amount) || 0,
      lastUpdated: stats?.last_updated,
    })
  } catch (error) {
    console.error('Refresh stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
