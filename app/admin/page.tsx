"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, DollarSign, ShoppingCart, Calendar, Activity, Eye, RefreshCw } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"

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
  const supabase = createClient()
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
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async (showToast = false) => {
    try {
      setRefreshing(true)
      setError(null)

      const response = await fetch("/api/admin/dashboard-stats", {
        cache: "no-store",
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard stats: ${response.statusText}`)
      }

      const data = await response.json()
      if (data.success) {
        const apiStats = data.stats

        setStats({
          totalUsers: apiStats.totalUsers,
          totalRevenue: apiStats.totalRevenue,
          totalOrders: apiStats.totalTransactions,
          totalEvents: apiStats.totalEvents,
          activeUsers: apiStats.activeUsers || 0,
          newUsersToday: apiStats.newUsersToday || 0,
          revenueToday: apiStats.revenueToday || 0,
          ordersToday: apiStats.ordersToday || 0,
        })

        setLastUpdated(new Date())

        if (showToast) {
          toast.success("Dashboard refreshed successfully")
        }
      } else {
        throw new Error(data.error || 'Failed to fetch stats from API')
      }
    } catch (error) {
      console.error("Error fetching admin stats:", error)
      setError(error instanceof Error ? error.message : 'Failed to load dashboard stats. Please try again.')
      toast.error("Failed to load dashboard stats. Please try again.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [supabase]) // Include supabase in dependencies if it can change, though unlikely here

  useEffect(() => {
    if (user) {
      fetchStats()

      // Auto-refresh every 5 minutes instead of 1 minute to reduce load
      const interval = setInterval(() => fetchStats(false), 300000)

      return () => clearInterval(interval)
    }
  }, [user, fetchStats])

  if (loading && !error) { // Show loading indicator only if there's no error yet
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-teal"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Overview</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Welcome to the Erigga Live admin dashboard. Monitor and manage your platform.
            {lastUpdated && (
              <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                (Last updated: {lastUpdated.toLocaleTimeString()})
              </span>
            )}
          </p>
        </div>
        <Button
          onClick={() => fetchStats(true)}
          disabled={refreshing}
          variant="outline"
          className="bg-transparent"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50 dark:border-red-700 dark:bg-red-800/50">
          <CardContent className="pt-6">
            <p className="text-red-600 dark:text-red-400 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              {error}
            </p>
          </CardContent>
        </Card>
      )}


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
              <span className="text-green-600">+{stats.newUsersToday.toLocaleString()}</span> today
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