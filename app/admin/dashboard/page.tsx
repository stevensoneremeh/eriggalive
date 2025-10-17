'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, DollarSign, Calendar, Activity } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

interface DashboardStats {
  totalUsers: number
  activeUsers: number
  totalRevenue: number
  monthlyRevenue: number
  upcomingEvents: number
  activeStreams: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/dashboard-stats')
        if (!response.ok) throw new Error('Failed to fetch stats')
        const data = await response.json()
        setStats(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load stats')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <h1 className="text-3xl font-bold">Dashboard Overview</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
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
        <h1 className="text-3xl font-bold">Dashboard Overview</h1>
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">Error: {error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      description: `${stats?.activeUsers || 0} active this month`,
      icon: Users,
    },
    {
      title: 'Total Revenue',
      value: `₦${(stats?.totalRevenue || 0).toLocaleString()}`,
      description: `₦${(stats?.monthlyRevenue || 0).toLocaleString()} this month`,
      icon: DollarSign,
    },
    {
      title: 'Upcoming Events',
      value: stats?.upcomingEvents || 0,
      description: 'Scheduled events',
      icon: Calendar,
    },
    {
      title: 'Active Streams',
      value: stats?.activeStreams || 0,
      description: 'Live broadcasts',
      icon: Activity,
    },
  ]

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <h1 className="text-3xl font-bold">Dashboard Overview</h1>
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
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}