"use client"

import { useAuth } from "@/contexts/auth-context"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Users, MessageSquare, Coins, TrendingUp, Music } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

interface DashboardStats {
  totalUsers: number
  activeChats: number
  totalCoins: number
  mediaItems: number
}

interface RecentActivity {
  id: string
  type: string
  message: string
  timestamp: string
}

export default function DashboardPage() {
  const { user, profile, loading } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeChats: 0,
    totalCoins: 0,
    mediaItems: 0,
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loadingStats, setLoadingStats] = useState(true)

  useEffect(() => {
    // Simulate loading stats
    const loadStats = async () => {
      try {
        // In a real app, you'd fetch from your API
        await new Promise((resolve) => setTimeout(resolve, 1000))

        setStats({
          totalUsers: 1250,
          activeChats: 45,
          totalCoins: profile?.coins || 0,
          mediaItems: 89,
        })

        setRecentActivity([
          {
            id: "1",
            type: "chat",
            message: "New message in General Chat",
            timestamp: "2 minutes ago",
          },
          {
            id: "2",
            type: "coins",
            message: "Earned 50 coins from daily login",
            timestamp: "1 hour ago",
          },
          {
            id: "3",
            type: "media",
            message: "New track uploaded: 'Latest Hit'",
            timestamp: "3 hours ago",
          },
        ])
      } catch (error) {
        console.error("Error loading stats:", error)
      } finally {
        setLoadingStats(false)
      }
    }

    loadStats()
  }, [profile?.coins])

  const getTierColor = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case "admin":
        return "bg-red-500"
      case "mod":
        return "bg-purple-500"
      case "elder":
        return "bg-yellow-500"
      case "blood":
        return "bg-orange-500"
      case "pioneer":
        return "bg-blue-500"
      default:
        return "bg-green-500"
    }
  }

  const getNextTierProgress = () => {
    const currentTier = profile?.tier?.toLowerCase() || "grassroot"
    const level = profile?.level || 1

    switch (currentTier) {
      case "grassroot":
        return { next: "Pioneer", progress: Math.min((level / 10) * 100, 100) }
      case "pioneer":
        return { next: "Blood", progress: Math.min(((level - 10) / 15) * 100, 100) }
      case "blood":
        return { next: "Elder", progress: Math.min(((level - 25) / 25) * 100, 100) }
      case "elder":
        return { next: "Mod", progress: Math.min(((level - 50) / 25) * 100, 100) }
      default:
        return { next: "Max Level", progress: 100 }
    }
  }

  const tierProgress = getNextTierProgress()

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-purple-500 to-blue-600 rounded-lg p-6 text-white">
          <h1 className="text-2xl font-bold mb-2">Welcome back, {profile?.username || user?.email}!</h1>
          <p className="text-purple-100">Ready to dive into the Erigga Live experience?</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Coins</CardTitle>
              <Coins className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profile?.coins || 0}</div>
              <p className="text-xs text-muted-foreground">Your current balance</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Level</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profile?.level || 1}</div>
              <p className="text-xs text-muted-foreground">{profile?.points || 0} points</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Chats</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loadingStats ? "..." : stats.activeChats}</div>
              <p className="text-xs text-muted-foreground">Ongoing conversations</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Community</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loadingStats ? "..." : stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">Total members</p>
            </CardContent>
          </Card>
        </div>

        {/* Tier Progress and Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tier Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Your Progress</span>
                <Badge className={`${getTierColor(profile?.tier || "grassroot")} text-white`}>
                  {profile?.tier || "Grassroot"}
                </Badge>
              </CardTitle>
              <CardDescription>Progress to {tierProgress.next} tier</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Progress value={tierProgress.progress} className="w-full" />
              <p className="text-sm text-muted-foreground">{Math.round(tierProgress.progress)}% complete</p>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Jump into your favorite activities</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <Button asChild variant="outline" className="h-20 flex-col bg-transparent">
                <Link href="/chat">
                  <MessageSquare className="h-6 w-6 mb-2" />
                  Join Chat
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-20 flex-col bg-transparent">
                <Link href="/community">
                  <Users className="h-6 w-6 mb-2" />
                  Community
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-20 flex-col bg-transparent">
                <Link href="/vault">
                  <Music className="h-6 w-6 mb-2" />
                  Media Vault
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-20 flex-col bg-transparent">
                <Link href="/coins">
                  <Coins className="h-6 w-6 mb-2" />
                  Buy Coins
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>What's been happening in your account</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/3 animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      {activity.type === "chat" && <MessageSquare className="h-4 w-4 text-blue-600" />}
                      {activity.type === "coins" && <Coins className="h-4 w-4 text-yellow-600" />}
                      {activity.type === "media" && <Music className="h-4 w-4 text-green-600" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.message}</p>
                      <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No recent activity to show</p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
