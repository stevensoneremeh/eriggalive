"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, Music, Video, ImageIcon, TrendingUp, DollarSign } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

interface AdminStats {
  users: {
    total: number
    new_today: number
    active_today: number
    by_tier: Record<string, number>
  }
  content: {
    albums: number
    tracks: number
    videos: number
    gallery: number
  }
  engagement: {
    total_plays: number
    total_likes: number
    total_comments: number
    total_votes: number
  }
  revenue: {
    total_coins_purchased: number
    total_revenue: number
    pending_withdrawals: number
  }
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const { profile } = useAuth()

  useEffect(() => {
    if (!profile || (profile.tier === "grassroot" && profile.role !== "admin")) {
      return
    }
    fetchStats()
  }, [profile])

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/stats")
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error("Failed to fetch admin stats:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen py-8 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!profile || (profile.tier === "grassroot" && profile.role !== "admin")) {
    return (
      <div className="min-h-screen py-8 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="font-street text-4xl text-gradient mb-4">ACCESS DENIED</h1>
          <p className="text-muted-foreground">You need admin privileges to access this dashboard.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="font-street text-4xl md:text-6xl text-gradient mb-4">ADMIN DASHBOARD</h1>
          <p className="text-muted-foreground">Monitor and manage the Erigga fan platform</p>
        </div>

        {stats && (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-card/50 border border-orange-500/20 mb-8">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="revenue">Revenue</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.users.total.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">+{stats.users.new_today} new today</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Content</CardTitle>
                    <Music className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {(
                        stats.content.albums +
                        stats.content.tracks +
                        stats.content.videos +
                        stats.content.gallery
                      ).toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">Albums, tracks, videos & gallery</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Engagement</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {(
                        stats.engagement.total_plays +
                        stats.engagement.total_likes +
                        stats.engagement.total_comments
                      ).toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">Plays, likes & comments</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">₦{stats.revenue.total_revenue.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">Total platform revenue</p>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common administrative tasks</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button asChild className="bg-orange-500 hover:bg-orange-600 text-black">
                    <a href="/admin/upload">Upload Content</a>
                  </Button>
                  <Button asChild variant="outline">
                    <a href="/admin/users">Manage Users</a>
                  </Button>
                  <Button asChild variant="outline">
                    <a href="/admin/health">System Health</a>
                  </Button>
                  <Button asChild variant="outline">
                    <a href="/admin/reports">View Reports</a>
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>User Statistics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span>Total Users:</span>
                      <span className="font-bold">{stats.users.total.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>New Today:</span>
                      <span className="font-bold text-green-600">+{stats.users.new_today}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Active Today:</span>
                      <span className="font-bold">{stats.users.active_today.toLocaleString()}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Users by Tier</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Object.entries(stats.users.by_tier).map(([tier, count]) => (
                      <div key={tier} className="flex justify-between items-center">
                        <span className="capitalize">{tier.replace("_", " ")}:</span>
                        <Badge variant="outline">{count.toLocaleString()}</Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="content" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Albums</CardTitle>
                    <Music className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.content.albums}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Tracks</CardTitle>
                    <Music className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.content.tracks}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Videos</CardTitle>
                    <Video className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.content.videos}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Gallery Items</CardTitle>
                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.content.gallery}</div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="revenue" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Total Revenue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600">
                      ₦{stats.revenue.total_revenue.toLocaleString()}
                    </div>
                    <p className="text-sm text-muted-foreground">All-time platform revenue</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Coins Purchased</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{stats.revenue.total_coins_purchased.toLocaleString()}</div>
                    <p className="text-sm text-muted-foreground">Total coins sold</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Pending Withdrawals</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-orange-600">
                      ₦{stats.revenue.pending_withdrawals.toLocaleString()}
                    </div>
                    <p className="text-sm text-muted-foreground">Awaiting processing</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}
