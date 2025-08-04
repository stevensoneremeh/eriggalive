"use client"

import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, FileText, Settings, Coins, Calendar, TrendingUp, Star, Music, MessageSquare } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"

export function DashboardClient() {
  const { user, profile } = useAuth()
  const [stats, setStats] = useState({
    postsCount: 0,
    commentsCount: 0,
    likesReceived: 0,
    coinsEarned: 0,
  })

  useEffect(() => {
    // Mock stats - in real app, fetch from API
    setStats({
      postsCount: 12,
      commentsCount: 45,
      likesReceived: 128,
      coinsEarned: 350,
    })
  }, [])

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "blood":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
      case "elder":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300"
      case "pioneer":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Welcome back, {profile?.full_name || profile?.username || user?.email}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Badge className={getTierColor(profile?.tier || "grassroot")}>
              {profile?.tier?.toUpperCase() || "GRASSROOT"}
            </Badge>
            <Link href="/settings">
              <Button variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Erigga Coins</CardTitle>
              <Coins className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profile?.coins?.toLocaleString() || 0}</div>
              <p className="text-xs text-muted-foreground">Your current balance</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Community Posts</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.postsCount}</div>
              <p className="text-xs text-muted-foreground">Posts you've created</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Level</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profile?.level || 1}</div>
              <p className="text-xs text-muted-foreground">{profile?.points || 0} points</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Likes Received</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.likesReceived}</div>
              <p className="text-xs text-muted-foreground">From your content</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link href="/community">
                <Button className="w-full justify-start bg-transparent" variant="outline">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Join Community Discussion
                </Button>
              </Link>
              <Link href="/vault">
                <Button className="w-full justify-start bg-transparent" variant="outline">
                  <Music className="w-4 h-4 mr-2" />
                  Explore Vault Content
                </Button>
              </Link>
              <Link href="/coins">
                <Button className="w-full justify-start bg-transparent" variant="outline">
                  <Coins className="w-4 h-4 mr-2" />
                  Manage Coins
                </Button>
              </Link>
              <Link href="/tickets">
                <Button className="w-full justify-start bg-transparent" variant="outline">
                  <Calendar className="w-4 h-4 mr-2" />
                  View Events & Tickets
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest actions and updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium">Welcome to Erigga Live!</p>
                    <p className="text-xs text-muted-foreground">Account created successfully</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium">Received welcome bonus</p>
                    <p className="text-xs text-muted-foreground">500 Erigga Coins added</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium">Tier: {profile?.tier?.toUpperCase() || "GRASSROOT"}</p>
                    <p className="text-xs text-muted-foreground">Your current membership level</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tier Benefits */}
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Your Tier Benefits</CardTitle>
            <CardDescription>You are currently a {profile?.tier?.toUpperCase() || "GRASSROOT"} member</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Users className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <h3 className="font-semibold">Community Access</h3>
                <p className="text-sm text-muted-foreground">Full access to community features</p>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Music className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                <h3 className="font-semibold">Content Library</h3>
                <p className="text-sm text-muted-foreground">Access to exclusive content</p>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Coins className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                <h3 className="font-semibold">Earn Coins</h3>
                <p className="text-sm text-muted-foreground">Earn coins through engagement</p>
              </div>
            </div>
            <div className="mt-6 text-center">
              <Link href="/premium">
                <Button>
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Upgrade Your Tier
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
