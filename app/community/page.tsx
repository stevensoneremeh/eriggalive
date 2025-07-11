"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { CommunityFeed } from "@/components/community/community-feed"
import { CreatePostForm } from "@/components/community/create-post-form-final"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Users, MessageSquare, Plus, TrendingUp, Star, MessageCircle, Zap, Crown, Flame } from "lucide-react"
import Link from "next/link"

const subscriptionTiers = [
  { value: "grassroot", label: "Grassroot", icon: Star, color: "text-green-500", href: "/chat/grassroot" },
  { value: "pioneer", label: "Pioneer", icon: Zap, color: "text-blue-500", href: "/chat/pioneer" },
  { value: "elder", label: "Elder", icon: Crown, color: "text-purple-500", href: "/chat/elder" },
  { value: "blood", label: "Blood", icon: Flame, color: "text-red-500", href: "/chat/blood" },
]

export default function CommunityPage() {
  const { isAuthenticated, profile } = useAuth()
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [stats, setStats] = useState({
    totalPosts: 0,
    totalUsers: 0,
    activeToday: 0,
  })

  useEffect(() => {
    fetchCommunityStats()
  }, [])

  const fetchCommunityStats = async () => {
    try {
      const response = await fetch("/api/community/stats")
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error("Failed to fetch community stats:", error)
    }
  }

  const userTier = profile?.tier || "grassroot"
  const availableChats = subscriptionTiers.filter((tier) => {
    const tierOrder = ["grassroot", "pioneer", "elder", "blood"]
    const userTierIndex = tierOrder.indexOf(userTier)
    const tierIndex = tierOrder.indexOf(tier.value)
    return tierIndex <= userTierIndex
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 pt-20">
      <div className="container mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Community</h1>
              <p className="text-gray-300">Connect with fellow Erigga fans</p>
            </div>
            {isAuthenticated && (
              <Dialog open={showCreatePost} onOpenChange={setShowCreatePost}>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Post
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Post</DialogTitle>
                    <DialogDescription>Share your thoughts with the community</DialogDescription>
                  </DialogHeader>
                  <CreatePostForm onSuccess={() => setShowCreatePost(false)} />
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-background/50 border-muted">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
                <MessageSquare className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalPosts.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Community discussions</p>
              </CardContent>
            </Card>

            <Card className="bg-background/50 border-muted">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Members</CardTitle>
                <Users className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Registered users</p>
              </CardContent>
            </Card>

            <Card className="bg-background/50 border-muted">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Today</CardTitle>
                <TrendingUp className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeToday.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Online members</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Chat Rooms */}
            <Card className="bg-background/50 border-muted">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageCircle className="h-5 w-5" />
                  <span>Chat Rooms</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isAuthenticated ? (
                  <>
                    {availableChats.map((tier) => {
                      const TierIcon = tier.icon
                      return (
                        <Link
                          key={tier.value}
                          href={tier.href}
                          className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
                        >
                          <div className="flex items-center space-x-2">
                            <TierIcon className={`h-4 w-4 ${tier.color}`} />
                            <span className="text-sm font-medium">{tier.label}</span>
                          </div>
                          {tier.value === userTier && (
                            <Badge variant="secondary" className="text-xs">
                              Your Tier
                            </Badge>
                          )}
                        </Link>
                      )
                    })}
                    <Link
                      href="/chat/general"
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center space-x-2">
                        <MessageCircle className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium">General Chat</span>
                      </div>
                    </Link>
                  </>
                ) : (
                  <div className="text-center p-4">
                    <p className="text-sm text-muted-foreground mb-3">Sign in to access chat rooms</p>
                    <Button asChild size="sm">
                      <Link href="/login">Sign In</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Trending Topics */}
            <Card className="bg-background/50 border-muted">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Trending</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">#NewMusic</span>
                  <Badge variant="secondary">24</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">#EriggaLive</span>
                  <Badge variant="secondary">18</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">#Bars</span>
                  <Badge variant="secondary">15</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">#Community</span>
                  <Badge variant="secondary">12</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="feed" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="feed">Latest Posts</TabsTrigger>
                <TabsTrigger value="trending">Trending</TabsTrigger>
                <TabsTrigger value="following">Following</TabsTrigger>
              </TabsList>

              <TabsContent value="feed">
                <CommunityFeed />
              </TabsContent>

              <TabsContent value="trending">
                <CommunityFeed filter="trending" />
              </TabsContent>

              <TabsContent value="following">
                {isAuthenticated ? (
                  <CommunityFeed filter="following" />
                ) : (
                  <Card className="bg-background/50 border-muted">
                    <CardContent className="text-center py-8">
                      <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">Sign in to see posts from people you follow</h3>
                      <p className="text-muted-foreground mb-4">Connect with other fans and see their latest posts</p>
                      <Button asChild>
                        <Link href="/login">Sign In</Link>
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
