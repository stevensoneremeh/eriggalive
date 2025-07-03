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
  const supabase = createClient()

  useEffect(() => {
    fetchStats()
    fetchTopUsers()
  }, [])

  const fetchStats = async () => {
    try {
      // Get total users
      const { count: userCount } = await supabase.from("profiles").select("*", { count: "exact", head: true })

      // Get total posts
      const { count: postCount } = await supabase.from("posts").select("*", { count: "exact", head: true })

      // Get total comments
      const { count: commentCount } = await supabase.from("comments").select("*", { count: "exact", head: true })

      setStats({
        totalUsers: userCount || 0,
        totalPosts: postCount || 0,
        totalComments: commentCount || 0,
        activeToday: Math.floor((userCount || 0) * 0.1), // Simulate active users
      })
    } catch (error) {
      console.error("Error fetching stats:", error)
    }
  }

  const fetchTopUsers = async () => {
    try {
      const { data } = await supabase
        .from("posts")
        .select(`
          author_id,
          profiles:author_id (username, display_name, avatar_url)
        `)
        .limit(5)

      // Group by author and count posts
      const userCounts: { [key: string]: any } = {}
      data?.forEach((post) => {
        const authorId = post.author_id
        if (!userCounts[authorId]) {
          userCounts[authorId] = {
            ...post.profiles,
            postCount: 0,
          }
        }
        userCounts[authorId].postCount++
      })

      const sortedUsers = Object.values(userCounts)
        .sort((a: any, b: any) => b.postCount - a.postCount)
        .slice(0, 5)

      setTopUsers(sortedUsers)
    } catch (error) {
      console.error("Error fetching top users:", error)
    }
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
            {topUsers.map((user, index) => (
              <div key={user.username} className="flex items-center space-x-3">
                <Badge
                  variant="secondary"
                  className="w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs"
                >
                  {index + 1}
                </Badge>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatar_url || "/placeholder.svg"} />
                  <AvatarFallback>{(user.display_name || user.username).charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.display_name || user.username}</p>
                  <p className="text-xs text-muted-foreground">{user.postCount} posts</p>
                </div>
              </div>
            ))}
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
