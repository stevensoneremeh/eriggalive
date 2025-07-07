"use client"

import { useAuth } from "@/contexts/auth-context"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Users, MessageSquare, Coins, Trophy, Music } from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const getTierColor = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case "admin":
        return "bg-red-500"
      case "mod":
        return "bg-purple-500"
      case "elder":
        return "bg-yellow-500"
      case "blood":
        return "bg-orange-500"
      case "pioneer":
        return "bg-blue-500"
      default:
        return "bg-green-500"
    }
  }

  const stats = [
    {
      title: "Total Coins",
      value: profile?.coins || 0,
      icon: Coins,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
    {
      title: "Community Points",
      value: profile?.points || 0,
      icon: Trophy,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Messages Sent",
      value: "0", // This would come from your chat system
      icon: MessageSquare,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Friends",
      value: "0", // This would come from your social system
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
  ]

  const recentActivity = [
    {
      type: "join",
      message: "Joined Erigga Live community",
      time: "2 hours ago",
      icon: Users,
    },
    {
      type: "coins",
      message: "Earned 50 coins from daily login",
      time: "1 day ago",
      icon: Coins,
    },
    {
      type: "music",
      message: "Listened to new track 'Paper Boi'",
      time: "2 days ago",
      icon: Music,
    },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Welcome back, {profile?.username || user?.email}!</h1>
            <p className="text-gray-300 mt-2">Here's what's happening in your Erigga Live experience</p>
          </div>
          <div className="flex items-center space-x-4">
            <Badge className={`${getTierColor(profile?.tier || "grassroot")} text-white`}>
              {profile?.tier || "grassroot"} Member
            </Badge>
            <Avatar className="h-12 w-12">
              <AvatarImage src={profile?.avatar_url || ""} />
              <AvatarFallback>
                {profile?.username?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <Card key={stat.title} className="bg-white/10 backdrop-blur border-white/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-300">{stat.title}</p>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <Card className="lg:col-span-2 bg-white/10 backdrop-blur border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Recent Activity</CardTitle>
              <CardDescription className="text-gray-300">Your latest interactions and achievements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center space-x-4 p-3 rounded-lg bg-white/5">
                    <div className="p-2 rounded-full bg-white/10">
                      <activity.icon className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-white">{activity.message}</p>
                      <p className="text-xs text-gray-400">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-white/10 backdrop-blur border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Quick Actions</CardTitle>
              <CardDescription className="text-gray-300">Jump into your favorite activities</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full justify-start bg-transparent" variant="outline">
                <Link href="/community">
                  <Users className="mr-2 h-4 w-4" />
                  Join Community
                </Link>
              </Button>
              <Button asChild className="w-full justify-start bg-transparent" variant="outline">
                <Link href="/chat">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Start Chatting
                </Link>
              </Button>
              <Button asChild className="w-full justify-start bg-transparent" variant="outline">
                <Link href="/vault">
                  <Music className="mr-2 h-4 w-4" />
                  Browse Music
                </Link>
              </Button>
              <Button asChild className="w-full justify-start bg-transparent" variant="outline">
                <Link href="/coins">
                  <Coins className="mr-2 h-4 w-4" />
                  Manage Coins
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Tier Progress */}
        <Card className="bg-white/10 backdrop-blur border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Tier Progress</CardTitle>
            <CardDescription className="text-gray-300">Your journey to the next tier level</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Current Tier</span>
                <Badge className={`${getTierColor(profile?.tier || "grassroot")} text-white`}>
                  {profile?.tier || "grassroot"}
                </Badge>
              </div>
              <Progress value={33} className="h-2" />
              <div className="flex items-center justify-between text-sm text-gray-400">
                <span>Progress to next tier</span>
                <span>33%</span>
              </div>
              <p className="text-xs text-gray-400">Keep engaging with the community to unlock the next tier!</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
