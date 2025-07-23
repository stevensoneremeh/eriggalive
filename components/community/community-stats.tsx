"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { createClient } from "@/lib/supabase/client"
import { Users, MessageSquare, TrendingUp, Star } from "lucide-react"

export function CommunityStats() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPosts: 0,
    totalComments: 0,
    activeToday: 0,
  })
  const [topUsers, setTopUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch stats with timeout
      const statsPromise = Promise.all([
        supabase.from("users").select("*", { count: "exact", head: true }),
        supabase.from("community_posts").select("*", { count: "exact", head: true }),
        supabase.from("community_comments").select("*", { count: "exact", head: true }),
      ])

      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Request timeout")), 10000))

      const [usersResult, postsResult, commentsResult] = (await Promise.race([statsPromise, timeoutPromise])) as any

      setStats({
        totalUsers: usersResult?.count || 0,
        totalPosts: postsResult?.count || 0,
        totalComments: commentsResult?.count || 0,
        activeToday: Math.floor((usersResult?.count || 0) * 0.1),
      })

      // Fetch top users
      try {
        const { data: postsData } = await supabase
          .from("community_posts")
          .select(`
            user_id,
            users!community_posts_user_id_fkey (username, full_name, avatar_url)
          `)
          .limit(50)

        if (postsData) {
          const userCounts: { [key: string]: any } = {}
          postsData.forEach((post) => {
            const userId = post.user_id
            if (!userCounts[userId] && post.users) {
              userCounts[userId] = {
                ...post.users,
                postCount: 0,
              }
            }
            if (userCounts[userId]) {
              userCounts[userId].postCount++
            }
          })

          const sortedUsers = Object.values(userCounts)
            .sort((a: any, b: any) => b.postCount - a.postCount)
            .slice(0, 5)

          setTopUsers(sortedUsers)
        }
      } catch (topUsersErr) {
        console.warn("Top users fetch failed:", topUsersErr)
        setTopUsers([])
      }
    } catch (error) {
      console.error("Stats fetch error:", error)
      setError("Unable to load community stats")

      // Set fallback stats
      setStats({
        totalUsers: 0,
        totalPosts: 0,
        totalComments: 0,
        activeToday: 0,
      })
      setTopUsers([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="bg-background/50 border-muted">
          <CardContent className="p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-muted rounded w-1/2 mb-4"></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="h-8 bg-muted rounded"></div>
                <div className="h-8 bg-muted rounded"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Community Stats */}
      <Card className="bg-background/50 border-muted">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Community Stats</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground mb-2">{error}</p>
              <button onClick={fetchData} className="text-xs text-primary hover:underline">
                Try again
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1 text-2xl font-bold text-primary">
                    <Users className="h-5 w-5" />
                    <span>{stats.totalUsers}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Members</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1 text-2xl font-bold text-green-600">
                    <MessageSquare className="h-5 w-5" />
                    <span>{stats.totalPosts}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Posts</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.totalComments}</div>
                  <p className="text-sm text-muted-foreground">Comments</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{stats.activeToday}</div>
                  <p className="text-sm text-muted-foreground">Active Today</p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Top Contributors */}
      <Card className="bg-background/50 border-muted">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Star className="h-5 w-5" />
            <span>Top Contributors</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topUsers.length > 0 ? (
              topUsers.map((user, index) => (
                <div key={user.username || index} className="flex items-center space-x-3">
                  <Badge
                    variant="secondary"
                    className="w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs"
                  >
                    {index + 1}
                  </Badge>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar_url || "/placeholder.svg"} />
                    <AvatarFallback>{(user.full_name || user.username || "U").charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user.full_name || user.username || "Anonymous"}</p>
                    <p className="text-xs text-muted-foreground">{user.postCount} posts</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center">No contributors yet</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <Card className="bg-background/50 border-muted">
        <CardHeader>
          <CardTitle>Quick Links</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <a href="/chat" className="block text-sm text-primary hover:underline">
            💬 Join Live Chat
          </a>
          <a href="/community?category=music" className="block text-sm text-primary hover:underline">
            🎵 Latest Music Discussions
          </a>
          <a href="/community?category=events" className="block text-sm text-primary hover:underline">
            🎤 Upcoming Events
          </a>
          <a href="/community?sort=trending" className="block text-sm text-primary hover:underline">
            🔥 Trending Posts
          </a>
        </CardContent>
      </Card>
    </div>
  )
}
