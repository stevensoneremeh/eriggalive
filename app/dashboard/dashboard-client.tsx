"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Users, MessageSquare, Heart, Coins, Trophy, Music, Calendar, Crown, TrendingUp } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"

interface DashboardStats {
  totalPosts: number
  totalLikes: number
  totalComments: number
  totalFollowers: number
  vaultAccess: number
  recentActivity: any[]
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
    },
  },
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

export function DashboardClient() {
  const { user, profile, loading: authLoading } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (!user || !profile) return

    const fetchDashboardData = async () => {
      try {
        setLoading(true)

        // Fetch user stats
        const [postsResult, likesResult, commentsResult] = await Promise.all([
          supabase.from("community_posts").select("id").eq("author_id", profile.id),
          supabase.from("community_post_likes").select("id").eq("user_id", profile.id),
          supabase.from("community_comments").select("id").eq("author_id", profile.id),
        ])

        // Fetch recent activity
        const { data: recentActivity } = await supabase
          .from("community_posts")
          .select(`
            id,
            content,
            created_at,
            likes_count,
            comments_count
          `)
          .eq("author_id", profile.id)
          .order("created_at", { ascending: false })
          .limit(5)

        setStats({
          totalPosts: postsResult.data?.length || 0,
          totalLikes: likesResult.data?.length || 0,
          totalComments: commentsResult.data?.length || 0,
          totalFollowers: 0, // Implement followers system later
          vaultAccess: profile.tier === "grassroot" ? 1 : profile.tier === "pioneer" ? 2 : 3,
          recentActivity: recentActivity || [],
        })
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
        // Set default stats on error
        setStats({
          totalPosts: 0,
          totalLikes: 0,
          totalComments: 0,
          totalFollowers: 0,
          vaultAccess: 1,
          recentActivity: [],
        })
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [user, profile, supabase])

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "grassroot":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "pioneer":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
      case "elder":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "blood_brotherhood":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p className="text-muted-foreground mb-4">Please log in to access your dashboard.</p>
          <Link href="/login">
            <Button>Sign In</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 pt-20 pb-8"
    >
      <div className="container mx-auto px-4">
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
          {/* Welcome Header */}
          <motion.div variants={cardVariants} className="text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
              Welcome back, {profile.full_name || profile.username}!
            </h1>
            <p className="text-muted-foreground">Here's what's happening in your Erigga Live community</p>
          </motion.div>

          {/* Profile Overview */}
          <motion.div variants={cardVariants}>
            <Card className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-20 w-20 border-4 border-white/20">
                    <AvatarImage src={profile.avatar_url || "/placeholder-user.jpg"} alt={profile.username} />
                    <AvatarFallback className="bg-white/20 text-white text-2xl font-bold">
                      {profile.full_name?.charAt(0) || profile.username?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold">{profile.full_name || profile.username}</h2>
                    <p className="text-white/80">@{profile.username}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <Badge className={`${getTierColor(profile.tier)} text-black`}>
                        <Crown className="w-3 h-3 mr-1" />
                        {profile.tier?.replace("_", " ").toUpperCase()}
                      </Badge>
                      <div className="flex items-center space-x-1">
                        <Coins className="w-4 h-4" />
                        <span className="font-semibold">{profile.coins?.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Trophy className="w-4 h-4" />
                        <span className="font-semibold">{profile.points?.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Stats Grid */}
          <motion.div variants={cardVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {loading ? (
              // Loading skeletons
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2">
                      <Skeleton className="h-8 w-8 rounded" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-6 w-16" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <>
                <motion.div whileHover={{ scale: 1.02 }}>
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-2">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                          <MessageSquare className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Posts</p>
                          <p className="text-2xl font-bold">{stats?.totalPosts || 0}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div whileHover={{ scale: 1.02 }}>
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-2">
                        <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                          <Heart className="h-6 w-6 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Likes Given</p>
                          <p className="text-2xl font-bold">{stats?.totalLikes || 0}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div whileHover={{ scale: 1.02 }}>
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-2">
                        <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                          <MessageSquare className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Comments</p>
                          <p className="text-2xl font-bold">{stats?.totalComments || 0}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div whileHover={{ scale: 1.02 }}>
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-2">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                          <Music className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Vault Access</p>
                          <p className="text-2xl font-bold">Level {stats?.vaultAccess || 1}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </>
            )}
          </motion.div>

          {/* Quick Actions */}
          <motion.div variants={cardVariants}>
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Jump to your favorite sections</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link href="/community">
                      <Button variant="outline" className="w-full h-20 flex flex-col space-y-2 bg-transparent">
                        <Users className="h-6 w-6" />
                        <span>Community</span>
                      </Button>
                    </Link>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link href="/chat">
                      <Button variant="outline" className="w-full h-20 flex flex-col space-y-2 bg-transparent">
                        <MessageSquare className="h-6 w-6" />
                        <span>Chat</span>
                      </Button>
                    </Link>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link href="/vault">
                      <Button variant="outline" className="w-full h-20 flex flex-col space-y-2 bg-transparent">
                        <Music className="h-6 w-6" />
                        <span>Vault</span>
                      </Button>
                    </Link>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link href="/tickets">
                      <Button variant="outline" className="w-full h-20 flex flex-col space-y-2 bg-transparent">
                        <Calendar className="h-6 w-6" />
                        <span>Tickets</span>
                      </Button>
                    </Link>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Activity */}
          <motion.div variants={cardVariants}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Recent Activity</span>
                </CardTitle>
                <CardDescription>Your latest posts and interactions</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex space-x-4">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-4 w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : stats?.recentActivity && stats.recentActivity.length > 0 ? (
                  <div className="space-y-4">
                    {stats.recentActivity.map((activity, index) => (
                      <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-start space-x-4 p-4 bg-muted/50 rounded-lg"
                      >
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <MessageSquare className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">
                            {new Date(activity.created_at).toLocaleDateString()}
                          </p>
                          <p className="font-medium line-clamp-2">{activity.content}</p>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                            <span className="flex items-center space-x-1">
                              <Heart className="h-3 w-3" />
                              <span>{activity.likes_count}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <MessageSquare className="h-3 w-3" />
                              <span>{activity.comments_count}</span>
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No recent activity</p>
                    <Link href="/community">
                      <Button className="mt-4">Start Posting</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  )
}
