"use client"

import { useAuth } from "@/contexts/auth-context"
import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Users,
  Radio,
  Vault,
  Coins,
  Calendar,
  ShoppingBag,
  Trophy,
  TrendingUp,
  Activity,
  MessageSquare,
  Heart,
  Award,
} from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

// Mock data for demonstration
const mockStats = {
  totalPosts: 45,
  totalLikes: 234,
  totalComments: 89,
  totalShares: 67,
  level: 5,
  experience: 2400,
  nextLevelExp: 3000,
  streak: 12,
  achievements: [
    { id: 1, name: "First Post", description: "Created your first post", icon: "🎉", earned: true },
    { id: 2, name: "Community Member", description: "Joined the community", icon: "👥", earned: true },
    { id: 3, name: "Music Lover", description: "Listened to 100 songs", icon: "🎵", earned: true },
    { id: 4, name: "Conversation Starter", description: "Started 10 discussions", icon: "💬", earned: false },
    { id: 5, name: "Influencer", description: "Got 500 likes", icon: "⭐", earned: false },
  ],
  recentActivity: [
    { id: 1, type: "post", content: "Shared a new track", time: "2 hours ago" },
    { id: 2, type: "comment", content: "Commented on Erigga's latest", time: "4 hours ago" },
    { id: 3, type: "like", content: "Liked 5 posts", time: "6 hours ago" },
    { id: 4, type: "share", content: "Shared community post", time: "1 day ago" },
  ],
}

const quickActions = [
  { name: "Community", href: "/community", icon: Users, color: "bg-blue-500" },
  { name: "Radio", href: "/radio", icon: Radio, color: "bg-green-500" },
  { name: "Vault", href: "/vault", icon: Vault, color: "bg-purple-500" },
  { name: "Coins", href: "/coins", icon: Coins, color: "bg-yellow-500" },
  { name: "Meet & Greet", href: "/meet-greet", icon: Calendar, color: "bg-pink-500" },
  { name: "Merch", href: "/merch", icon: ShoppingBag, color: "bg-indigo-500" },
]

export default function DashboardPage() {
  const { user, profile, loading } = useAuth()
  const [stats, setStats] = useState(mockStats)
  const [isLoading, setIsLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    const fetchUserStats = async () => {
      if (!user?.id) {
        setIsLoading(false)
        return
      }

      try {
        // Fetch user posts count
        const { count: postsCount } = await supabase
          .from("community_posts")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)

        // Fetch user comments count
        const { count: commentsCount } = await supabase
          .from("community_comments")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)

        // Update stats with real data
        setStats((prev) => ({
          ...prev,
          totalPosts: postsCount || 0,
          totalComments: commentsCount || 0,
        }))
      } catch (error) {
        console.error("Error fetching user stats:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserStats()
  }, [user?.id, supabase])

  const experiencePercentage = (stats.experience / stats.nextLevelExp) * 100

  return (
    <AuthGuard requireAuth>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div className="flex items-center gap-4 mb-4 md:mb-0">
            <Avatar className="h-16 w-16 ring-4 ring-white/20">
              <AvatarImage src={profile?.avatar_url || "/placeholder-user.jpg"} />
              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xl">
                {profile?.username?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold">Welcome back, {profile?.full_name || profile?.username || "User"}!</h1>
              <p className="text-muted-foreground">
                {profile?.tier ? (
                  <Badge variant="secondary" className="mt-1">
                    {profile.tier.charAt(0).toUpperCase() + profile.tier.slice(1)} Member
                  </Badge>
                ) : (
                  "Community Member"
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{profile?.coins_balance || 0}</p>
              <p className="text-sm text-muted-foreground">Coins</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{stats.level}</p>
              <p className="text-sm text-muted-foreground">Level</p>
            </div>
          </div>
        </div>

        {/* Level Progress */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Level Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Level {stats.level}</span>
                <span>
                  {stats.experience}/{stats.nextLevelExp} XP
                </span>
              </div>
              <Progress value={experiencePercentage} className="h-2" />
              <p className="text-xs text-muted-foreground">{stats.nextLevelExp - stats.experience} XP to next level</p>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Posts</p>
                  <p className="text-2xl font-bold">{stats.totalPosts}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Likes</p>
                  <p className="text-2xl font-bold">{stats.totalLikes}</p>
                </div>
                <Heart className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Comments</p>
                  <p className="text-2xl font-bold">{stats.totalComments}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Streak</p>
                  <p className="text-2xl font-bold">{stats.streak}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {quickActions.map((action) => {
                const Icon = action.icon
                return (
                  <Link key={action.name} href={action.href}>
                    <div className="flex flex-col items-center p-4 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                      <div className={`p-3 rounded-full ${action.color} text-white mb-2`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <span className="text-sm font-medium text-center">{action.name}</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Tabs for Additional Content */}
        <Tabs defaultValue="achievements" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="achievements">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Achievements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {stats.achievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className={`p-4 rounded-lg border-2 ${
                        achievement.earned
                          ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20"
                          : "border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/20"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{achievement.icon}</span>
                        <div>
                          <h3 className="font-semibold">{achievement.name}</h3>
                          <p className="text-sm text-muted-foreground">{achievement.description}</p>
                        </div>
                        {achievement.earned && (
                          <Badge variant="default" className="ml-auto">
                            Earned
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.recentActivity.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800"
                    >
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.content}</p>
                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AuthGuard>
  )
}
