import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { verifyAdminAccess } from '@/lib/utils/admin-auth'

export async function GET() {
  try {
    // Verify admin access using established pattern
    const { isAdmin, error } = await verifyAdminAccess()
    if (!isAdmin) {
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: 403 })
    }

    const supabase = await createClient()

    // Use the optimized function that returns cached stats
    const { data: stats, error } = await supabase
      .rpc('get_admin_dashboard_stats')
      .single()

    if (error) {
      console.error('Error fetching dashboard stats:', error)
      return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
    }

    return NextResponse.json({
      totalUsers: Number(stats.total_users) || 0,
      activeUsers: Number(stats.active_users_30d) || 0,
      newUsers: Number(stats.new_users_30d) || 0,
      totalRevenue: Number(stats.total_revenue) || 0,
      monthlyRevenue: Number(stats.monthly_revenue) || 0,
      upcomingEvents: Number(stats.upcoming_events) || 0,
      activeStreams: Number(stats.active_streams) || 0,
      pendingWithdrawals: Number(stats.pending_withdrawals) || 0,
      pendingWithdrawalAmount: Number(stats.pending_withdrawal_amount) || 0,
      lastUpdated: stats.last_updated,
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Endpoint to manually refresh stats
export async function POST() {
  try {
    // Verify admin access using established pattern
    const { isAdmin, error } = await verifyAdminAccess()
    if (!isAdmin) {
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: 403 })
    }

    const supabase = await createClient()

    // Manually refresh materialized views
    const { error } = await supabase.rpc('refresh_admin_stats')

    if (error) {
      console.error('Error refreshing stats:', error)
      return NextResponse.json({ error: 'Failed to refresh stats' }, { status: 500 })
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
