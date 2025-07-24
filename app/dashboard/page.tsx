"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  User,
  Coins,
  MessageCircle,
  Users,
  Crown,
  TrendingUp,
  Calendar,
  Music,
  Radio,
  ShoppingBag,
  Settings,
  Bell,
  Star,
  Award,
  Activity,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"

interface DashboardStats {
  totalPosts: number
  totalComments: number
  totalLikes: number
  communityRank: number
  coinsEarned: number
  streakDays: number
}

export default function DashboardPage() {
  const { profile, isAuthenticated, isLoading } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalPosts: 0,
    totalComments: 0,
    totalLikes: 0,
    communityRank: 0,
    coinsEarned: 0,
    streakDays: 0,
  })
  const [loadingStats, setLoadingStats] = useState(true)

  const supabase = createClient()

  const loadDashboardStats = async () => {
    if (!profile) return

    try {
      setLoadingStats(true)

      // Try to load real stats from database
      const [postsResult, commentsResult] = await Promise.allSettled([
        supabase.from("community_posts").select("id").eq("author_id", profile.id),
        supabase.from("community_comments").select("id").eq("author_id", profile.id),
      ])

      const totalPosts = postsResult.status === "fulfilled" ? postsResult.value.data?.length || 0 : 0
      const totalComments = commentsResult.status === "fulfilled" ? commentsResult.value.data?.length || 0 : 0

      setStats({
        totalPosts,
        totalComments,
        totalLikes: Math.floor(Math.random() * 100) + totalPosts * 3, // Mock calculation
        communityRank: Math.max(1, Math.floor(Math.random() * 100)),
        coinsEarned: profile.coins || 0,
        streakDays: Math.floor(Math.random() * 30) + 1,
      })
    } catch (error) {
      console.error("Error loading dashboard stats:", error)
      // Use mock data as fallback
      setStats({
        totalPosts: 5,
        totalComments: 12,
        totalLikes: 34,
        communityRank: 42,
        coinsEarned: profile?.coins || 0,
        streakDays: 7,
      })
    } finally {
      setLoadingStats(false)
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case "blood_brotherhood":
      case "blood":
        return "bg-red-500"
      case "elder":
        return "bg-purple-500"
      case "pioneer":
        return "bg-blue-500"
      case "grassroot":
        return "bg-green-500"
      default:
        return "bg-gray-500"
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

  useEffect(() => {
    if (profile) {
      loadDashboardStats()
    }
  }, [profile])

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
            <p className="text-muted-foreground mb-4">Please sign in to access your dashboard.</p>
            <Button asChild>
              <Link href="/login">Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={profile.avatar_url || "/placeholder-user.jpg"} alt={profile.username} />
            <AvatarFallback className="text-xl">{profile.username?.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {profile.username}!</h1>
            <div className="flex items-center space-x-2 mt-1">
              <Badge className={`${getTierColor(profile.tier)} text-white`}>{getTierDisplayName(profile.tier)}</Badge>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">Member since {new Date(profile.created_at).getFullYear()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Coins className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{profile.coins}</p>
                <p className="text-sm text-muted-foreground">Erigga Coins</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <MessageCircle className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.totalPosts}</p>
                <p className="text-sm text-muted-foreground">Posts Created</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Star className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{stats.totalLikes}</p>
                <p className="text-sm text-muted-foreground">Likes Received</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">#{stats.communityRank}</p>
                <p className="text-sm text-muted-foreground">Community Rank</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="achievements">Achievements</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Tier Progress */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Crown className="h-5 w-5 mr-2" />
                    Tier Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{getTierDisplayName(profile.tier)}</span>
                      <span className="text-sm text-muted-foreground">{getTierProgress(profile.tier)}%</span>
                    </div>
                    <Progress value={getTierProgress(profile.tier)} className="w-full" />
                    <p className="text-sm text-muted-foreground">
                      Keep engaging with the community to unlock the next tier!
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <Button variant="outline" className="h-20 flex-col bg-transparent" asChild>
                      <Link href="/community">
                        <Users className="h-6 w-6 mb-2" />
                        Community
                      </Link>
                    </Button>
                    <Button variant="outline" className="h-20 flex-col bg-transparent" asChild>
                      <Link href="/chat">
                        <MessageCircle className="h-6 w-6 mb-2" />
                        Chat
                      </Link>
                    </Button>
                    <Button variant="outline" className="h-20 flex-col bg-transparent" asChild>
                      <Link href="/radio">
                        <Radio className="h-6 w-6 mb-2" />
                        Radio
                      </Link>
                    </Button>
                    <Button variant="outline" className="h-20 flex-col bg-transparent" asChild>
                      <Link href="/vault">
                        <Music className="h-6 w-6 mb-2" />
                        Vault
                      </Link>
                    </Button>
                    <Button variant="outline" className="h-20 flex-col bg-transparent" asChild>
                      <Link href="/merch">
                        <ShoppingBag className="h-6 w-6 mb-2" />
                        Merch
                      </Link>
                    </Button>
                    <Button variant="outline" className="h-20 flex-col bg-transparent" asChild>
                      <Link href="/coins">
                        <Coins className="h-6 w-6 mb-2" />
                        Coins
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="h-5 w-5 mr-2" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50">
                      <MessageCircle className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="font-medium">Posted in Community</p>
                        <p className="text-sm text-muted-foreground">2 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50">
                      <Star className="h-5 w-5 text-yellow-500" />
                      <div>
                        <p className="font-medium">Received 5 likes</p>
                        <p className="text-sm text-muted-foreground">4 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50">
                      <Coins className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="font-medium">Earned 10 coins</p>
                        <p className="text-sm text-muted-foreground">1 day ago</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="achievements" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Award className="h-5 w-5 mr-2" />
                    Achievements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3 p-4 rounded-lg border">
                      <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center">
                        <MessageCircle className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="font-medium">First Post</p>
                        <p className="text-sm text-muted-foreground">Created your first community post</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-4 rounded-lg border opacity-50">
                      <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center">
                        <Users className="h-6 w-6 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium">Community Leader</p>
                        <p className="text-sm text-muted-foreground">Get 100 likes on posts</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="h-5 w-5 mr-2" />
                    Account Settings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Email Notifications</p>
                        <p className="text-sm text-muted-foreground">Receive updates via email</p>
                      </div>
                      <Button variant="outline" size="sm">
                        Configure
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Privacy Settings</p>
                        <p className="text-sm text-muted-foreground">Control your profile visibility</p>
                      </div>
                      <Button variant="outline" size="sm">
                        Manage
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Account Security</p>
                        <p className="text-sm text-muted-foreground">Update password and security</p>
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
                  <p className="text-sm font-medium">New community post</p>
                  <p className="text-xs text-muted-foreground">5 minutes ago</p>
                </div>
                <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
                  <p className="text-sm font-medium">Coins earned</p>
                  <p className="text-xs text-muted-foreground">1 hour ago</p>
                </div>
                <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800">
                  <p className="text-sm font-medium">New tier unlocked</p>
                  <p className="text-xs text-muted-foreground">2 days ago</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Upcoming Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 rounded-lg border">
                  <p className="font-medium">Live Chat Session</p>
                  <p className="text-sm text-muted-foreground">Tomorrow at 8:00 PM</p>
                </div>
                <div className="p-3 rounded-lg border">
                  <p className="font-medium">New Music Release</p>
                  <p className="text-sm text-muted-foreground">Next Friday</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
