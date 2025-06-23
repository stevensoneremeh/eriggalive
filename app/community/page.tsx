"use client"

import { Suspense, useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { EnhancedCreatePostForm } from "@/components/community/enhanced-create-post-form"
import { EnhancedPostFeed } from "@/components/community/enhanced-post-feed"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  TrendingUp,
  Users,
  Hash,
  Crown,
  Activity,
  MessageSquare,
  Heart,
  Eye,
  RefreshCw,
  AlertCircle,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface Category {
  id: number
  name: string
  slug: string
  description?: string
  is_active: boolean
}

interface CommunityStats {
  totalMembers: number
  postsToday: number
  activeNow: number
  totalPosts: number
  totalVotes: number
  totalComments: number
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <Skeleton className="w-12 h-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-48 w-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function TrendingSidebar() {
  const [stats, setStats] = useState<CommunityStats>({
    totalMembers: 12450,
    postsToday: 89,
    activeNow: 234,
    totalPosts: 5678,
    totalVotes: 23456,
    totalComments: 8901,
  })
  const [loading, setLoading] = useState(false)

  const refreshStats = useCallback(async () => {
    setLoading(true)
    try {
      // Simulate API call - replace with actual stats fetching
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setStats((prev) => ({
        ...prev,
        postsToday: prev.postsToday + Math.floor(Math.random() * 5),
        activeNow: prev.activeNow + Math.floor(Math.random() * 10) - 5,
      }))
    } catch (error) {
      console.error("Error refreshing stats:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  return (
    <div className="space-y-6">
      {/* Community Stats */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="flex items-center text-lg">
            <Activity className="w-5 h-5 mr-2" />
            Community Stats
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={refreshStats} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-center mb-1">
                  <Users className="h-4 w-4 text-blue-600 mr-1" />
                </div>
                <div className="text-2xl font-bold text-blue-600">{stats.totalMembers.toLocaleString()}</div>
                <div className="text-xs text-blue-600">Members</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="flex items-center justify-center mb-1">
                  <MessageSquare className="h-4 w-4 text-green-600 mr-1" />
                </div>
                <div className="text-2xl font-bold text-green-600">{stats.postsToday}</div>
                <div className="text-xs text-green-600">Posts Today</div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Active Now</span>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  <span className="font-semibold text-green-600">{stats.activeNow}</span>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Posts</span>
                <span className="font-semibold">{stats.totalPosts.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Votes</span>
                <span className="font-semibold">{stats.totalVotes.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Comments</span>
                <span className="font-semibold">{stats.totalComments.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trending Topics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <TrendingUp className="w-5 h-5 mr-2" />
            Trending Topics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { tag: "#EriggaLive", posts: "10k", trend: "+15%" },
              { tag: "#NewMusic", posts: "8k", trend: "+12%" },
              { tag: "#Community", posts: "6k", trend: "+8%" },
              { tag: "#Bars", posts: "4k", trend: "+5%" },
              { tag: "#Nigeria", posts: "2k", trend: "+3%" },
            ].map((item, index) => (
              <div
                key={item.tag}
                className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
              >
                <div className="flex items-center space-x-2">
                  <Hash className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">{item.tag}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{item.posts}</div>
                  <div className="text-xs text-green-600">{item.trend}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Contributors */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Crown className="w-5 h-5 mr-2" />
            Top Contributors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { username: "eriggaofficial", votes: 2500, tier: "blood", avatar: "/placeholder-user.jpg" },
              { username: "warriking", votes: 1800, tier: "pioneer", avatar: "/placeholder-user.jpg" },
              { username: "naijafan", votes: 1200, tier: "grassroot", avatar: "/placeholder-user.jpg" },
              { username: "musiclover", votes: 950, tier: "elder", avatar: "/placeholder-user.jpg" },
              { username: "southsouth", votes: 780, tier: "pioneer", avatar: "/placeholder-user.jpg" },
            ].map((user, index) => (
              <div
                key={user.username}
                className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-500 w-6">#{index + 1}</span>
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user.avatar || "/placeholder.svg"} />
                    <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium text-sm">{user.username}</div>
                    <div className="text-xs text-gray-500 flex items-center">
                      <Heart className="h-3 w-3 mr-1" />
                      {user.votes} votes
                    </div>
                  </div>
                </div>
                <Badge
                  className={`${
                    user.tier === "blood"
                      ? "bg-red-500"
                      : user.tier === "pioneer"
                        ? "bg-blue-500"
                        : user.tier === "elder"
                          ? "bg-purple-500"
                          : "bg-green-500"
                  } text-white text-xs`}
                >
                  {user.tier}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-start" size="sm">
              <Hash className="h-4 w-4 mr-2" />
              Browse Topics
            </Button>
            <Button variant="outline" className="w-full justify-start" size="sm">
              <Users className="h-4 w-4 mr-2" />
              Find Users
            </Button>
            <Button variant="outline" className="w-full justify-start" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              View Guidelines
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function CommunityPage() {
  const supabase = createClient()
  const [categories, setCategories] = useState<Category[]>([])
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      setError(null)

      // Fixed query order: select -> order -> filter
      const { data, error: fetchError } = await supabase
        .from("community_categories")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true })

      if (fetchError) {
        console.error("Error loading categories:", fetchError)
        // Set default categories as fallback
        setCategories([
          { id: 1, name: "General Discussion", slug: "general", is_active: true },
          { id: 2, name: "Music & Lyrics", slug: "music", is_active: true },
          { id: 3, name: "Events & Shows", slug: "events", is_active: true },
          { id: 4, name: "Freestyle Corner", slug: "freestyle", is_active: true },
          { id: 5, name: "Fan Art", slug: "art", is_active: true },
          { id: 6, name: "News & Updates", slug: "news", is_active: true },
          { id: 7, name: "Community Support", slug: "support", is_active: true },
        ])
      } else {
        setCategories(data || [])
      }
    } catch (error: any) {
      console.error("Error loading categories:", error)
      setError("Failed to load categories. Using default categories.")
      setCategories([
        { id: 1, name: "General Discussion", slug: "general", is_active: true },
        { id: 2, name: "Music & Lyrics", slug: "music", is_active: true },
        { id: 3, name: "Events & Shows", slug: "events", is_active: true },
        { id: 4, name: "Freestyle Corner", slug: "freestyle", is_active: true },
        { id: 5, name: "Fan Art", slug: "art", is_active: true },
        { id: 6, name: "News & Updates", slug: "news", is_active: true },
        { id: 7, name: "Community Support", slug: "support", is_active: true },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handlePostCreated = useCallback((newPost: any) => {
    // Add the new post to the beginning of the posts array
    setPosts((prevPosts) => [newPost, ...prevPosts])
    toast.success("Post created successfully! 🎉")
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3">
              <div className="mb-6">
                <Skeleton className="h-8 w-64 mb-2" />
                <Skeleton className="h-4 w-96" />
              </div>
              <LoadingSkeleton />
            </div>
            <div className="hidden lg:block">
              <div className="space-y-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <Skeleton className="h-6 w-32" />
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Community</h1>
          <p className="text-lg text-gray-600 max-w-2xl">
            Connect with fellow Erigga fans, share your passion for music, and join the conversation. Everyone is
            welcome to participate and share their thoughts!
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Create Post Form */}
            <EnhancedCreatePostForm categories={categories} onPostCreated={handlePostCreated} className="mb-8" />

            {/* Posts Feed */}
            <Suspense fallback={<LoadingSkeleton />}>
              <EnhancedPostFeed categories={categories} initialPosts={posts} />
            </Suspense>
          </div>

          {/* Sidebar */}
          <div className="hidden lg:block">
            <div className="sticky top-24">
              <TrendingSidebar />
            </div>
          </div>
        </div>

        {/* Mobile Sidebar */}
        <div className="lg:hidden mt-8">
          <TrendingSidebar />
        </div>
      </div>
    </div>
  )
}
