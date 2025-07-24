"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Coins, Music, MessageCircle, Trophy, Star, TrendingUp, Heart, Users, Radio } from "lucide-react"
import { redirect } from "next/navigation"

interface DashboardStats {
  totalPosts: number
  totalLikes: number
  totalComments: number
  coinsBalance: number
  level: number
  points: number
  tier: string
}

export default function DashboardPage() {
  const { user, profile, isAuthenticated, loading } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalPosts: 0,
    totalLikes: 0,
    totalComments: 0,
    coinsBalance: 0,
    level: 1,
    points: 0,
    tier: "grassroot",
  })
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [loadingStats, setLoadingStats] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      redirect("/login")
    }
  }, [loading, isAuthenticated])

  useEffect(() => {
    if (profile) {
      loadDashboardData()
    }
  }, [profile])

  const loadDashboardData = async () => {
    if (!profile) return

    try {
      setLoadingStats(true)

      // Load user stats
      const userStats = {
        totalPosts: 0,
        totalLikes: 0,
        totalComments: 0,
        coinsBalance: profile.coins_balance || 0,
        level: profile.level || 1,
        points: profile.points || 0,
        tier: profile.tier || "grassroot",
      }

      // Try to load posts count
      try {
        const { count: postsCount } = await supabase
          .from("community_posts")
          .select("*", { count: "exact", head: true })
          .eq("author_id", user?.id)

        userStats.totalPosts = postsCount || 0
      } catch (error) {
        console.log("Could not load posts count:", error)
      }

      // Try to load likes count
      try {
        const { data: posts } = await supabase.from("community_posts").select("likes_count").eq("author_id", user?.id)

        if (posts) {
          userStats.totalLikes = posts.reduce((sum, post) => sum + (post.likes_count || 0), 0)
        }
      } catch (error) {
        console.log("Could not load likes count:", error)
      }

      setStats(userStats)

      // Load recent activity (mock data for now)
      setRecentActivity([
        {
          id: 1,
          type: "post",
          title: "Welcome to the community!",
          timestamp: new Date().toISOString(),
          likes: 5,
        },
        {
          id: 2,
          type: "comment",
          title: "Great music choice!",
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          likes: 2,
        },
      ])
    } catch (error) {
      console.error("Error loading dashboard data:", error)
    } finally {
      setLoadingStats(false)
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "blood":
        return "bg-red-500"
      case "elder":
        return "bg-purple-500"
      case "pioneer":
        return "bg-blue-500"
      case "mod":
        return "bg-green-500"
      case "grassroot":
        return "bg-gray-500"
      default:
        return "bg-gray-500"
    }
  }

  const getTierName = (tier: string) => {
    switch (tier) {
      case "blood":
        return "Blood"
      case "elder":
        return "Elder"
      case "pioneer":
        return "Pioneer"
      case "mod":
        return "Moderator"
      case "grassroot":
        return "Grassroot"
      default:
        return "Grassroot"
    }
  }

  if (loading || loadingStats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
            <p className="text-white mt-4">Loading dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !profile) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-blue-200">Welcome back, {profile.full_name || profile.username}!</p>
        </div>

        {/* Profile Overview */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center gap-6">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="text-2xl">{profile.username?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold">{profile.full_name || profile.username}</h2>
                  <Badge className={`${getTierColor(stats.tier)} text-white`}>{getTierName(stats.tier)}</Badge>
                </div>
                <p className="text-gray-600 mb-3">@{profile.username}</p>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-yellow-500" />
                    <span>Level {stats.level}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-blue-500" />
                    <span>{stats.points} Points</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Coins className="h-4 w-4 text-yellow-600" />
                    <span>{stats.coinsBalance} Coins</span>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progress to Level {stats.level + 1}</span>
                    <span>{stats.points % 100}/100</span>
                  </div>
                  <Progress value={stats.points % 100} className="h-2" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPosts}</div>
              <p className="text-xs text-muted-foreground">+2 from last week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Likes</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalLikes}</div>
              <p className="text-xs text-muted-foreground">+12 from last week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Coins Balance</CardTitle>
              <Coins className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.coinsBalance}</div>
              <p className="text-xs text-muted-foreground">Available for use</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Community Rank</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">#{Math.floor(Math.random() * 100) + 1}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No recent activity</p>
                ) : (
                  recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{activity.title}</p>
                        <p className="text-sm text-gray-500">{new Date(activity.timestamp).toLocaleDateString()}</p>
                      </div>
                      <Badge variant="secondary">{activity.likes} likes</Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Button className="h-20 flex-col gap-2 bg-transparent" variant="outline">
                  <MessageCircle className="h-6 w-6" />
                  <span>New Post</span>
                </Button>
                <Button className="h-20 flex-col gap-2 bg-transparent" variant="outline">
                  <Users className="h-6 w-6" />
                  <span>Community</span>
                </Button>
                <Button className="h-20 flex-col gap-2 bg-transparent" variant="outline">
                  <Radio className="h-6 w-6" />
                  <span>Radio</span>
                </Button>
                <Button className="h-20 flex-col gap-2 bg-transparent" variant="outline">
                  <Music className="h-6 w-6" />
                  <span>Music</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
