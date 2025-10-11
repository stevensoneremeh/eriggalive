'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, DollarSign, Calendar, Activity, RefreshCw, TrendingUp, Wallet, AlertCircle } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

interface DashboardStats {
  totalUsers: number
  activeUsers: number
  newUsers: number
  totalRevenue: number
  monthlyRevenue: number
  upcomingEvents: number
  activeStreams: number
  pendingWithdrawals: number
  pendingWithdrawalAmount: number
  lastUpdated?: string
}

export default function AdminStatsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true)
      else setLoading(true)

      const response = await fetch('/api/admin/stats-optimized')
      if (!response.ok) throw new Error('Failed to fetch stats')

      const data = await response.json()

      if (data.success && data.stats) {
        setStats({
          totalUsers: Number(data.stats.total_users) || 0,
          activeUsers: Number(data.stats.active_users_30d) || 0,
          newUsers: Number(data.stats.new_users_30d) || 0,
          totalRevenue: Number(data.stats.total_revenue) || 0,
          monthlyRevenue: Number(data.stats.monthly_revenue) || 0,
          upcomingEvents: Number(data.stats.upcoming_events) || 0,
          activeStreams: Number(data.stats.active_streams) || 0,
          pendingWithdrawals: Number(data.stats.pending_withdrawals) || 0,
          pendingWithdrawalAmount: Number(data.stats.pending_withdrawal_amount) || 0,
          lastUpdated: data.stats.last_updated
        })
        setError(null)
      } else {
        throw new Error(data.error || 'Failed to process stats from API')
      }
    } catch (err) {
      console.error("Error fetching admin stats:", err)
      setError(err instanceof Error ? err.message : 'Failed to load stats')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const manualRefresh = async () => {
    try {
      setRefreshing(true)
      const response = await fetch('/api/admin/stats-optimized', { method: 'POST' })
      if (!response.ok) throw new Error('Failed to refresh stats')

      const data = await response.json()
      if (data.success && data.stats) { // Assuming the POST refresh also returns data in a similar structure
        setStats({
          totalUsers: Number(data.stats.total_users) || 0,
          activeUsers: Number(data.stats.active_users_30d) || 0,
          newUsers: Number(data.stats.new_users_30d) || 0,
          totalRevenue: Number(data.stats.total_revenue) || 0,
          monthlyRevenue: Number(data.stats.monthly_revenue) || 0,
          upcomingEvents: Number(data.stats.upcoming_events) || 0,
          activeStreams: Number(data.stats.active_streams) || 0,
          pendingWithdrawals: Number(data.stats.pending_withdrawals) || 0,
          pendingWithdrawalAmount: Number(data.stats.pending_withdrawal_amount) || 0,
          lastUpdated: data.stats.last_updated
        })
        setError(null)
      } else {
        throw new Error(data.error || 'Failed to process refreshed stats from API')
      }
    } catch (err) {
      console.error("Error refreshing admin stats:", err)
      setError(err instanceof Error ? err.message : 'Failed to refresh stats')
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchStats()
    // Optional: Set up an interval for auto-refresh if needed
    // const interval = setInterval(() => fetchStats(false), 300000); // Refresh every 5 minutes
    // return () => clearInterval(interval);
  }, [])

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Stats & Analytics</h1>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Stats & Analytics</h1>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={() => fetchStats(false)}>Try Again</Button>
      </div>
    )
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      description: `${stats?.newUsers || 0} new this month`,
      icon: Users,
      trend: '+12%' // Placeholder trend
    },
    {
      title: 'Active Users',
      value: stats?.activeUsers || 0,
      description: 'Last 30 days',
      icon: Activity,
      trend: '+8%' // Placeholder trend
    },
    {
      title: 'Total Revenue',
      value: `₦${(stats?.totalRevenue || 0).toLocaleString()}`,
      description: 'All time',
      icon: DollarSign,
      trend: '+23%' // Placeholder trend
    },
    {
      title: 'Monthly Revenue',
      value: `₦${(stats?.monthlyRevenue || 0).toLocaleString()}`,
      description: 'This month',
      icon: TrendingUp,
      trend: '+15%' // Placeholder trend
    },
    {
      title: 'Upcoming Events',
      value: stats?.upcomingEvents || 0,
      description: 'Scheduled',
      icon: Calendar,
    },
    {
      title: 'Active Streams',
      value: stats?.activeStreams || 0,
      description: 'Live now',
      icon: Activity,
    },
    {
      title: 'Pending Withdrawals',
      value: stats?.pendingWithdrawals || 0,
      description: `₦${(stats?.pendingWithdrawalAmount || 0).toLocaleString()}`,
      icon: Wallet,
    },
  ]

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Stats & Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Real-time platform statistics and insights
          </p>
        </div>
        <Button
          onClick={manualRefresh}
          disabled={refreshing}
          className="flex items-center gap-2"
        >
          <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          {refreshing ? 'Refreshing...' : 'Refresh Stats'}
        </Button>
      </div>

      {stats?.lastUpdated && (
        <p className="text-sm text-muted-foreground">
          Last updated: {new Date(stats.lastUpdated).toLocaleString()}
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                {stat.trend && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    {stat.trend} from last month
                  </p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}