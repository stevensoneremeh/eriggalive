"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { ProfileUpload } from "@/components/dashboard/profile-upload"
import { useAuth } from "@/contexts/auth-context"
import { Music, Users, Calendar, TrendingUp, Clock, Home, Activity } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"

// Mock data for the dashboard
const mockRecentTracks = [
  { id: 1, title: "Send Her Money", artist: "Erigga ft. Yemi Alade", plays: 5200000 },
  { id: 2, title: "The Fear of God", artist: "Erigga", plays: 3800000 },
  { id: 3, title: "Area to the World", artist: "Erigga ft. Zlatan", plays: 4100000 },
]

const mockUpcomingEvents = [
  { id: 1, title: "Erigga Live in Lagos", date: "Dec 31, 2024", venue: "Eko Hotel & Suites" },
  { id: 2, title: "Street Motivation Tour - Abuja", date: "Nov 15, 2024", venue: "ICC Abuja" },
]

interface RecentActivity {
  id: number
  type: "post" | "comment" | "like" | "join"
  description: string
  timestamp: string
}

export default function DashboardPage() {
  const { profile, user } = useAuth()
  const [activeTab, setActiveTab] = useState("overview")
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [stats, setStats] = useState({
    totalPosts: 0,
    totalComments: 0,
    totalLikes: 0,
  })

  const supabase = createClient()

  useEffect(() => {
    if (profile?.id) {
      loadUserStats()
      loadRecentActivity()
    }
  }, [profile?.id])

  const loadUserStats = async () => {
    if (!profile?.id) return

    try {
      // Get user's post count
      const { count: postCount } = await supabase
        .from("community_posts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", profile.id)
        .eq("is_deleted", false)

      // Get user's comment count
      const { count: commentCount } = await supabase
        .from("community_comments")
        .select("*", { count: "exact", head: true })
        .eq("user_id", profile.id)
        .eq("is_deleted", false)

      // Get user's vote count
      const { count: voteCount } = await supabase
        .from("community_votes")
        .select("*", { count: "exact", head: true })
        .eq("user_id", profile.id)

      setStats({
        totalPosts: postCount || 0,
        totalComments: commentCount || 0,
        totalLikes: voteCount || 0,
      })
    } catch (error) {
      console.error("Error loading user stats:", error)
    }
  }

  const loadRecentActivity = async () => {
    if (!profile?.id) return

    try {
      // Get recent posts
      const { data: recentPosts } = await supabase
        .from("community_posts")
        .select("id, content, created_at")
        .eq("user_id", profile.id)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false })
        .limit(3)

      // Get recent comments
      const { data: recentComments } = await supabase
        .from("community_comments")
        .select("id, content, created_at, post_id")
        .eq("user_id", profile.id)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false })
        .limit(3)

      const activities: RecentActivity[] = []

      // Add posts to activity
      recentPosts?.forEach((post) => {
        activities.push({
          id: post.id,
          type: "post",
          description: `Posted: ${post.content.substring(0, 50)}${post.content.length > 50 ? "..." : ""}`,
          timestamp: post.created_at,
        })
      })

      // Add comments to activity
      recentComments?.forEach((comment) => {
        activities.push({
          id: comment.id,
          type: "comment",
          description: `Commented: ${comment.content.substring(0, 50)}${comment.content.length > 50 ? "..." : ""}`,
          timestamp: comment.created_at,
        })
      })

      // Sort by timestamp
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

      setRecentActivity(activities.slice(0, 5))
    } catch (error) {
      console.error("Error loading recent activity:", error)
    }
  }

  if (!profile) {
    return null // This will be handled by the DashboardLayout
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary transition-colors flex items-center">
            <Home className="h-4 w-4 mr-1" />
            Home
          </Link>
          <span>/</span>
          <span className="text-foreground">Dashboard</span>
        </nav>

        {/* Welcome Header with Profile */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Welcome back, {profile.full_name || profile.username}!
            </h1>
            <p className="text-muted-foreground">Here's what's happening with your Erigga fan account today.</p>
          </div>
          <div className="flex-shrink-0">
            <ProfileUpload currentAvatarUrl={profile.avatar_url} />
          </div>
        </div>

        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="music">Music</TabsTrigger>
            <TabsTrigger value="community">Community</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Your Balance</CardTitle>
                  <Coins className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{profile.coins || 0} Coins</div>
                  <p className="text-xs text-muted-foreground">Use coins to unlock premium content</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Membership Tier</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold capitalize">{profile.tier}</div>
                  <p className="text-xs text-muted-foreground">{getTierDescription(profile.tier)}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Community Posts</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalPosts}</div>
                  <p className="text-xs text-muted-foreground">Posts you've created</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Engagement</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalLikes + stats.totalComments}</div>
                  <p className="text-xs text-muted-foreground">Total likes and comments</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-2">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Manage your account and explore features</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button asChild className="w-full bg-green-500 hover:bg-green-600">
                    <Link href="/coins">
                      <Coins className="h-4 w-4 mr-2" />
                      Manage Coins
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full bg-transparent">
                    <Link href="/community">
                      <Users className="h-4 w-4 mr-2" />
                      Join Community
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full bg-transparent">
                    <Link href="/meet-and-greet">
                      <Calendar className="h-4 w-4 mr-2" />
                      Book Meet & Greet
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>Recent Tracks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockRecentTracks.map((track) => (
                      <div key={track.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{track.title}</p>
                          <p className="text-sm text-muted-foreground">{track.artist}</p>
                        </div>
                        <div className="flex items-center">
                          <TrendingUp className="h-4 w-4 text-muted-foreground mr-1" />
                          <span className="text-sm">{formatNumber(track.plays)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="col-span-3">
                <CardHeader>
                  <CardTitle>Upcoming Events</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockUpcomingEvents.map((event) => (
                      <div key={event.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{event.title}</p>
                          <p className="text-sm text-muted-foreground">{event.venue}</p>
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 text-muted-foreground mr-1" />
                          <span className="text-sm">{event.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Recent Activity
                </CardTitle>
                <CardDescription>Your latest interactions and posts</CardDescription>
              </CardHeader>
              <CardContent>
                {recentActivity.length > 0 ? (
                  <div className="space-y-4">
                    {recentActivity.map((activity) => (
                      <div
                        key={`${activity.type}-${activity.id}`}
                        className="flex items-start space-x-3 p-3 bg-muted/50 rounded-lg"
                      >
                        <div className="flex-shrink-0">
                          {activity.type === "post" && <Users className="h-4 w-4 text-blue-500" />}
                          {activity.type === "comment" && <Users className="h-4 w-4 text-green-500" />}
                          {activity.type === "like" && <TrendingUp className="h-4 w-4 text-red-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{activity.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(activity.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {activity.type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No recent activity</p>
                    <p className="text-sm text-muted-foreground">
                      Start engaging with the community to see your activity here
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="music" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Your Music Library</CardTitle>
                <CardDescription>Access your favorite Erigga tracks and albums</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Music className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">Visit the Media Vault for full access to music content.</p>
                  <Button asChild>
                    <Link href="/vault">
                      <Music className="h-4 w-4 mr-2" />
                      Go to Media Vault
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="community" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Community Stats</CardTitle>
                <CardDescription>Your community engagement overview</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{stats.totalPosts}</div>
                    <div className="text-sm text-muted-foreground">Posts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{stats.totalComments}</div>
                    <div className="text-sm text-muted-foreground">Comments</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{stats.totalLikes}</div>
                    <div className="text-sm text-muted-foreground">Likes Given</div>
                  </div>
                </div>
                <div className="text-center">
                  <Button asChild>
                    <Link href="/community">
                      <Users className="h-4 w-4 mr-2" />
                      Visit Community
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Events</CardTitle>
                <CardDescription>Concerts, tours, and meet & greets</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mb-6">
                  {mockUpcomingEvents.map((event) => (
                    <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{event.title}</p>
                        <p className="text-sm text-muted-foreground">{event.venue}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{event.date}</p>
                        <Badge variant="outline">Upcoming</Badge>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-center">
                  <Button asChild>
                    <Link href="/tickets">
                      <Calendar className="h-4 w-4 mr-2" />
                      View All Events
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}

// Helper function to format large numbers
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M"
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K"
  }
  return num.toString()
}

// Helper function to get tier descriptions
function getTierDescription(tier: string): string {
  switch (tier.toLowerCase()) {
    case "grassroot":
      return "Basic access to content"
    case "pioneer":
      return "Early access to new releases"
    case "elder":
      return "Exclusive content and event discounts"
    case "blood_brotherhood":
      return "VIP access to all content and events"
    default:
      return "Fan membership tier"
  }
}

// Coins icon component
function Coins(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="8" cy="8" r="6" />
      <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
      <path d="M7 6h1v4" />
      <path d="m16.71 13.88.7.71-2.82 2.82" />
    </svg>
  )
}
