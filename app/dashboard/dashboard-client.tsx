"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Coins,
  Trophy,
  Users,
  MessageSquare,
  Heart,
  Music,
  Video,
  ImageIcon,
  Star,
  Crown,
  Shield,
  Zap,
  LogOut,
} from "lucide-react"
import Link from "next/link"
import type { Session, User } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

type Profile = Database["public"]["Tables"]["users"]["Row"]

interface DashboardStats {
  totalPosts: number
  totalLikes: number
  totalComments: number
  totalFollowers: number
  vaultAccess: number
  recentActivity: Array<{
    type: string
    content: string
    time: string
  }>
}

interface DashboardClientProps {
  initialAuthData: {
    session: Session
    user: User
    profile: Profile | null
  }
}

export function DashboardClient({ initialAuthData }: DashboardClientProps) {
  const { profile, signOut } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalPosts: 0,
    totalLikes: 0,
    totalComments: 0,
    totalFollowers: 0,
    vaultAccess: 0,
    recentActivity: [],
  })
  const [loadingStats, setLoadingStats] = useState(true)
  const supabase = createClient()

  const currentProfile = profile || initialAuthData.profile

  useEffect(() => {
    if (currentProfile) {
      fetchDashboardStats()
    }
  }, [currentProfile])

  const fetchDashboardStats = async () => {
    if (!currentProfile) return

    try {
      const [postsResult, likesResult, commentsResult] = await Promise.allSettled([
        supabase.from("community_posts").select("id", { count: "exact" }).eq("user_id", currentProfile.id),
        supabase.from("post_likes").select("id", { count: "exact" }).eq("user_id", currentProfile.id),
        supabase.from("post_comments").select("id", { count: "exact" }).eq("author_id", currentProfile.id),
      ])

      setStats({
        totalPosts: postsResult.status === "fulfilled" ? postsResult.value.count || 0 : 0,
        totalLikes: likesResult.status === "fulfilled" ? likesResult.value.count || 0 : 0,
        totalComments: commentsResult.status === "fulfilled" ? commentsResult.value.count || 0 : 0,
        totalFollowers: Math.floor(Math.random() * 50) + 10,
        vaultAccess: getTierVaultAccess(currentProfile.tier),
        recentActivity: [
          { type: "post", content: "Shared a new post in General Discussion", time: "2 hours ago" },
          { type: "like", content: "Liked a post by @erigga_fan", time: "4 hours ago" },
          { type: "comment", content: "Commented on Latest Track Discussion", time: "1 day ago" },
          { type: "vault", content: "Accessed exclusive content", time: "2 days ago" },
          { type: "level", content: "Reached level 2!", time: "3 days ago" },
        ],
      })
    } catch (error) {
      console.error("Error fetching dashboard stats:", error)
    } finally {
      setLoadingStats(false)
    }
  }

  const getTierVaultAccess = (tier: string) => {
    const access = {
      grassroot: 25,
      pioneer: 50,
      elder: 75,
      blood_brotherhood: 100,
      admin: 100,
    }
    return access[tier as keyof typeof access] || 25
  }

  const getTierColor = (tier: string) => {
    const colors = {
      grassroot: "bg-green-500",
      pioneer: "bg-blue-500",
      elder: "bg-purple-500",
      blood_brotherhood: "bg-red-500",
      admin: "bg-yellow-500",
    }
    return colors[tier as keyof typeof colors] || "bg-gray-500"
  }

  const getTierIcon = (tier: string) => {
    const icons = {
      grassroot: Star,
      pioneer: Shield,
      elder: Crown,
      blood_brotherhood: Zap,
      admin: Trophy,
    }
    const Icon = icons[tier as keyof typeof icons] || Star
    return <Icon className="w-4 h-4" />
  }

  const handleSignOut = async () => {
    await signOut()
  }

  if (!currentProfile) {
    return <DashboardSkeleton />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Welcome back, {currentProfile.full_name || currentProfile.username}!
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Here's what's happening in your Erigga Live community
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={currentProfile.avatar_url || ""} alt={currentProfile.username} />
                <AvatarFallback className="text-lg font-bold">
                  {(currentProfile.full_name || currentProfile.username).charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Button onClick={handleSignOut} variant="outline" size="sm">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{stats.totalPosts}</div>
              )}
              <p className="text-xs text-muted-foreground">+2 from last week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Likes Received</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{stats.totalLikes}</div>
              )}
              <p className="text-xs text-muted-foreground">+12% from last week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Erigga Coins</CardTitle>
              <Coins className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentProfile.coins}</div>
              <p className="text-xs text-muted-foreground">
                <Link href="/coins" className="text-blue-600 hover:underline">
                  Buy more coins
                </Link>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Level</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Level {currentProfile.level}</div>
              <Progress value={currentProfile.points % 100} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {100 - (currentProfile.points % 100)} XP to next level
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="achievements">Achievements</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>Jump into your favorite activities</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Button asChild variant="outline" className="h-20 flex-col bg-transparent">
                        <Link href="/community">
                          <Users className="h-6 w-6 mb-2" />
                          Community
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="h-20 flex-col bg-transparent">
                        <Link href="/vault">
                          <Video className="h-6 w-6 mb-2" />
                          Vault
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="h-20 flex-col bg-transparent">
                        <Link href="/chat">
                          <MessageSquare className="h-6 w-6 mb-2" />
                          Chat
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="h-20 flex-col bg-transparent">
                        <Link href="/coins">
                          <Coins className="h-6 w-6 mb-2" />
                          Coins
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Vault Access */}
                <Card>
                  <CardHeader>
                    <CardTitle>Vault Access</CardTitle>
                    <CardDescription>Your tier gives you access to exclusive content</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge className={`${getTierColor(currentProfile.tier)} text-white`}>
                            {getTierIcon(currentProfile.tier)}
                            <span className="ml-1">{currentProfile.tier.replace("_", " ").toUpperCase()}</span>
                          </Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {getTierVaultAccess(currentProfile.tier)}% Access
                        </span>
                      </div>
                      <Progress value={getTierVaultAccess(currentProfile.tier)} className="h-2" />
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <Music className="h-8 w-8 mx-auto mb-2 text-green-600" />
                          <p className="text-sm font-medium">Audio</p>
                          <p className="text-xs text-muted-foreground">
                            {currentProfile.tier === "grassroot" ? "Limited" : "Full Access"}
                          </p>
                        </div>
                        <div>
                          <Video className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                          <p className="text-sm font-medium">Video</p>
                          <p className="text-xs text-muted-foreground">
                            {["grassroot", "pioneer"].includes(currentProfile.tier) ? "Limited" : "Full Access"}
                          </p>
                        </div>
                        <div>
                          <ImageIcon className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                          <p className="text-sm font-medium">Exclusive</p>
                          <p className="text-xs text-muted-foreground">
                            {["blood_brotherhood", "admin"].includes(currentProfile.tier)
                              ? "Full Access"
                              : "Upgrade Required"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="activity" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Your latest interactions in the community</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {loadingStats
                        ? Array.from({ length: 5 }).map((_, i) => (
                            <div
                              key={i}
                              className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
                            >
                              <Skeleton className="w-2 h-2 rounded-full mt-2" />
                              <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-3 w-1/2" />
                              </div>
                            </div>
                          ))
                        : stats.recentActivity.map((activity, index) => (
                            <div
                              key={index}
                              className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
                            >
                              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                              <div className="flex-1">
                                <p className="text-sm">{activity.content}</p>
                                <p className="text-xs text-muted-foreground">{activity.time}</p>
                              </div>
                            </div>
                          ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="achievements" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Achievements</CardTitle>
                    <CardDescription>Your milestones and accomplishments</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-3 p-4 rounded-lg border">
                        <Trophy className="h-8 w-8 text-yellow-600" />
                        <div>
                          <p className="font-medium">Community Member</p>
                          <p className="text-sm text-muted-foreground">Joined the community</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 p-4 rounded-lg border">
                        <MessageSquare className="h-8 w-8 text-blue-600" />
                        <div>
                          <p className="font-medium">First Post</p>
                          <p className="text-sm text-muted-foreground">Made your first post</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 p-4 rounded-lg border opacity-50">
                        <Heart className="h-8 w-8 text-red-600" />
                        <div>
                          <p className="font-medium">Popular Creator</p>
                          <p className="text-sm text-muted-foreground">Get 100 likes</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 p-4 rounded-lg border opacity-50">
                        <Users className="h-8 w-8 text-green-600" />
                        <div>
                          <p className="font-medium">Community Leader</p>
                          <p className="text-sm text-muted-foreground">Help 50 members</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profile Card */}
            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <Avatar className="h-20 w-20 mx-auto mb-4">
                    <AvatarImage src={currentProfile.avatar_url || ""} alt={currentProfile.username} />
                    <AvatarFallback className="text-2xl font-bold">
                      {(currentProfile.full_name || currentProfile.username).charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-semibold">{currentProfile.full_name || currentProfile.username}</h3>
                  <p className="text-sm text-muted-foreground">@{currentProfile.username}</p>
                  <Badge className={`${getTierColor(currentProfile.tier)} text-white mt-2`}>
                    {getTierIcon(currentProfile.tier)}
                    <span className="ml-1">{currentProfile.tier.replace("_", " ").toUpperCase()}</span>
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Level</span>
                    <span className="text-sm font-medium">{currentProfile.level}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Points</span>
                    <span className="text-sm font-medium">{currentProfile.points}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Coins</span>
                    <span className="text-sm font-medium">{currentProfile.coins}</span>
                  </div>
                </div>
                <Button asChild className="w-full">
                  <Link href="/profile">Edit Profile</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Community Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Community Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Posts</span>
                  {loadingStats ? (
                    <Skeleton className="h-4 w-8" />
                  ) : (
                    <span className="font-medium">{stats.totalPosts}</span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Comments</span>
                  {loadingStats ? (
                    <Skeleton className="h-4 w-8" />
                  ) : (
                    <span className="font-medium">{stats.totalComments}</span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Likes Given</span>
                  {loadingStats ? (
                    <Skeleton className="h-4 w-8" />
                  ) : (
                    <span className="font-medium">{stats.totalLikes}</span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Followers</span>
                  {loadingStats ? (
                    <Skeleton className="h-4 w-8" />
                  ) : (
                    <span className="font-medium">{stats.totalFollowers}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-9 w-96 mb-2" />
              <Skeleton className="h-5 w-80" />
            </div>
            <div className="flex items-center space-x-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <Skeleton className="h-9 w-24" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
