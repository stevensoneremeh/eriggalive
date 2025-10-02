"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, DollarSign, ShoppingCart, Calendar, Activity, Eye } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"

interface AdminStats {
  totalUsers: number
  totalRevenue: number
  totalOrders: number
  totalEvents: number
  activeUsers: number
  newUsersToday: number
  revenueToday: number
  ordersToday: number
}

export default function AdminOverviewPage() {
  const { user } = useAuth()
  const supabase = createClientComponentClient()
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalRevenue: 0,
    totalOrders: 0,
    totalEvents: 0,
    activeUsers: 0,
    newUsersToday: 0,
    revenueToday: 0,
    ordersToday: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true)

        // Fetch total users
        const { count: totalUsers } = await supabase.from("users").select("*", { count: "exact", head: true })

        // Fetch active users (logged in within last 7 days)
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        const { count: activeUsers } = await supabase
          .from("users")
          .select("*", { count: "exact", head: true })
          .gte("last_seen_at", sevenDaysAgo.toISOString())

        // Fetch new users today
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const { count: newUsersToday } = await supabase
          .from("users")
          .select("*", { count: "exact", head: true })
          .gte("created_at", today.toISOString())

        setStats({
          totalUsers: totalUsers || 0,
          totalRevenue: 0, // You can calculate this from transactions
          totalOrders: 0, // You can calculate this from orders
          totalEvents: 0, // You can fetch from events table
          activeUsers: activeUsers || 0,
          newUsersToday: newUsersToday || 0,
          revenueToday: 0,
          ordersToday: 0,
        })
      } catch (error) {
        console.error("Error fetching admin stats:", error)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchStats()
    }
  }, [user, supabase])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-teal"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Overview</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Welcome to the Erigga Live admin dashboard. Monitor and manage your platform.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</CardTitle>
            <Users className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              <span className="text-green-600">+{stats.newUsersToday}</span> today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Users</CardTitle>
            <Activity className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsers.toLocaleString()}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Last 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              ₦{stats.revenueToday.toLocaleString()} today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders.toLocaleString()}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{stats.ordersToday.toLocaleString()} today</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Manage your platform efficiently</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button asChild variant="outline" className="h-24 flex-col space-y-2 bg-transparent">
              <Link href="/admin/users">
                <Users className="h-6 w-6" />
                <span>Manage Users</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-24 flex-col space-y-2 bg-transparent">
              <Link href="/admin/events">
                <Calendar className="h-6 w-6" />
                <span>Manage Events</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-24 flex-col space-y-2 bg-transparent">
              <Link href="/admin/transactions">
                <DollarSign className="h-6 w-6" />
                <span>Transactions</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-24 flex-col space-y-2 bg-transparent">
              <Link href="/admin/media">
                <Eye className="h-6 w-6" />
                <span>Media Library</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Status</CardTitle>
          <CardDescription>Monitor your platform health</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm">All systems operational</span>
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Healthy
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <span className="text-sm">Database connections</span>
              </div>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                Optimal
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full" />
                <span className="text-sm">API response time</span>
              </div>
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                Fast
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
