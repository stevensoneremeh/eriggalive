"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { User, Coins, MessageSquare, Heart, TrendingUp, Calendar, Music, Users, AlertCircle } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

interface DashboardStats {
  totalPosts: number
  totalVotes: number
  totalComments: number
  coinsBalance: number
  recentActivity: any[]
}

export default function DashboardPage() {
  const { isAuthenticated, profile, loading: authLoading } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalPosts: 0,
    totalVotes: 0,
    totalComments: 0,
    coinsBalance: 0,
    recentActivity: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (!authLoading && isAuthenticated && profile) {
      loadDashboardData()
    } else if (!authLoading && !isAuthenticated) {
      setLoading(false)
    }
  }, [authLoading, isAuthenticated, profile])

  const loadDashboardData = async () => {
    if (!profile) return

    try {
      setLoading(true)
      setError(null)

      // Load user stats
      const [postsResult, votesResult, commentsResult] = await Promise.allSettled([
        supabase
          .from("community_posts")
          .select("id", { count: "exact" })
          .eq("user_id", profile.id)
          .eq("is_deleted", false),

        supabase.from("community_post_votes").select("id", { count: "exact" }).eq("user_id", profile.id),

        supabase
          .from("community_comments")
          .select("id", { count: "exact" })
          .eq("user_id", profile.id)
          .eq("is_deleted", false),
      ])

      // Load recent activity
      const { data: recentPosts } = await supabase
        .from("community_posts")
        .select(`
          id,
          content,
          created_at,
          vote_count,
          comment_count,
          category:community_categories!community_posts_category_id_fkey(name)
        `)
        .eq("user_id", profile.id)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false })
        .limit(5)

      setStats({
        totalPosts: postsResult.status === "fulfilled" ? postsResult.value.count || 0 : 0,
        totalVotes: votesResult.status === "fulfilled" ? votesResult.value.count || 0 : 0,
        totalComments: commentsResult.status === "fulfilled" ? commentsResult.value.count || 0 : 0,
        coinsBalance: profile.coins_balance || 0,
        recentActivity: recentPosts || [],
      })
    } catch (err) {
      console.error("Error loading dashboard data:", err)
      setError("Failed to load dashboard data")
    } finally {
      setLoading(false)
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case "blood":
      case "blood_brotherhood":
        return "bg-red-500 text-white"
      case "elder":
        return "bg-purple-500 text-white"
      case "pioneer":
        return "bg-blue-500 text-white"
      case "grassroot":
        return "bg-green-500 text-white"
      default:
        return "bg-gray-500 text-white"
    }
  }

  const getTierDisplayName = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case "blood":
      case "blood_brotherhood":
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

  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-16 mb-2" />
                <Skeleton className="h-8 w-12" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Required</h2>
            <p className="text-muted-foreground mb-4">Please sign in to access your dashboard</p>
            <div className="space-y-2">
              <Button className="w-full" asChild>
                <Link href="/login?redirect=/dashboard">Sign In</Link>
              </Button>
              <Button variant="outline" className="w-full bg-transparent" asChild>
                <Link href="/signup">Create Account</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive" className="max-w-md mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={profile?.avatar_url || "/placeholder-user.jpg"} />
            <AvatarFallback className="text-lg">{profile?.username?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {profile?.username || "User"}!</h1>
            <div className="flex items-center space-x-2 mt-1">
              <Badge className={getTierColor(profile?.tier || "grassroot")}>
                {getTierDisplayName(profile?.tier || "grassroot")}
              </Badge>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">
                Member since {new Date(profile?.created_at || "").toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Posts</p>
                <p className="text-2xl font-bold">{stats.totalPosts}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Votes Given</p>
                <p className="text-2xl font-bold">{stats.totalVotes}</p>
              </div>
              <Heart className="h-8 w-8 text-muted-foreground" />
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
              <MessageSquare className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Erigga Coins</p>
                <p className="text-2xl font-bold">{stats.coinsBalance}</p>
              </div>
              <Coins className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentActivity.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No recent activity</p>
                <Button asChild>
                  <Link href="/community">Start Participating</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {stats.recentActivity.map((activity, index) => (
                  <div key={activity.id || index} className="border-b pb-4 last:border-b-0">
                    <p className="font-medium mb-1">
                      {activity.content.length > 100 ? `${activity.content.substring(0, 100)}...` : activity.content}
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>{new Date(activity.created_at).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{activity.vote_count} votes</span>
                      <span>•</span>
                      <span>{activity.comment_count} comments</span>
                      {activity.category && (
                        <>
                          <span>•</span>
                          <Badge variant="outline" className="text-xs">
                            {activity.category.name}
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4">
              <Button className="w-full justify-start" asChild>
                <Link href="/community">
                  <Users className="h-4 w-4 mr-2" />
                  Browse Community
                </Link>
              </Button>

              <Button className="w-full justify-start bg-transparent" variant="outline" asChild>
                <Link href="/community/create">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Create Post
                </Link>
              </Button>

              <Button className="w-full justify-start bg-transparent" variant="outline" asChild>
                <Link href="/radio">
                  <Music className="h-4 w-4 mr-2" />
                  Listen to Radio
                </Link>
              </Button>

              <Button className="w-full justify-start bg-transparent" variant="outline" asChild>
                <Link href="/coins">
                  <Coins className="h-4 w-4 mr-2" />
                  Manage Coins
                </Link>
              </Button>

              <Button className="w-full justify-start bg-transparent" variant="outline" asChild>
                <Link href="/profile">
                  <User className="h-4 w-4 mr-2" />
                  Edit Profile
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Features */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Coming Soon
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <Music className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <h3 className="font-medium mb-1">Exclusive Tracks</h3>
              <p className="text-sm text-muted-foreground">Access unreleased music based on your tier</p>
            </div>

            <div className="text-center p-4 border rounded-lg">
              <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <h3 className="font-medium mb-1">Live Events</h3>
              <p className="text-sm text-muted-foreground">Join virtual meet & greets with Erigga</p>
            </div>

            <div className="text-center p-4 border rounded-lg">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <h3 className="font-medium mb-1">Leaderboards</h3>
              <p className="text-sm text-muted-foreground">Compete with other fans for rewards</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
