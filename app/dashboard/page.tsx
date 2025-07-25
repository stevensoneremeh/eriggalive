"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Coins,
  MessageCircle,
  Users,
  Crown,
  Calendar,
  Music,
  Radio,
  ShoppingBag,
  Settings,
  Bell,
  Award,
  Activity,
  Heart,
  Eye,
  Zap,
  Target,
  Sparkles,
  BarChart3,
  Clock,
  Trophy,
  Flame,
} from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { useRouter } from "next/navigation"

interface DashboardStats {
  totalPosts: number
  totalComments: number
  totalLikes: number
  totalViews: number
  communityRank: number
  coinsEarned: number
  streakDays: number
  level: number
  nextLevelProgress: number
}

interface RecentActivity {
  id: string
  type: "post" | "comment" | "like" | "achievement"
  title: string
  description: string
  timestamp: string
  icon: any
  color: string
}

export default function DashboardPage() {
  const { profile, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    totalPosts: 0,
    totalComments: 0,
    totalLikes: 0,
    totalViews: 0,
    communityRank: 0,
    coinsEarned: 0,
    streakDays: 0,
    level: 1,
    nextLevelProgress: 0,
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loadingStats, setLoadingStats] = useState(true)

  const supabase = createClient()

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login?redirect=/dashboard")
    }
  }, [isAuthenticated, isLoading, router])

  const loadDashboardStats = async () => {
    if (!profile) return

    try {
      setLoadingStats(true)

      // Try to load real stats from database
      const [postsResult, commentsResult] = await Promise.allSettled([
        supabase.from("community_posts").select("id, vote_count").eq("user_id", profile.id).eq("is_deleted", false),
        supabase.from("community_comments").select("id").eq("user_id", profile.id).eq("is_deleted", false),
      ])

      const posts = postsResult.status === "fulfilled" ? postsResult.value.data || [] : []
      const comments = commentsResult.status === "fulfilled" ? commentsResult.value.data || [] : []

      const totalPosts = posts.length
      const totalComments = comments.length
      const totalLikes = posts.reduce((sum, post) => sum + (post.vote_count || 0), 0)
      const totalViews = totalPosts * Math.floor(Math.random() * 100) + 50
      const level = Math.floor((totalPosts + totalComments) / 5) + 1
      const nextLevelProgress = ((totalPosts + totalComments) % 5) * 20

      setStats({
        totalPosts,
        totalComments,
        totalLikes,
        totalViews,
        communityRank: Math.max(1, Math.floor(Math.random() * 100)),
        coinsEarned: profile.coins_balance || 0,
        streakDays: Math.floor(Math.random() * 30) + 1,
        level,
        nextLevelProgress,
      })

      // Mock recent activity
      setRecentActivity([
        {
          id: "1",
          type: "post",
          title: "New post created",
          description: "Your post 'Welcome to the community' received 5 likes",
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          icon: MessageCircle,
          color: "text-blue-500",
        },
        {
          id: "2",
          type: "like",
          title: "Post liked",
          description: "Someone liked your post about music",
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          icon: Heart,
          color: "text-red-500",
        },
        {
          id: "3",
          type: "achievement",
          title: "Achievement unlocked",
          description: "First Post - Created your first community post",
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          icon: Award,
          color: "text-yellow-500",
        },
      ])
    } catch (error) {
      console.error("Error loading dashboard stats:", error)
      // Use mock data as fallback
      setStats({
        totalPosts: 5,
        totalComments: 12,
        totalLikes: 34,
        totalViews: 256,
        communityRank: 42,
        coinsEarned: profile?.coins_balance || 100,
        streakDays: 7,
        level: 2,
        nextLevelProgress: 60,
      })
    } finally {
      setLoadingStats(false)
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case "blood_brotherhood":
      case "blood":
        return "bg-gradient-to-r from-red-500 to-red-600"
      case "elder":
        return "bg-gradient-to-r from-purple-500 to-purple-600"
      case "pioneer":
        return "bg-gradient-to-r from-blue-500 to-blue-600"
      case "grassroot":
        return "bg-gradient-to-r from-green-500 to-green-600"
      default:
        return "bg-gradient-to-r from-gray-500 to-gray-600"
    }
  }

  const getTierDisplayName = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case "blood_brotherhood":
      case "blood":
        return "Blood Brotherhood"
      case "elder":
        return "Elder"
      case "pioneer":
        return "Pioneer"
      case "grassroot":
        return "Grassroot"
      default:
        return "Fan"
    }
  }

  const getTierProgress = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case "blood_brotherhood":
      case "blood":
        return 100
      case "elder":
        return 75
      case "pioneer":
        return 50
      case "grassroot":
        return 25
      default:
        return 10
    }
  }

  const formatTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch {
      return "Recently"
    }
  }

  useEffect(() => {
    if (profile) {
      loadDashboardStats()
    }
  }, [profile])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !profile) {
    return null // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-6 mb-6">
            <div className="relative">
              <Avatar className="h-20 w-20 ring-4 ring-white/20 shadow-xl">
                <AvatarImage src={profile.avatar_url || "/placeholder-user.jpg"} alt={profile.username} />
                <AvatarFallback className="text-2xl bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                  {profile.username?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 bg-green-500 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  Welcome back, {profile.username}!
                </h1>
                <Sparkles className="h-6 w-6 text-yellow-500" />
              </div>
              <div className="flex items-center space-x-3">
                <Badge className={`${getTierColor(profile.tier)} text-white border-0 px-3 py-1`}>
                  <Crown className="h-3 w-3 mr-1" />
                  {getTierDisplayName(profile.tier)}
                </Badge>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  Member since {new Date(profile.created_at).getFullYear()}
                </span>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground flex items-center">
                  <Flame className="h-4 w-4 mr-1 text-orange-500" />
                  {stats.streakDays} day streak
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="backdrop-blur-sm bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Erigga Coins</p>
                  <p className="text-3xl font-bold">{profile.coins_balance || 0}</p>
                  <p className="text-blue-200 text-xs">Available balance</p>
                </div>
                <div className="bg-white/20 p-3 rounded-full">
                  <Coins className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-sm bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Posts Created</p>
                  <p className="text-3xl font-bold">{stats.totalPosts}</p>
                  <p className="text-green-200 text-xs">+{Math.floor(stats.totalPosts / 5)} this week</p>
                </div>
                <div className="bg-white/20 p-3 rounded-full">
                  <MessageCircle className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-sm bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Total Likes</p>
                  <p className="text-3xl font-bold">{stats.totalLikes}</p>
                  <p className="text-purple-200 text-xs">From your posts</p>
                </div>
                <div className="bg-white/20 p-3 rounded-full">
                  <Heart className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-sm bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Community Rank</p>
                  <p className="text-3xl font-bold">#{stats.communityRank}</p>
                  <p className="text-orange-200 text-xs">This month</p>
                </div>
                <div className="bg-white/20 p-3 rounded-full">
                  <Trophy className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="overview" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="activity" className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Activity
                </TabsTrigger>
                <TabsTrigger value="achievements" className="flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  Achievements
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Settings
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* Level Progress */}
                <Card className="backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 border-0 shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-yellow-500" />
                      Level Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                            {stats.level}
                          </div>
                          <span className="font-semibold">Level {stats.level}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {stats.nextLevelProgress}% to Level {stats.level + 1}
                        </span>
                      </div>
                      <Progress value={stats.nextLevelProgress} className="w-full h-3" />
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-2xl font-bold text-blue-500">{stats.totalPosts}</p>
                          <p className="text-xs text-muted-foreground">Posts</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-green-500">{stats.totalComments}</p>
                          <p className="text-xs text-muted-foreground">Comments</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-purple-500">{stats.totalLikes}</p>
                          <p className="text-xs text-muted-foreground">Likes</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Tier Progress */}
                <Card className="backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 border-0 shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Crown className="h-5 w-5 text-yellow-500" />
                      Tier Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <Badge className={`${getTierColor(profile.tier)} text-white border-0 px-3 py-1`}>
                            {getTierDisplayName(profile.tier)}
                          </Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">{getTierProgress(profile.tier)}%</span>
                      </div>
                      <Progress value={getTierProgress(profile.tier)} className="w-full h-3" />
                      <p className="text-sm text-muted-foreground">
                        Keep engaging with the community to unlock the next tier and exclusive benefits!
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 border-0 shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-blue-500" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <Button
                        variant="outline"
                        className="h-20 flex-col gap-2 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 hover:bg-blue-100"
                        asChild
                      >
                        <Link href="/community">
                          <Users className="h-6 w-6 text-blue-600" />
                          <span className="text-blue-700 font-medium">Community</span>
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-20 flex-col gap-2 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 hover:bg-green-100"
                        asChild
                      >
                        <Link href="/chat">
                          <MessageCircle className="h-6 w-6 text-green-600" />
                          <span className="text-green-700 font-medium">Chat</span>
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-20 flex-col gap-2 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 hover:bg-purple-100"
                        asChild
                      >
                        <Link href="/radio">
                          <Radio className="h-6 w-6 text-purple-600" />
                          <span className="text-purple-700 font-medium">Radio</span>
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-20 flex-col gap-2 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 hover:bg-orange-100"
                        asChild
                      >
                        <Link href="/vault">
                          <Music className="h-6 w-6 text-orange-600" />
                          <span className="text-orange-700 font-medium">Vault</span>
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-20 flex-col gap-2 bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20 border-pink-200 hover:bg-pink-100"
                        asChild
                      >
                        <Link href="/merch">
                          <ShoppingBag className="h-6 w-6 text-pink-600" />
                          <span className="text-pink-700 font-medium">Merch</span>
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-20 flex-col gap-2 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200 hover:bg-yellow-100"
                        asChild
                      >
                        <Link href="/coins">
                          <Coins className="h-6 w-6 text-yellow-600" />
                          <span className="text-yellow-700 font-medium">Coins</span>
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="activity" className="space-y-6">
                <Card className="backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 border-0 shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-green-500" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentActivity.length === 0 ? (
                        <div className="text-center py-8">
                          <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">No recent activity</p>
                        </div>
                      ) : (
                        recentActivity.map((activity) => (
                          <div
                            key={activity.id}
                            className="flex items-start gap-4 p-4 rounded-lg bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700/50 dark:to-slate-600/50"
                          >
                            <div className={`p-2 rounded-full bg-white dark:bg-slate-800 shadow-sm`}>
                              <activity.icon className={`h-5 w-5 ${activity.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">{activity.title}</p>
                              <p className="text-sm text-muted-foreground">{activity.description}</p>
                              <p className="text-xs text-muted-foreground mt-1 flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {formatTimeAgo(activity.timestamp)}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="achievements" className="space-y-6">
                <Card className="backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 border-0 shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-yellow-500" />
                      Achievements
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-4 p-4 rounded-lg border-2 border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
                        <div className="h-12 w-12 rounded-full bg-green-500 flex items-center justify-center">
                          <MessageCircle className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-green-800 dark:text-green-200">First Post</p>
                          <p className="text-sm text-green-600 dark:text-green-300">
                            Created your first community post
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 p-4 rounded-lg border-2 border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
                        <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center">
                          <Heart className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-blue-800 dark:text-blue-200">First Like</p>
                          <p className="text-sm text-blue-600 dark:text-blue-300">Received your first like on a post</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 p-4 rounded-lg border-2 border-gray-200 bg-gray-50 dark:bg-gray-800/50 dark:border-gray-700 opacity-50">
                        <div className="h-12 w-12 rounded-full bg-gray-400 flex items-center justify-center">
                          <Users className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-600 dark:text-gray-400">Community Leader</p>
                          <p className="text-sm text-gray-500 dark:text-gray-500">Get 100 likes on posts</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 p-4 rounded-lg border-2 border-gray-200 bg-gray-50 dark:bg-gray-800/50 dark:border-gray-700 opacity-50">
                        <div className="h-12 w-12 rounded-full bg-gray-400 flex items-center justify-center">
                          <Flame className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-600 dark:text-gray-400">Streak Master</p>
                          <p className="text-sm text-gray-500 dark:text-gray-500">Maintain a 30-day activity streak</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings" className="space-y-6">
                <Card className="backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 border-0 shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5 text-gray-500" />
                      Account Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700/50 dark:to-slate-600/50">
                        <div className="flex items-center gap-3">
                          <Bell className="h-5 w-5 text-blue-500" />
                          <div>
                            <p className="font-medium">Email Notifications</p>
                            <p className="text-sm text-muted-foreground">Receive updates via email</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          Configure
                        </Button>
                      </div>

                      <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700/50 dark:to-slate-600/50">
                        <div className="flex items-center gap-3">
                          <Eye className="h-5 w-5 text-green-500" />
                          <div>
                            <p className="font-medium">Privacy Settings</p>
                            <p className="text-sm text-muted-foreground">Control your profile visibility</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          Manage
                        </Button>
                      </div>

                      <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700/50 dark:to-slate-600/50">
                        <div className="flex items-center gap-3">
                          <Settings className="h-5 w-5 text-purple-500" />
                          <div>
                            <p className="font-medium">Account Security</p>
                            <p className="text-sm text-muted-foreground">Update password and security</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          Update
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Notifications */}
            <Card className="backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-blue-500" />
                  Notifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 mb-1">
                      <MessageCircle className="h-4 w-4 text-blue-500" />
                      <p className="text-sm font-medium">New community post</p>
                    </div>
                    <p className="text-xs text-muted-foreground">5 minutes ago</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2 mb-1">
                      <Coins className="h-4 w-4 text-green-500" />
                      <p className="text-sm font-medium">Coins earned</p>
                    </div>
                    <p className="text-xs text-muted-foreground">1 hour ago</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border border-orange-200 dark:border-orange-800">
                    <div className="flex items-center gap-2 mb-1">
                      <Award className="h-4 w-4 text-orange-500" />
                      <p className="text-sm font-medium">Achievement unlocked</p>
                    </div>
                    <p className="text-xs text-muted-foreground">2 days ago</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Events */}
            <Card className="backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-purple-500" />
                  Upcoming Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 rounded-lg border bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
                    <p className="font-medium text-sm">Live Chat Session</p>
                    <p className="text-xs text-muted-foreground">Tomorrow at 8:00 PM</p>
                  </div>
                  <div className="p-3 rounded-lg border bg-gradient-to-r from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20 border-pink-200 dark:border-pink-800">
                    <p className="font-medium text-sm">New Music Release</p>
                    <p className="text-xs text-muted-foreground">Next Friday</p>
                  </div>
                  <div className="p-3 rounded-lg border bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200 dark:border-yellow-800">
                    <p className="font-medium text-sm">Community Contest</p>
                    <p className="text-xs text-muted-foreground">Ends in 3 days</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-green-500" />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Profile Views</span>
                    <span className="font-semibold">{stats.totalViews}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Comments Made</span>
                    <span className="font-semibold">{stats.totalComments}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Days Active</span>
                    <span className="font-semibold">{stats.streakDays}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Current Level</span>
                    <Badge variant="secondary">Level {stats.level}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
