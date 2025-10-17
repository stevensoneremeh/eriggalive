"use client"

import type React from "react"

import { AuthGuard } from "@/components/auth-guard"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Users,
  MessageCircle,
  Coins,
  Trophy,
  Music,
  Star,
  Crown,
  Zap,
  TrendingUp,
  Camera,
  Edit,
  Phone,
  Ticket,
  ShoppingBag,
  Eye,
  Heart,
  Activity,
  BarChart3,
  Sparkles,
  Play,
  
} from "lucide-react"
import Link from "next/link"
import { useState, useRef, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase/client"
import { motion, AnimatePresence } from "framer-motion"


interface UserStats {
  totalPosts: number
  totalComments: number
  totalVotes: number
  totalTickets: number
  totalPurchases: number
  vaultViews: number
  followersCount: number
  followingCount: number
  reputationScore: number
}

export default function DashboardPage() {
  const { user, profile, loading, refreshProfile } = useAuth()
  const { toast } = useToast()
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [userStats, setUserStats] = useState<UserStats>({
    totalPosts: 0,
    totalComments: 0,
    totalVotes: 0,
    totalTickets: 0,
    totalPurchases: 0,
    vaultViews: 0,
    followersCount: 0,
    followingCount: 0,
    reputationScore: 0,
  })
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [loadingStats, setLoadingStats] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => {
    if (user && profile) {
      // Load stats and activity in parallel for better performance
      Promise.all([loadUserStats(), loadRecentActivity()])
    }
  }, [user, profile])

  const loadUserStats = async () => {
    if (!profile || !user) return

    try {
      setLoadingStats(true)

      // Helper to safely get count from Supabase response
      const safeCount = (result: { count: number | null; error: any }) => {
        if (result.error) {
          // Only log non-404 errors (PGRST116 = table not found)
          if (result.error.code !== 'PGRST116') {
            console.error("Query error:", result.error)
            // Return 0 for actual errors, will show toast below
          }
          return 0
        }
        return result.count || 0
      }

      // Query only tables that exist in the database
      const [
        postsResult,
        commentsResult,
        votesResult,
        ticketsResult,
      ] = await Promise.all([
        supabase
          .from("community_posts")
          .select("*", { count: "exact", head: true })
          .eq("user_id", profile.id)
          .eq("is_deleted", false),
        supabase
          .from("community_comments")
          .select("*", { count: "exact", head: true })
          .eq("user_id", profile.id)
          .eq("is_deleted", false),
        supabase.from("community_post_votes")
          .select("*", { count: "exact", head: true })
          .eq("user_id", profile.id),
        supabase.from("tickets")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id),
      ])

      setUserStats({
        totalPosts: safeCount(postsResult),
        totalComments: safeCount(commentsResult),
        totalVotes: safeCount(votesResult),
        totalTickets: safeCount(ticketsResult),
        totalPurchases: 0, // Feature not yet implemented
        vaultViews: 0, // Feature not yet implemented
        followersCount: 0, // Feature not yet implemented
        followingCount: 0, // Feature not yet implemented
        reputationScore: profile.reputation_score || 0,
      })
    } catch (error) {
      console.error("Error loading user stats:", error)
      setUserStats({
        totalPosts: 0,
        totalComments: 0,
        totalVotes: 0,
        totalTickets: 0,
        totalPurchases: 0,
        vaultViews: 0,
        followersCount: 0,
        followingCount: 0,
        reputationScore: 0,
      })
    } finally {
      setLoadingStats(false)
    }
  }

  const loadRecentActivity = async () => {
    if (!profile || !user) return

    try {
      const [recentPostsResult, recentCommentsResult, recentTicketsResult] = await Promise.all([
        supabase
          .from("community_posts")
          .select("id, content, created_at")
          .eq("user_id", profile.id)
          .eq("is_deleted", false)
          .order("created_at", { ascending: false })
          .limit(3),
        supabase
          .from("community_comments")
          .select("id, content, created_at")
          .eq("user_id", profile.id)
          .eq("is_deleted", false)
          .order("created_at", { ascending: false })
          .limit(3),
        supabase
          .from("tickets")
          .select("id, ticket_number, created_at, events(title)")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(2),
      ])

      interface ActivityItem {
        type: string
        content: string
        timestamp: string
        icon: typeof MessageCircle
        color: string
      }

      const activities: ActivityItem[] = []

      // Add posts to activity
      if (recentPostsResult.data && !recentPostsResult.error) {
        recentPostsResult.data.forEach(post => {
          activities.push({
            type: "post",
            content: `Created post: ${post.content?.substring(0, 50) || 'No content'}...`,
            timestamp: post.created_at,
            icon: MessageCircle,
            color: "text-blue-500",
          })
        })
      }

      // Add comments to activity
      if (recentCommentsResult.data && !recentCommentsResult.error) {
        recentCommentsResult.data.forEach(comment => {
          activities.push({
            type: "comment",
            content: `Commented: ${comment.content?.substring(0, 50) || 'No content'}...`,
            timestamp: comment.created_at,
            icon: MessageCircle,
            color: "text-green-500",
          })
        })
      }

      // Add tickets to activity
      if (recentTicketsResult.data && !recentTicketsResult.error) {
        recentTicketsResult.data.forEach(ticket => {
          const ticketData = ticket as typeof ticket & { events?: { title?: string } }
          activities.push({
            type: "ticket",
            content: `Got ticket for ${ticketData.events?.title || "Event"}`,
            timestamp: ticket.created_at,
            icon: Ticket,
            color: "text-purple-500",
          })
        })
      }

      // Sort by timestamp and take latest 5
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      setRecentActivity(activities.slice(0, 5))
    } catch (error) {
      console.error("Error loading recent activity:", error)
      setRecentActivity([])
    }
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !profile) return

    setIsUploadingAvatar(true)

    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split(".").pop()
      const fileName = `${profile.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("eriggalive-assets")
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage.from("eriggalive-assets").getPublicUrl(uploadData.path)

      // Update user profile
      const { error: updateError } = await supabase
        .from("users")
        .update({ avatar_url: urlData.publicUrl })
        .eq("id", profile.id)

      if (updateError) throw updateError

      await refreshProfile()
      toast({
        title: "Success!",
        description: "Profile picture updated successfully.",
      })
    } catch (error: any) {
      console.error("Avatar upload error:", error)
      toast({
        title: "Error",
        description: "Failed to update profile picture. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const getTierColor = (tier: string) => {
    const normalizedTier = (tier || "erigga_citizen").toLowerCase()
    switch (normalizedTier) {
      case "erigga_citizen":
        return "bg-gradient-to-r from-blue-400 to-purple-500 text-white"
      case "erigga_indigen":
        return "bg-gradient-to-r from-orange-400 to-red-500 text-white"
      case "enterprise":
        return "bg-gradient-to-r from-yellow-400 to-orange-500 text-white"
      default:
        return "bg-gradient-to-r from-blue-400 to-purple-500 text-white"
    }
  }

  const getTierProgress = (tier: string) => {
    const normalizedTier = (tier || "erigga_citizen").toLowerCase()
    switch (normalizedTier) {
      case "erigga_citizen":
        return 33
      case "erigga_indigen":
        return 66
      case "enterprise":
        return 100
      default:
        return 33
    }
  }
  
  const getTierDisplayName = (tier: string) => {
    const normalizedTier = (tier || "erigga_citizen").toLowerCase()
    switch (normalizedTier) {
      case "erigga_citizen":
        return "Erigga Citizen"
      case "erigga_indigen":
        return "Erigga Indigen"
      case "enterprise":
        return "Enterprise"
      default:
        return "Erigga Citizen"
    }
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

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  }

  const cardHoverVariants = {
    hover: {
      scale: 1.02,
      y: -5,
      transition: {
        duration: 0.2,
      },
    },
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <motion.div
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 1,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
          className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  return (
    <AuthGuard>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden"
      >
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 8,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 10,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute top-1/2 left-1/2 w-64 h-64 bg-orange-500/5 rounded-full blur-2xl"
            animate={{
              x: [-50, 50, -50],
              y: [-30, 30, -30],
            }}
            transition={{
              duration: 12,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
        </div>

        <div className="relative z-10 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Welcome Header */}
            <motion.div variants={itemVariants} initial="hidden" animate="visible" className="mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <motion.h1
                    className="text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent mb-2"
                    animate={{
                      backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                    }}
                    transition={{
                      duration: 5,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "linear",
                    }}
                  >
                    Welcome back, {profile?.full_name || profile?.username || user?.email}!
                  </motion.h1>
                  <p className="text-gray-300 text-lg">Command center for your Erigga Live experience</p>
                </div>
                <div className="mt-4 sm:mt-0">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Badge className={`px-4 py-2 text-sm font-semibold ${getTierColor(profile?.tier || "erigga_citizen")}`}>
                      <Crown className="w-4 h-4 mr-2" />
                      {getTierDisplayName(profile?.tier || "erigga_citizen")}
                    </Badge>
                  </motion.div>
                </div>
              </div>
            </motion.div>

            {/* Stats Overview */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
            >
              {[
                {
                  title: "Coins Balance",
                  value: profile?.coins?.toLocaleString() || "0",
                  icon: Coins,
                  gradient: "from-yellow-400 to-orange-500",
                  description: "Available to spend",
                },
                {
                  title: "Level",
                  value: profile?.level || 1,
                  icon: Trophy,
                  gradient: "from-blue-400 to-purple-500",
                  description: "Current tier level",
                },
                {
                  title: "Points",
                  value: profile?.points?.toLocaleString() || "0",
                  icon: TrendingUp,
                  gradient: "from-green-400 to-emerald-500",
                  description: "Earned points",
                },
                {
                  title: "Reputation",
                  value: userStats.reputationScore.toLocaleString(),
                  icon: Star,
                  gradient: "from-purple-400 to-pink-500",
                  description: "Community score",
                },
              ].map((stat, index) => (
                <motion.div key={stat.title} variants={itemVariants} whileHover={cardHoverVariants.hover}>
                  <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/10 transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-300">{stat.title}</p>
                          <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
                          <p className="text-xs text-gray-400">{stat.description}</p>
                        </div>
                        <div
                          className={`w-16 h-16 bg-gradient-to-r ${stat.gradient} rounded-2xl flex items-center justify-center shadow-lg`}
                        >
                          <stat.icon className="w-8 h-8 text-white" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                

                {/* Activity Stats */}
                <motion.div variants={itemVariants} initial="hidden" animate="visible">
                  <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/10 transition-all duration-300">
                    <CardHeader>
                      <CardTitle className="flex items-center text-white">
                        <Activity className="w-5 h-5 mr-2 text-purple-400" />
                        Activity Overview
                      </CardTitle>
                      <CardDescription className="text-gray-300">Your engagement across the platform</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                          {
                            label: "Posts",
                            value: userStats.totalPosts,
                            icon: MessageCircle,
                            color: "from-blue-400 to-blue-600",
                          },
                          {
                            label: "Comments",
                            value: userStats.totalComments,
                            icon: MessageCircle,
                            color: "from-green-400 to-green-600",
                          },
                          {
                            label: "Votes Given",
                            value: userStats.totalVotes,
                            icon: Heart,
                            color: "from-red-400 to-red-600",
                          },
                          {
                            label: "Followers",
                            value: userStats.followersCount,
                            icon: Users,
                            color: "from-purple-400 to-purple-600",
                          },
                        ].map((item, index) => (
                          <motion.div
                            key={item.label}
                            whileHover={{ scale: 1.05 }}
                            className={`text-center p-4 bg-gradient-to-r ${item.color} rounded-xl shadow-lg`}
                          >
                            <item.icon className="w-8 h-8 text-white mx-auto mb-2" />
                            <div className="text-2xl font-bold text-white">{item.value}</div>
                            <div className="text-sm text-white/80">{item.label}</div>
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Tier Progress */}
                <motion.div variants={itemVariants} initial="hidden" animate="visible">
                  <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/10 transition-all duration-300">
                    <CardHeader>
                      <CardTitle className="flex items-center text-white">
                        <Trophy className="w-5 h-5 mr-2 text-orange-400" />
                        Your Journey
                      </CardTitle>
                      <CardDescription className="text-gray-300">
                        Progress through the Erigga Live community tiers
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-white">
                            {getTierDisplayName(profile?.tier || "erigga_citizen")} Member
                          </span>
                          <span className="text-sm text-gray-300">
                            {getTierProgress(profile?.tier || "erigga_citizen")}% Complete
                          </span>
                        </div>
                        <div className="relative">
                          <Progress value={getTierProgress(profile?.tier || "erigga_citizen")} className="h-3 bg-white/10" />
                          <motion.div
                            className="absolute top-0 left-0 h-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${getTierProgress(profile?.tier || "erigga_citizen")}%` }}
                            transition={{ duration: 1, delay: 0.5 }}
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          {[
                            { name: "Erigga Citizen", progress: 33 },
                            { name: "Erigga Indigen", progress: 66 },
                            { name: "Enterprise", progress: 100 }
                          ].map((tier, index) => (
                            <div key={tier.name} className="text-center">
                              <motion.div
                                className={`w-3 h-3 rounded-full mx-auto mb-1 ${
                                  getTierProgress(profile?.tier || "erigga_citizen") >= tier.progress
                                    ? "bg-gradient-to-r from-purple-500 to-blue-500"
                                    : "bg-white/20"
                                }`}
                                whileHover={{ scale: 1.2 }}
                              />
                              <span className="text-gray-300">{tier.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Quick Actions */}
                <motion.div variants={itemVariants} initial="hidden" animate="visible">
                  <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/10 transition-all duration-300">
                    <CardHeader>
                      <CardTitle className="flex items-center text-white">
                        <Zap className="w-5 h-5 mr-2 text-yellow-400" />
                        Quick Actions
                      </CardTitle>
                      <CardDescription className="text-gray-300">Jump into your favorite activities</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {[
                          {
                            href: "/community",
                            icon: MessageCircle,
                            label: "Community",
                            gradient: "from-blue-500 to-purple-500",
                          },
                          {
                            href: "/coins",
                            icon: Coins,
                            label: "Manage Coins",
                            gradient: "from-yellow-500 to-orange-500",
                          },
                          {
                            href: "/vault",
                            icon: Music,
                            label: "Media Vault",
                            gradient: "from-purple-500 to-pink-500",
                          },
                          {
                            href: "/tickets",
                            icon: Ticket,
                            label: "My Tickets",
                            gradient: "from-green-500 to-emerald-500",
                          },
                          { href: "/media", icon: Play, label: "Media Gallery", gradient: "from-red-500 to-pink-500" },
                          {
                            href: "/meet-and-greet",
                            icon: Phone,
                            label: "Meet & Greet",
                            gradient: "from-indigo-500 to-purple-500",
                          },
                        ].map((action, index) => (
                          <motion.div key={action.href} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button
                              asChild
                              variant="outline"
                              className={`h-20 flex-col bg-gradient-to-r ${action.gradient} border-0 text-white hover:opacity-90 transition-all duration-300`}
                            >
                              <Link href={action.href}>
                                <action.icon className="w-6 h-6 mb-2" />
                                <span className="text-sm font-medium">{action.label}</span>
                              </Link>
                            </Button>
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Profile Summary */}
                <motion.div variants={itemVariants} initial="hidden" animate="visible">
                  <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/10 transition-all duration-300">
                    <CardHeader>
                      <CardTitle className="text-white">Profile Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <motion.div whileHover={{ scale: 1.1 }}>
                            <Avatar className="h-16 w-16 ring-2 ring-purple-400">
                              <AvatarImage
                                src={profile?.avatar_url || "/placeholder-user.jpg"}
                                alt={profile?.username || "User"}
                              />
                              <AvatarFallback className="bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold text-lg">
                                {profile?.full_name?.charAt(0) ||
                                  profile?.username?.charAt(0) ||
                                  user?.email?.charAt(0) ||
                                  "U"}
                              </AvatarFallback>
                            </Avatar>
                          </motion.div>
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                            <Button
                              size="icon"
                              variant="outline"
                              className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 border-0 text-white hover:opacity-90"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={isUploadingAvatar}
                            >
                              {isUploadingAvatar ? (
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                                  className="w-3 h-3 border border-white border-t-transparent rounded-full"
                                />
                              ) : (
                                <Camera className="h-3 w-3" />
                              )}
                            </Button>
                          </motion.div>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleAvatarUpload}
                          />
                        </div>
                        <div>
                          <p className="font-medium text-lg text-white">
                            {profile?.full_name || profile?.username || "User"}
                          </p>
                          <p className="text-sm text-gray-300">@{profile?.username || "username"}</p>
                          <p className="text-xs text-gray-400">{user?.email}</p>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between text-gray-300">
                          <span>Member since:</span>
                          <span>{new Date(profile?.created_at || Date.now()).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between text-gray-300">
                          <span>Last active:</span>
                          <span className="text-green-400">Just now</span>
                        </div>
                        <div className="flex justify-between text-gray-300">
                          <span>Verified:</span>
                          <span>{profile?.is_verified ? "✅" : "❌"}</span>
                        </div>
                      </div>
                      <Button
                        asChild
                        variant="outline"
                        className="w-full bg-gradient-to-r from-purple-500 to-blue-500 border-0 text-white hover:opacity-90"
                      >
                        <Link href="/settings">
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Profile
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Platform Stats */}
                <motion.div variants={itemVariants} initial="hidden" animate="visible">
                  <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/10 transition-all duration-300">
                    <CardHeader>
                      <CardTitle className="flex items-center text-white">
                        <BarChart3 className="w-5 h-5 mr-2 text-blue-400" />
                        Platform Stats
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {[
                          { icon: Ticket, label: "Tickets", value: userStats.totalTickets, color: "text-blue-400" },
                          {
                            icon: ShoppingBag,
                            label: "Purchases",
                            value: userStats.totalPurchases,
                            color: "text-green-400",
                          },
                          { icon: Eye, label: "Vault Views", value: userStats.vaultViews, color: "text-purple-400" },
                          {
                            icon: Users,
                            label: "Following",
                            value: userStats.followingCount,
                            color: "text-orange-400",
                          },
                        ].map((stat, index) => (
                          <motion.div
                            key={stat.label}
                            className="flex justify-between items-center"
                            whileHover={{ x: 5 }}
                          >
                            <div className="flex items-center gap-2">
                              <stat.icon className={`w-4 h-4 ${stat.color}`} />
                              <span className="text-sm text-gray-300">{stat.label}</span>
                            </div>
                            <span className="font-medium text-white">{stat.value}</span>
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Recent Activity */}
                <motion.div variants={itemVariants} initial="hidden" animate="visible">
                  <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/10 transition-all duration-300">
                    <CardHeader>
                      <CardTitle className="text-white">Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 text-sm">
                        <AnimatePresence>
                          {recentActivity.length > 0 ? (
                            recentActivity.map((activity, index) => {
                              const Icon = activity.icon
                              return (
                                <motion.div
                                  key={index}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: index * 0.1 }}
                                  className="flex items-start space-x-2"
                                >
                                  <Icon className={`w-4 h-4 mt-0.5 ${activity.color}`} />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm truncate text-gray-300">{activity.content}</p>
                                    <p className="text-xs text-gray-500">
                                      {new Date(activity.timestamp).toLocaleDateString()}
                                    </p>
                                  </div>
                                </motion.div>
                              )
                            })
                          ) : (
                            <motion.p
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="text-gray-400 text-center py-4"
                            >
                              No recent activity
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Achievements */}
                <motion.div variants={itemVariants} initial="hidden" animate="visible">
                  <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/10 transition-all duration-300">
                    <CardHeader>
                      <CardTitle className="flex items-center text-white">
                        <Sparkles className="w-5 h-5 mr-2 text-yellow-400" />
                        Achievements
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { icon: Trophy, label: "First Login", color: "from-yellow-400 to-orange-500" },
                          { icon: Users, label: "Community Member", color: "from-blue-400 to-purple-500" },
                          { icon: Star, label: "Active User", color: "from-green-400 to-emerald-500" },
                        ].map((achievement, index) => (
                          <motion.div
                            key={achievement.label}
                            whileHover={{ scale: 1.05 }}
                            className={`text-center p-3 bg-gradient-to-r ${achievement.color} rounded-xl shadow-lg`}
                          >
                            <achievement.icon className="w-6 h-6 text-white mx-auto mb-1" />
                            <span className="text-xs text-white font-medium">{achievement.label}</span>
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AuthGuard>
  )
}
