"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Users,
  CreditCard,
  TrendingUp,
  Music,
  Video,
  ImageIcon,
  Heart,
  Play,
  MessageSquare,
  ThumbsUp,
  DollarSign,
  Clock,
  UserPlus,
  Activity,
  BarChart3,
  PieChart,
} from "lucide-react"

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
    total_votes: number
    total_comments: number
  }
  revenue: {
    total_coins_purchased: number
    total_revenue: number
    pending_withdrawals: number
  }
}

export default function AdminOverview() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await fetch("/api/admin/stats")
        if (!response.ok) {
          throw new Error("Failed to fetch stats")
        }
        const data = await response.json()
        setStats(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load stats")
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error loading dashboard: {error}</p>
      </div>
    )
  }

  if (!stats) return null

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 },
    },
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "grassroot":
        return "bg-green-100 text-green-800"
      case "pioneer":
        return "bg-blue-100 text-blue-800"
      case "elder":
        return "bg-purple-100 text-purple-800"
      case "blood":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Comprehensive platform analytics and management</p>
        </div>
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <Activity className="h-3 w-3 mr-1" />
          Live Data
        </Badge>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            <motion.div variants={cardVariants}>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                      <p className="text-3xl font-bold">{stats.users.total.toLocaleString()}</p>
                      <p className="text-xs text-green-600 mt-1">+{stats.users.new_today} today</p>
                    </div>
                    <Users className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={cardVariants}>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Active Today</p>
                      <p className="text-3xl font-bold">{stats.users.active_today.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {Math.round((stats.users.active_today / stats.users.total) * 100)}% of total
                      </p>
                    </div>
                    <Activity className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={cardVariants}>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                      <p className="text-3xl font-bold">₦{stats.revenue.total_revenue.toLocaleString()}</p>
                      <p className="text-xs text-orange-600 mt-1">
                        ₦{stats.revenue.pending_withdrawals.toLocaleString()} pending
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={cardVariants}>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Plays</p>
                      <p className="text-3xl font-bold">{stats.engagement.total_plays.toLocaleString()}</p>
                      <p className="text-xs text-blue-600 mt-1">
                        {stats.engagement.total_likes.toLocaleString()} likes
                      </p>
                    </div>
                    <Play className="h-8 w-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* Content Overview */}
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Content Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <Music className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold">{stats.content.tracks}</p>
                    <p className="text-sm text-muted-foreground">Tracks</p>
                  </div>
                  <div className="text-center">
                    <CreditCard className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold">{stats.content.albums}</p>
                    <p className="text-sm text-muted-foreground">Albums</p>
                  </div>
                  <div className="text-center">
                    <Video className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold">{stats.content.videos}</p>
                    <p className="text-sm text-muted-foreground">Videos</p>
                  </div>
                  <div className="text-center">
                    <ImageIcon className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold">{stats.content.gallery}</p>
                    <p className="text-sm text-muted-foreground">Gallery</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Engagement Metrics */}
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Engagement Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="flex items-center gap-3">
                    <Play className="h-6 w-6 text-red-500" />
                    <div>
                      <p className="text-lg font-bold">{stats.engagement.total_plays.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">Total Plays</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Heart className="h-6 w-6 text-pink-500" />
                    <div>
                      <p className="text-lg font-bold">{stats.engagement.total_likes.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">Total Likes</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <ThumbsUp className="h-6 w-6 text-blue-500" />
                    <div>
                      <p className="text-lg font-bold">{stats.engagement.total_votes.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">Community Votes</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-6 w-6 text-green-500" />
                    <div>
                      <p className="text-lg font-bold">{stats.engagement.total_comments.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">Comments</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          {/* User Statistics */}
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  User Distribution by Tier
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(stats.users.by_tier).map(([tier, count]) => (
                    <div key={tier} className="text-center">
                      <Badge className={getTierColor(tier)} variant="secondary">
                        {tier.toUpperCase()}
                      </Badge>
                      <p className="text-2xl font-bold mt-2">{count}</p>
                      <p className="text-sm text-muted-foreground">{Math.round((count / stats.users.total) * 100)}%</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* User Activity */}
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">New Users Today</p>
                      <p className="text-3xl font-bold text-green-600">{stats.users.new_today}</p>
                    </div>
                    <UserPlus className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Active Today</p>
                      <p className="text-3xl font-bold text-blue-600">{stats.users.active_today}</p>
                    </div>
                    <Activity className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Activity Rate</p>
                      <p className="text-3xl font-bold text-purple-600">
                        {Math.round((stats.users.active_today / stats.users.total) * 100)}%
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          {/* Content Statistics */}
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <Music className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                  <p className="text-3xl font-bold">{stats.content.tracks}</p>
                  <p className="text-sm text-muted-foreground">Music Tracks</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <CreditCard className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-3xl font-bold">{stats.content.albums}</p>
                  <p className="text-sm text-muted-foreground">Albums</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <Video className="h-12 w-12 text-purple-500 mx-auto mb-4" />
                  <p className="text-3xl font-bold">{stats.content.videos}</p>
                  <p className="text-sm text-muted-foreground">Music Videos</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <ImageIcon className="h-12 w-12 text-orange-500 mx-auto mb-4" />
                  <p className="text-3xl font-bold">{stats.content.gallery}</p>
                  <p className="text-sm text-muted-foreground">Gallery Items</p>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          {/* Revenue Statistics */}
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                      <p className="text-3xl font-bold text-green-600">
                        ₦{stats.revenue.total_revenue.toLocaleString()}
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Coins Purchased</p>
                      <p className="text-3xl font-bold text-blue-600">
                        {stats.revenue.total_coins_purchased.toLocaleString()}
                      </p>
                    </div>
                    <CreditCard className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Pending Withdrawals</p>
                      <p className="text-3xl font-bold text-orange-600">
                        ₦{stats.revenue.pending_withdrawals.toLocaleString()}
                      </p>
                    </div>
                    <Clock className="h-8 w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
