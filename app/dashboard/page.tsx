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
  Play,
  BarChart3,
  Activity,
} from "lucide-react"
import Link from "next/link"
import { useState, useRef, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase/client"
import { motion } from "framer-motion"

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

  // Load user statistics
  useEffect(() => {
    if (user && profile) {
      loadUserStats()
      loadRecentActivity()
    }
  }, [user, profile])

  const loadUserStats = async () => {
    if (!profile) return

    try {
      setLoadingStats(true)

      // Get community posts count
      const { count: postsCount } = await supabase
        .from("community_posts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", profile.id)
        .eq("is_deleted", false)

      // Get community comments count
      const { count: commentsCount } = await supabase
        .from("community_comments")
        .select("*", { count: "exact", head: true })
        .eq("user_id", profile.id)
        .eq("is_deleted", false)

      // Get votes given count
      const { count: votesCount } = await supabase
        .from("community_post_votes")
        .select("*", { count: "exact", head: true })
        .eq("user_id", profile.id)

      // Get tickets count
      const { count: ticketsCount } = await supabase
        .from("tickets")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)

      // Get purchases count
      const { count: purchasesCount } = await supabase
        .from("store_purchases")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)

      // Get vault views count
      const { count: vaultViewsCount } = await supabase
        .from("vault_views")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)

      // Get followers count
      const { count: followersCount } = await supabase
        .from("user_follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", profile.id)

      // Get following count
      const { count: followingCount } = await supabase
        .from("user_follows")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", profile.id)

      setUserStats({
        totalPosts: postsCount || 0,
        totalComments: commentsCount || 0,
        totalVotes: votesCount || 0,
        totalTickets: ticketsCount || 0,
        totalPurchases: purchasesCount || 0,
        vaultViews: vaultViewsCount || 0,
        followersCount: followersCount || 0,
        followingCount: followingCount || 0,
        reputationScore: profile.reputation_score || 0,
      })
    } catch (error) {
      console.error("Error loading user stats:", error)
    } finally {
      setLoadingStats(false)
    }
  }

  const loadRecentActivity = async () => {
    if (!profile) return

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
        .select("id, content, created_at")
        .eq("user_id", profile.id)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false })
        .limit(3)

      // Get recent tickets
      const { data: recentTickets } = await supabase
        .from("tickets")
        .select("id, ticket_number, created_at, events(title)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(2)

      const activities = []

      // Add posts to activity
      if (recentPosts) {
        recentPosts.forEach((post) => {
          activities.push({
            type: "post",
            content: `Created post: ${post.content.substring(0, 50)}...`,
            timestamp: post.created_at,
            icon: MessageCircle,
            color: "text-blue-500",
          })
        })
      }

      // Add comments to activity
      if (recentComments) {
        recentComments.forEach((comment) => {
          activities.push({
            type: "comment",
            content: `Commented: ${comment.content.substring(0, 50)}...`,
            timestamp: comment.created_at,
            icon: MessageCircle,
            color: "text-green-500",
          })
        })
      }

      // Add tickets to activity
      if (recentTickets) {
        recentTickets.forEach((ticket) => {
          activities.push({
            type: "ticket",
            content: `Got ticket for ${ticket.events?.title || "Event"}`,
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

  const getTierProgress = (tier: string) => {
    switch (tier) {
      case "grassroot":
        return 25
      case "pioneer":
        return 50
      case "elder":
        return 75
      case "blood_brotherhood":
        return 100
      default:
        return 0
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  return (
    <AuthGuard>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 sm:p-6 lg:p-8"
      >
        <div className="max-w-7xl mx-auto">
          {/* Welcome Header */}
          <motion.div variants={itemVariants} initial="hidden" animate="visible" className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Welcome back, {profile?.full_name || profile?.username || user?.email}!
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  Here's what's happening in your Erigga Live community
                </p>
              </div>
              <div className="mt-4 sm:mt-0">
                <Badge className={`px-3 py-1 ${getTierColor(profile?.tier || "grassroot")}`}>
                  <Crown className="w-4 h-4 mr-1" />
                  {profile?.tier?.replace("_", " ").toUpperCase() || "GRASSROOT"}
                </Badge>
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
            <motion.div variants={itemVariants}>
              <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-yellow-700">Coins Balance</p>
                      <p className="text-3xl font-bold text-yellow-800">{profile?.coins?.toLocaleString() || "0"}</p>
                      <p className="text-xs text-yellow-600 mt-1">Available to spend</p>
                    </div>
                    <div className="w-14 h-14 bg-yellow-200 rounded-full flex items-center justify-center">
                      <Coins className="w-7 h-7 text-yellow-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-700">Level</p>
                      <p className="text-3xl font-bold text-blue-800">{profile?.level || 1}</p>
                      <p className="text-xs text-blue-600 mt-1">Current tier level</p>
                    </div>
                    <div className="w-14 h-14 bg-blue-200 rounded-full flex items-center justify-center">
                      <Trophy className="w-7 h-7 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-700">Points</p>
                      <p className="text-3xl font-bold text-green-800">{profile?.points?.toLocaleString() || "0"}</p>
                      <p className="text-xs text-green-600 mt-1">Earned points</p>
                    </div>
                    <div className="w-14 h-14 bg-green-200 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-7 h-7 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-700">Reputation</p>
                      <p className="text-3xl font-bold text-purple-800">{userStats.reputationScore.toLocaleString()}</p>
                      <p className="text-xs text-purple-600 mt-1">Community score</p>
                    </div>
                    <div className="w-14 h-14 bg-purple-200 rounded-full flex items-center justify-center">
                      <Star className="w-7 h-7 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Activity Stats */}
              <motion.div variants={itemVariants} initial="hidden" animate="visible">
                <Card className="bg-white/80 backdrop-blur-sm border-gray-200 hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Activity className="w-5 h-5 mr-2 text-orange-500" />
                      Your Activity Overview
                    </CardTitle>
                    <CardDescription>Your engagement across the platform</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200"
                      >
                        <MessageCircle className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-blue-700">{userStats.totalPosts}</div>
                        <div className="text-sm text-blue-600">Posts</div>
                      </motion.div>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200"
                      >
                        <MessageCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-green-700">{userStats.totalComments}</div>
                        <div className="text-sm text-green-600">Comments</div>
                      </motion.div>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="text-center p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-lg border border-red-200"
                      >
                        <Heart className="w-8 h-8 text-red-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-red-700">{userStats.totalVotes}</div>
                        <div className="text-sm text-red-600">Votes Given</div>
                      </motion.div>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200"
                      >
                        <Users className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-purple-700">{userStats.followersCount}</div>
                        <div className="text-sm text-purple-600">Followers</div>
                      </motion.div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Tier Progress */}
              <motion.div variants={itemVariants} initial="hidden" animate="visible">
                <Card className="bg-white/80 backdrop-blur-sm border-gray-200 hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Trophy className="w-5 h-5 mr-2 text-orange-500" />
                      Your Journey
                    </CardTitle>
                    <CardDescription>Progress through the Erigga Live community tiers</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {profile?.tier?.replace("_", " ").toUpperCase() || "GRASSROOT"} Member
                        </span>
                        <span className="text-sm text-gray-500">
                          {getTierProgress(profile?.tier || "grassroot")}% Complete
                        </span>
                      </div>
                      <Progress value={getTierProgress(profile?.tier || "grassroot")} className="h-3" />
                      <div className="grid grid-cols-4 gap-2 text-xs">
                        <div className="text-center">
                          <div
                            className={`w-3 h-3 rounded-full mx-auto mb-1 ${
                              getTierProgress(profile?.tier || "grassroot") >= 25 ? "bg-green-500" : "bg-gray-300"
                            }`}
                          />
                          <span>Grassroot</span>
                        </div>
                        <div className="text-center">
                          <div
                            className={`w-3 h-3 rounded-full mx-auto mb-1 ${
                              getTierProgress(profile?.tier || "grassroot") >= 50 ? "bg-purple-500" : "bg-gray-300"
                            }`}
                          />
                          <span>Pioneer</span>
                        </div>
                        <div className="text-center">
                          <div
                            className={`w-3 h-3 rounded-full mx-auto mb-1 ${
                              getTierProgress(profile?.tier || "grassroot") >= 75 ? "bg-blue-500" : "bg-gray-300"
                            }`}
                          />
                          <span>Elder</span>
                        </div>
                        <div className="text-center">
                          <div
                            className={`w-3 h-3 rounded-full mx-auto mb-1 ${
                              getTierProgress(profile?.tier || "grassroot") >= 100 ? "bg-yellow-500" : "bg-gray-300"
                            }`}
                          />
                          <span>Blood Brotherhood</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Quick Actions */}
              <motion.div variants={itemVariants} initial="hidden" animate="visible">
                <Card className="bg-white/80 backdrop-blur-sm border-gray-200 hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Zap className="w-5 h-5 mr-2 text-orange-500" />
                      Quick Actions
                    </CardTitle>
                    <CardDescription>Jump into your favorite activities</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          asChild
                          variant="outline"
                          className="h-20 flex-col bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-md"
                        >
                          <Link href="/community">
                            <MessageCircle className="w-6 h-6 mb-2 text-blue-600" />
                            <span className="text-sm text-blue-700">Community</span>
                          </Link>
                        </Button>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          asChild
                          variant="outline"
                          className="h-20 flex-col bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 hover:shadow-md"
                        >
                          <Link href="/coins">
                            <Coins className="w-6 h-6 mb-2 text-yellow-600" />
                            <span className="text-sm text-yellow-700">Manage Coins</span>
                          </Link>
                        </Button>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          asChild
                          variant="outline"
                          className="h-20 flex-col bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-md"
                        >
                          <Link href="/vault">
                            <Music className="w-6 h-6 mb-2 text-purple-600" />
                            <span className="text-sm text-purple-700">Media Vault</span>
                          </Link>
                        </Button>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          asChild
                          variant="outline"
                          className="h-20 flex-col bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-md"
                        >
                          <Link href="/tickets">
                            <Ticket className="w-6 h-6 mb-2 text-green-600" />
                            <span className="text-sm text-green-700">My Tickets</span>
                          </Link>
                        </Button>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          asChild
                          variant="outline"
                          className="h-20 flex-col bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-md"
                        >
                          <Link href="/media">
                            <Play className="w-6 h-6 mb-2 text-orange-600" />
                            <span className="text-sm text-orange-700">Media Gallery</span>
                          </Link>
                        </Button>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          asChild
                          variant="outline"
                          className="h-20 flex-col bg-gradient-to-br from-red-50 to-red-100 border-red-200 hover:shadow-md"
                        >
                          <Link href="/meet-and-greet">
                            <Phone className="w-6 h-6 mb-2 text-red-600" />
                            <span className="text-sm text-red-700 font-medium">Meet & Greet</span>
                          </Link>
                        </Button>
                      </motion.div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Profile Summary */}
              <motion.div variants={itemVariants} initial="hidden" animate="visible">
                <Card className="bg-white/80 backdrop-blur-sm border-gray-200 hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <CardTitle>Profile Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <Avatar className="h-16 w-16 ring-2 ring-orange-200">
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
                        <Button
                          size="icon"
                          variant="outline"
                          className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-white shadow-md hover:shadow-lg"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploadingAvatar}
                        >
                          {isUploadingAvatar ? (
                            <div className="animate-spin rounded-full h-3 w-3 border border-primary border-t-transparent" />
                          ) : (
                            <Camera className="h-3 w-3" />
                          )}
                        </Button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleAvatarUpload}
                        />
                      </div>
                      <div>
                        <p className="font-medium text-lg">{profile?.full_name || profile?.username || "User"}</p>
                        <p className="text-sm text-gray-500">@{profile?.username || "username"}</p>
                        <p className="text-xs text-gray-400">{user?.email}</p>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Member since:</span>
                        <span>{new Date(profile?.created_at || Date.now()).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Last active:</span>
                        <span>Just now</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Verified:</span>
                        <span>{profile?.is_verified ? "✅" : "❌"}</span>
                      </div>
                    </div>
                    <Button asChild variant="outline" className="w-full bg-transparent hover:bg-gray-50">
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
                <Card className="bg-white/80 backdrop-blur-sm border-gray-200 hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <BarChart3 className="w-5 h-5 mr-2 text-orange-500" />
                      Platform Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Ticket className="w-4 h-4 text-blue-500" />
                          <span className="text-sm">Tickets</span>
                        </div>
                        <span className="font-medium">{userStats.totalTickets}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <ShoppingBag className="w-4 h-4 text-green-500" />
                          <span className="text-sm">Purchases</span>
                        </div>
                        <span className="font-medium">{userStats.totalPurchases}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Eye className="w-4 h-4 text-purple-500" />
                          <span className="text-sm">Vault Views</span>
                        </div>
                        <span className="font-medium">{userStats.vaultViews}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-orange-500" />
                          <span className="text-sm">Following</span>
                        </div>
                        <span className="font-medium">{userStats.followingCount}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Recent Activity */}
              <motion.div variants={itemVariants} initial="hidden" animate="visible">
                <Card className="bg-white/80 backdrop-blur-sm border-gray-200 hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm">
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
                                <p className="text-sm truncate">{activity.content}</p>
                                <p className="text-xs text-gray-500">
                                  {new Date(activity.timestamp).toLocaleDateString()}
                                </p>
                              </div>
                            </motion.div>
                          )
                        })
                      ) : (
                        <p className="text-gray-500 text-center py-4">No recent activity</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Achievements */}
              <motion.div variants={itemVariants} initial="hidden" animate="visible">
                <Card className="bg-white/80 backdrop-blur-sm border-gray-200 hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <CardTitle>Achievements</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-2">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="text-center p-2 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg border border-yellow-200"
                      >
                        <Trophy className="w-6 h-6 text-yellow-600 mx-auto mb-1" />
                        <span className="text-xs">First Login</span>
                      </motion.div>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="text-center p-2 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200"
                      >
                        <Users className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                        <span className="text-xs">Community Member</span>
                      </motion.div>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="text-center p-2 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200"
                      >
                        <Star className="w-6 h-6 text-green-600 mx-auto mb-1" />
                        <span className="text-xs">Active User</span>
                      </motion.div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
    </AuthGuard>
  )
}
