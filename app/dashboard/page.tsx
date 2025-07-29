"use client"

import { AuthGuard } from "@/components/auth-guard"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  Coins,
  Users,
  MessageSquare,
  Heart,
  Trophy,
  Calendar,
  TrendingUp,
  Star,
  Radio,
  ShoppingBag,
  Ticket,
  Crown,
  Zap,
  Target,
  Award,
} from "lucide-react"
import Link from "next/link"

function DashboardContent() {
  const { profile, user } = useAuth()

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const getTierColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case "grassroot":
        return "bg-green-500"
      case "general":
        return "bg-blue-500"
      case "premium":
        return "bg-purple-500"
      case "vip":
        return "bg-yellow-500"
      default:
        return "bg-gray-500"
    }
  }

  const getTierIcon = (tier: string) => {
    switch (tier.toLowerCase()) {
      case "grassroot":
        return <Users className="w-4 h-4" />
      case "general":
        return <Star className="w-4 h-4" />
      case "premium":
        return <Crown className="w-4 h-4" />
      case "vip":
        return <Trophy className="w-4 h-4" />
      default:
        return <Users className="w-4 h-4" />
    }
  }

  // Calculate level based on total activity
  const totalActivity = profile.total_posts + profile.total_comments + profile.total_votes_received
  const currentLevel = Math.floor(totalActivity / 10) + 1
  const nextLevelProgress = ((totalActivity % 10) / 10) * 100

  const quickActions = [
    {
      title: "Community",
      description: "Join discussions",
      icon: <Users className="w-5 h-5" />,
      href: "/community",
      color: "bg-blue-500",
    },
    {
      title: "Buy Coins",
      description: "Purchase more coins",
      icon: <Coins className="w-5 h-5" />,
      href: "/coins",
      color: "bg-yellow-500",
    },
    {
      title: "Radio",
      description: "Listen to music",
      icon: <Radio className="w-5 h-5" />,
      href: "/radio",
      color: "bg-purple-500",
    },
    {
      title: "Merchandise",
      description: "Shop exclusive items",
      icon: <ShoppingBag className="w-5 h-5" />,
      href: "/merch",
      color: "bg-green-500",
    },
    {
      title: "Meet & Greet",
      description: "Book sessions",
      icon: <Calendar className="w-5 h-5" />,
      href: "/meet-greet",
      color: "bg-red-500",
    },
    {
      title: "Tickets",
      description: "Event tickets",
      icon: <Ticket className="w-5 h-5" />,
      href: "/tickets",
      color: "bg-indigo-500",
    },
  ]

  const achievements = [
    {
      title: "First Post",
      description: "Created your first community post",
      icon: <MessageSquare className="w-4 h-4" />,
      earned: profile.total_posts > 0,
    },
    {
      title: "Popular Creator",
      description: "Received 10+ votes on your posts",
      icon: <Heart className="w-4 h-4" />,
      earned: profile.total_votes_received >= 10,
    },
    {
      title: "Active Member",
      description: "Made 5+ comments",
      icon: <Users className="w-4 h-4" />,
      earned: profile.total_comments >= 5,
    },
    {
      title: "Coin Collector",
      description: "Accumulated 1000+ coins",
      icon: <Coins className="w-4 h-4" />,
      earned: profile.coins_balance >= 1000,
    },
  ]

  const recentActivity = [
    {
      type: "post",
      title: "Created a new post in General",
      time: "2 hours ago",
      icon: <MessageSquare className="w-4 h-4 text-blue-500" />,
    },
    {
      type: "coins",
      title: "Earned 50 coins from community engagement",
      time: "1 day ago",
      icon: <Coins className="w-4 h-4 text-yellow-500" />,
    },
    {
      type: "vote",
      title: "Received 5 upvotes on your post",
      time: "2 days ago",
      icon: <Heart className="w-4 h-4 text-red-500" />,
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {profile.display_name}!</h1>
          <p className="text-gray-600">Here's what's happening in your Erigga Mission journey</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile & Stats */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Card */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={profile.avatar_url || ""} alt={profile.display_name} />
                    <AvatarFallback className="text-lg font-semibold">
                      {profile.display_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg">{profile.display_name}</h3>
                      {profile.is_verified && (
                        <Badge variant="secondary" className="text-xs">
                          ✓ Verified
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">@{profile.username}</p>
                    <Badge className={`${getTierColor(profile.subscription_tier)} text-white text-xs mt-2`}>
                      {getTierIcon(profile.subscription_tier)}
                      <span className="ml-1 capitalize">{profile.subscription_tier}</span>
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {profile.bio && <p className="text-sm text-gray-600 mb-4">{profile.bio}</p>}
                {profile.location && <p className="text-xs text-muted-foreground mb-4">📍 {profile.location}</p>}

                {/* Level Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Level {currentLevel}</span>
                    <span className="text-xs text-muted-foreground">{totalActivity % 10}/10 XP</span>
                  </div>
                  <Progress value={nextLevelProgress} className="h-2" />
                  <p className="text-xs text-muted-foreground">{10 - (totalActivity % 10)} XP to next level</p>
                </div>
              </CardContent>
            </Card>

            {/* Coin Balance */}
            <Card className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-white">
                  <Coins className="w-5 h-5" />
                  Coin Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2">{profile.coins_balance.toLocaleString()}</div>
                <p className="text-yellow-100 text-sm mb-4">≈ ₦{(profile.coins_balance * 0.5).toLocaleString()} NGN</p>
                <Button asChild size="sm" className="bg-white text-orange-600 hover:bg-gray-100">
                  <Link href="/coins">
                    <Zap className="w-4 h-4 mr-2" />
                    Buy More Coins
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Activity Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Activity Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">Posts</span>
                  </div>
                  <span className="font-semibold">{profile.total_posts}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-red-500" />
                    <span className="text-sm">Votes Received</span>
                  </div>
                  <span className="font-semibold">{profile.total_votes_received}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Comments</span>
                  </div>
                  <span className="font-semibold">{profile.total_comments}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total XP</span>
                  <span className="font-bold text-primary">{totalActivity}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Quick Actions & Activity */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {quickActions.map((action, index) => (
                    <Link key={index} href={action.href}>
                      <Card className="hover:shadow-md transition-shadow cursor-pointer group">
                        <CardContent className="p-4 text-center">
                          <div
                            className={`w-12 h-12 ${action.color} rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}
                          >
                            <div className="text-white">{action.icon}</div>
                          </div>
                          <h4 className="font-semibold text-sm mb-1">{action.title}</h4>
                          <p className="text-xs text-muted-foreground">{action.description}</p>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Achievements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Achievements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {achievements.map((achievement, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border-2 ${
                        achievement.earned ? "border-green-200 bg-green-50" : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            achievement.earned ? "bg-green-500 text-white" : "bg-gray-300 text-gray-500"
                          }`}
                        >
                          {achievement.icon}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm">{achievement.title}</h4>
                          <p className="text-xs text-muted-foreground">{achievement.description}</p>
                        </div>
                        {achievement.earned && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            ✓
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                      <div className="flex-shrink-0">{activity.icon}</div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.title}</p>
                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full mt-4 bg-transparent" asChild>
                  <Link href="/profile">View Full Activity</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  )
}
