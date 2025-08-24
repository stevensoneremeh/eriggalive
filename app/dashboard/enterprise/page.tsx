"use client"

import { AuthGuard } from "@/components/auth-guard"
import { useUserMembership, useWallet } from "@/hooks/useMembership"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Crown,
  Sparkles,
  Star,
  Coins,
  Music,
  Users,
  MessageCircle,
  Ticket,
  Heart,
  Activity,
  Zap,
  Phone,
  Play,
  Gift,
  Calendar,
  Award,
  Diamond,
  Gem,
  Shield,
} from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { createClient } from "@/lib/supabase/client"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"

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

export default function EnterpriseDashboardPage() {
  const { user, profile, loading } = useAuth()
  const { membership, tierCode, isActive, badgeConfig, isLoading: membershipLoading } = useUserMembership()
  const { balance, transactions, isLoading: walletLoading } = useWallet()
  const router = useRouter()
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
  const supabase = createClient()

  // Redirect non-Enterprise users
  useEffect(() => {
    if (!membershipLoading && !loading && tierCode !== "ENT") {
      router.push("/dashboard")
    }
  }, [tierCode, membershipLoading, loading, router])

  useEffect(() => {
    if (user && profile) {
      Promise.all([loadUserStats(), loadRecentActivity()])
    }
  }, [user, profile])

  const loadUserStats = async () => {
    if (!profile) return

    try {
      setLoadingStats(true)

      const [
        postsResult,
        commentsResult,
        votesResult,
        ticketsResult,
        purchasesResult,
        vaultViewsResult,
        followersResult,
        followingResult,
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
        supabase.from("community_post_votes").select("*", { count: "exact", head: true }).eq("user_id", profile.id),
        supabase.from("tickets").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("store_purchases").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("vault_views").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("user_follows").select("*", { count: "exact", head: true }).eq("following_id", profile.id),
        supabase.from("user_follows").select("*", { count: "exact", head: true }).eq("follower_id", profile.id),
      ])

      setUserStats({
        totalPosts: postsResult.count || 0,
        totalComments: commentsResult.count || 0,
        totalVotes: votesResult.count || 0,
        totalTickets: ticketsResult.count || 0,
        totalPurchases: purchasesResult.count || 0,
        vaultViews: vaultViewsResult.count || 0,
        followersCount: followersResult.count || 0,
        followingCount: followingResult.count || 0,
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

      const activities = []

      if (recentPostsResult.data) {
        recentPostsResult.data.forEach((post) => {
          activities.push({
            type: "post",
            content: `Created post: ${post.content.substring(0, 50)}...`,
            timestamp: post.created_at,
            icon: MessageCircle,
            color: "text-blue-400",
          })
        })
      }

      if (recentCommentsResult.data) {
        recentCommentsResult.data.forEach((comment) => {
          activities.push({
            type: "comment",
            content: `Commented: ${comment.content.substring(0, 50)}...`,
            timestamp: comment.created_at,
            icon: MessageCircle,
            color: "text-green-400",
          })
        })
      }

      if (recentTicketsResult.data) {
        recentTicketsResult.data.forEach((ticket) => {
          activities.push({
            type: "ticket",
            content: `Got ticket for ${ticket.events?.title || "Event"}`,
            timestamp: ticket.created_at,
            icon: Ticket,
            color: "text-yellow-400",
          })
        })
      }

      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      setRecentActivity(activities.slice(0, 5))
    } catch (error) {
      console.error("Error loading recent activity:", error)
      setRecentActivity([])
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

  if (loading || membershipLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-900 via-yellow-900 to-orange-900">
        <motion.div
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 1,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
          className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  // Show loading if not Enterprise member
  if (tierCode !== "ENT") {
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
        className="min-h-screen bg-gradient-to-br from-amber-900 via-yellow-900 to-orange-900 relative overflow-hidden"
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute top-20 left-10 w-72 h-72 bg-yellow-500/20 rounded-full blur-3xl"
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
            className="absolute bottom-20 right-10 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl"
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
            className="absolute top-1/2 left-1/2 w-64 h-64 bg-amber-500/10 rounded-full blur-2xl"
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
            <motion.div variants={itemVariants} initial="hidden" animate="visible" className="mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <motion.h1
                    className="text-4xl font-bold bg-gradient-to-r from-yellow-200 via-amber-200 to-orange-200 bg-clip-text text-transparent mb-2"
                    animate={{
                      backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                    }}
                    transition={{
                      duration: 5,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "linear",
                    }}
                  >
                    <Diamond className="inline-block w-8 h-8 mr-3 text-yellow-400" />
                    Enterprise Command Center
                  </motion.h1>
                  <p className="text-amber-200 text-lg">
                    Welcome back, {profile?.full_name || profile?.username || user?.email}!
                  </p>
                  <p className="text-amber-300/80">Your exclusive premium experience awaits</p>
                </div>
                <div className="mt-4 sm:mt-0">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Badge className="px-6 py-3 text-lg font-bold bg-gradient-to-r from-yellow-400 to-orange-500 text-black border-2 border-yellow-300">
                      <Crown className="w-6 h-6 mr-2" />
                      ENTERPRISE
                    </Badge>
                  </motion.div>
                </div>
              </div>
            </motion.div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
            >
              {[
                {
                  title: "Erigga Coins",
                  value: balance?.toLocaleString() || "0",
                  icon: Coins,
                  gradient: "from-yellow-400 to-amber-500",
                  description: "Premium balance",
                  exclusive: true,
                },
                {
                  title: "VIP Level",
                  value: "ELITE",
                  icon: Diamond,
                  gradient: "from-amber-400 to-orange-500",
                  description: "Maximum tier",
                  exclusive: true,
                },
                {
                  title: "Exclusive Access",
                  value: "UNLIMITED",
                  icon: Shield,
                  gradient: "from-orange-400 to-red-500",
                  description: "All content unlocked",
                  exclusive: true,
                },
                {
                  title: "Priority Score",
                  value: userStats.reputationScore.toLocaleString(),
                  icon: Star,
                  gradient: "from-yellow-500 to-amber-600",
                  description: "VIP community status",
                  exclusive: true,
                },
              ].map((stat, index) => (
                <motion.div key={stat.title} variants={itemVariants} whileHover={cardHoverVariants.hover}>
                  <Card className="bg-black/20 backdrop-blur-xl border-yellow-500/30 hover:bg-black/30 transition-all duration-300 relative overflow-hidden">
                    {stat.exclusive && (
                      <div className="absolute top-2 right-2">
                        <Gem className="w-4 h-4 text-yellow-400" />
                      </div>
                    )}
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-amber-200">{stat.title}</p>
                          <p className="text-3xl font-bold text-yellow-100 mb-1">{stat.value}</p>
                          <p className="text-xs text-amber-300/80">{stat.description}</p>
                        </div>
                        <div
                          className={`w-16 h-16 bg-gradient-to-r ${stat.gradient} rounded-2xl flex items-center justify-center shadow-lg border border-yellow-400/20`}
                        >
                          <stat.icon className="w-8 h-8 text-black" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                {/* Enterprise Exclusive Features */}
                <motion.div variants={itemVariants} initial="hidden" animate="visible">
                  <Card className="bg-black/20 backdrop-blur-xl border-yellow-500/30 hover:bg-black/30 transition-all duration-300">
                    <CardHeader>
                      <CardTitle className="flex items-center text-yellow-100">
                        <Sparkles className="w-5 h-5 mr-2 text-yellow-400" />
                        Enterprise Exclusive Features
                      </CardTitle>
                      <CardDescription className="text-amber-200">
                        Premium benefits available only to Enterprise members
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          {
                            title: "Direct Artist Access",
                            description: "Private messaging with Erigga",
                            icon: MessageCircle,
                            color: "from-blue-400 to-blue-600",
                          },
                          {
                            title: "VIP Events",
                            description: "Exclusive meet & greet sessions",
                            icon: Calendar,
                            color: "from-purple-400 to-purple-600",
                          },
                          {
                            title: "Early Content",
                            description: "First access to new releases",
                            icon: Play,
                            color: "from-green-400 to-green-600",
                          },
                          {
                            title: "Premium Support",
                            description: "24/7 priority assistance",
                            icon: Shield,
                            color: "from-orange-400 to-orange-600",
                          },
                        ].map((feature, index) => (
                          <motion.div
                            key={feature.title}
                            whileHover={{ scale: 1.05 }}
                            className={`p-4 bg-gradient-to-r ${feature.color} rounded-xl shadow-lg border border-yellow-400/20`}
                          >
                            <feature.icon className="w-8 h-8 text-white mb-3" />
                            <h3 className="font-bold text-white mb-1">{feature.title}</h3>
                            <p className="text-sm text-white/80">{feature.description}</p>
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Activity Overview with Enterprise styling */}
                <motion.div variants={itemVariants} initial="hidden" animate="visible">
                  <Card className="bg-black/20 backdrop-blur-xl border-yellow-500/30 hover:bg-black/30 transition-all duration-300">
                    <CardHeader>
                      <CardTitle className="flex items-center text-yellow-100">
                        <Activity className="w-5 h-5 mr-2 text-yellow-400" />
                        VIP Activity Overview
                      </CardTitle>
                      <CardDescription className="text-amber-200">Your premium engagement metrics</CardDescription>
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
                            label: "VIP Votes",
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
                            className={`text-center p-4 bg-gradient-to-r ${item.color} rounded-xl shadow-lg border border-yellow-400/20`}
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

                {/* Enterprise Quick Actions */}
                <motion.div variants={itemVariants} initial="hidden" animate="visible">
                  <Card className="bg-black/20 backdrop-blur-xl border-yellow-500/30 hover:bg-black/30 transition-all duration-300">
                    <CardHeader>
                      <CardTitle className="flex items-center text-yellow-100">
                        <Zap className="w-5 h-5 mr-2 text-yellow-400" />
                        VIP Quick Actions
                      </CardTitle>
                      <CardDescription className="text-amber-200">Premium features at your fingertips</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {[
                          {
                            href: "/community/vip",
                            icon: Crown,
                            label: "VIP Community",
                            gradient: "from-yellow-500 to-amber-500",
                          },
                          {
                            href: "/vault/exclusive",
                            icon: Music,
                            label: "Exclusive Vault",
                            gradient: "from-purple-500 to-pink-500",
                          },
                          {
                            href: "/meet-and-greet/vip",
                            icon: Phone,
                            label: "VIP Meet & Greet",
                            gradient: "from-indigo-500 to-purple-500",
                          },
                          {
                            href: "/tickets/priority",
                            icon: Ticket,
                            label: "Priority Tickets",
                            gradient: "from-green-500 to-emerald-500",
                          },
                          {
                            href: "/merch/exclusive",
                            icon: Gift,
                            label: "Exclusive Merch",
                            gradient: "from-red-500 to-pink-500",
                          },
                          {
                            href: "/support/vip",
                            icon: Shield,
                            label: "VIP Support",
                            gradient: "from-orange-500 to-red-500",
                          },
                        ].map((action, index) => (
                          <motion.div key={action.href} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button
                              asChild
                              variant="outline"
                              className={`h-20 flex-col bg-gradient-to-r ${action.gradient} border-yellow-400/30 text-white hover:opacity-90 transition-all duration-300`}
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

              <div className="space-y-6">
                {/* VIP Profile Summary */}
                <motion.div variants={itemVariants} initial="hidden" animate="visible">
                  <Card className="bg-black/20 backdrop-blur-xl border-yellow-500/30 hover:bg-black/30 transition-all duration-300">
                    <CardHeader>
                      <CardTitle className="text-yellow-100 flex items-center">
                        <Diamond className="w-5 h-5 mr-2 text-yellow-400" />
                        VIP Profile
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <motion.div whileHover={{ scale: 1.1 }}>
                            <Avatar className="h-16 w-16 ring-2 ring-yellow-400">
                              <AvatarImage
                                src={profile?.avatar_url || "/placeholder-user.jpg"}
                                alt={profile?.username || "User"}
                              />
                              <AvatarFallback className="bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-bold text-lg">
                                {profile?.full_name?.charAt(0) ||
                                  profile?.username?.charAt(0) ||
                                  user?.email?.charAt(0) ||
                                  "E"}
                              </AvatarFallback>
                            </Avatar>
                          </motion.div>
                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full flex items-center justify-center">
                            <Crown className="w-3 h-3 text-black" />
                          </div>
                        </div>
                        <div>
                          <p className="font-medium text-lg text-yellow-100">
                            {profile?.full_name || profile?.username || "VIP User"}
                          </p>
                          <p className="text-sm text-amber-200">@{profile?.username || "vip_member"}</p>
                          <p className="text-xs text-amber-300/80">{user?.email}</p>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between text-amber-200">
                          <span>Member since:</span>
                          <span>{new Date(profile?.created_at || Date.now()).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between text-amber-200">
                          <span>VIP Status:</span>
                          <span className="text-yellow-400 font-bold">ACTIVE</span>
                        </div>
                        <div className="flex justify-between text-amber-200">
                          <span>Priority Level:</span>
                          <span className="text-yellow-400">MAXIMUM</span>
                        </div>
                      </div>
                      <div className="p-3 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-400/30 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Coins className="w-5 h-5 text-yellow-400" />
                            <span className="text-yellow-100 font-medium">Coin Balance</span>
                          </div>
                          <span className="text-2xl font-bold text-yellow-400">{balance?.toLocaleString() || "0"}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* VIP Benefits */}
                <motion.div variants={itemVariants} initial="hidden" animate="visible">
                  <Card className="bg-black/20 backdrop-blur-xl border-yellow-500/30 hover:bg-black/30 transition-all duration-300">
                    <CardHeader>
                      <CardTitle className="flex items-center text-yellow-100">
                        <Award className="w-5 h-5 mr-2 text-yellow-400" />
                        VIP Benefits
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {[
                          { icon: Crown, label: "Unlimited Access", status: "Active" },
                          { icon: Shield, label: "Priority Support", status: "24/7" },
                          { icon: Gift, label: "Exclusive Merch", status: "50% Off" },
                          { icon: Calendar, label: "VIP Events", status: "Invited" },
                        ].map((benefit, index) => (
                          <motion.div
                            key={benefit.label}
                            className="flex justify-between items-center p-2 bg-yellow-500/10 rounded-lg border border-yellow-400/20"
                            whileHover={{ x: 5 }}
                          >
                            <div className="flex items-center gap-2">
                              <benefit.icon className="w-4 h-4 text-yellow-400" />
                              <span className="text-sm text-amber-200">{benefit.label}</span>
                            </div>
                            <span className="text-xs font-medium text-yellow-400">{benefit.status}</span>
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Recent VIP Activity */}
                <motion.div variants={itemVariants} initial="hidden" animate="visible">
                  <Card className="bg-black/20 backdrop-blur-xl border-yellow-500/30 hover:bg-black/30 transition-all duration-300">
                    <CardHeader>
                      <CardTitle className="text-yellow-100">Recent VIP Activity</CardTitle>
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
                                  className="flex items-start space-x-2 p-2 bg-yellow-500/10 rounded-lg border border-yellow-400/20"
                                >
                                  <Icon className={`w-4 h-4 mt-0.5 text-yellow-400`} />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm truncate text-amber-200">{activity.content}</p>
                                    <p className="text-xs text-amber-300/80">
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
                              className="text-amber-300/80 text-center py-4"
                            >
                              No recent VIP activity
                            </motion.p>
                          )}
                        </AnimatePresence>
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
