import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { verifyAdminAccess } from '@/lib/utils/admin-auth'

export async function GET() {
  try {
    // Verify admin access using established pattern
    const { isAdmin, error: authError } = await verifyAdminAccess()
    if (!isAdmin) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 403 })
    }

    const supabase = await createClient()

    // Use the optimized function that returns cached stats
    const { data: stats, error: statsError } = await supabase
      .rpc('get_admin_dashboard_stats')
      .single()

    if (statsError) {
      console.error('Error fetching stats:', statsError)
      return NextResponse.json(
        { error: 'Failed to fetch dashboard statistics' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      stats: stats || {
        total_users: 0,
        total_revenue: 0,
        total_transactions: 0,
        active_users: 0
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