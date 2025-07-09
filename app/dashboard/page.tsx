"use client"

import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Music,
  MessageSquare,
  Trophy,
  Coins,
  TrendingUp,
  Heart,
  Play,
  Share2,
  Settings,
  Bell,
  Star,
  Users,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function DashboardPage() {
  const { user, profile, loading, isAuthenticated, isInitialized } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isInitialized && !isAuthenticated && !loading) {
      router.push("/login?redirect=/dashboard")
    }
  }, [isAuthenticated, loading, isInitialized, router])

  if (!isInitialized || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-700 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-32 bg-gray-700 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <Card className="w-full max-w-md bg-white/10 backdrop-blur border-white/20">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold text-white mb-4">Access Denied</h2>
            <p className="text-gray-300 mb-6">Please sign in to access your dashboard.</p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" asChild className="bg-transparent border-white/30 text-white hover:bg-white/10">
                <Link href="/login">Login</Link>
              </Button>
              <Button
                asChild
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
              >
                <Link href="/signup">Sign Up</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
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

  const getTierLabel = (tier: string) => {
    return tier?.charAt(0).toUpperCase() + tier?.slice(1) || "Grassroot"
  }

  const getNextLevelXP = (level: number) => {
    return level * 1000
  }

  const currentXP = profile?.points || 0
  const nextLevelXP = getNextLevelXP((profile?.level || 1) + 1)
  const progressPercentage = Math.min((currentXP / nextLevelXP) * 100, 100)

  const recentActivity = [
    { type: "like", content: "Liked a post by EriggaFan001", time: "2 hours ago", icon: Heart },
    { type: "comment", content: "Commented on 'Paper Boi Discussion'", time: "4 hours ago", icon: MessageSquare },
    { type: "play", content: "Played 'A Very Very Good Bad Guy'", time: "6 hours ago", icon: Play },
    { type: "share", content: "Shared a track with the community", time: "1 day ago", icon: Share2 },
  ]

  const achievements = [
    { name: "First Post", description: "Made your first community post", earned: true, icon: MessageSquare },
    { name: "Music Lover", description: "Played 100 tracks", earned: true, icon: Music },
    { name: "Community Star", description: "Received 50 likes", earned: false, icon: Star },
    { name: "Trendsetter", description: "Started a trending topic", earned: false, icon: TrendingUp },
  ]

  const favoriteTracksData = [
    { title: "Paper Boi", artist: "Erigga", plays: 45, duration: "3:24" },
    { title: "A Very Very Good Bad Guy", artist: "Erigga", plays: 38, duration: "4:12" },
    { title: "Welcome To Warri", artist: "Erigga", plays: 32, duration: "3:45" },
    { title: "Motivation", artist: "Erigga", plays: 28, duration: "3:18" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Welcome back, {profile?.username || user?.email?.split("@")[0]}!
            </h1>
            <p className="text-gray-300">Here's what's happening in your Erigga Live experience</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </Button>
            <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* Profile Overview */}
        <Card className="bg-white/10 backdrop-blur border-white/20 mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile?.avatar_url || "/placeholder-user.jpg"} />
                <AvatarFallback className="text-2xl">
                  {profile?.username?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h2 className="text-2xl font-bold text-white">{profile?.username || "User"}</h2>
                  <Badge className={`${getTierColor(profile?.tier || "grassroot")} text-white`}>
                    {getTierLabel(profile?.tier || "grassroot")}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{profile?.level || 1}</div>
                    <div className="text-sm text-gray-300">Level</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-400">{profile?.coins || 1000}</div>
                    <div className="text-sm text-gray-300">Coins</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">{profile?.points || 0}</div>
                    <div className="text-sm text-gray-300">Points</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">12</div>
                    <div className="text-sm text-gray-300">Achievements</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Progress to Level {(profile?.level || 1) + 1}</span>
                    <span className="text-white">
                      {currentXP}/{nextLevelXP} XP
                    </span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white/10 backdrop-blur border-white/20">
            <CardContent className="p-4 text-center">
              <Music className="h-8 w-8 text-blue-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">143</div>
              <div className="text-sm text-gray-300">Tracks Played</div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur border-white/20">
            <CardContent className="p-4 text-center">
              <MessageSquare className="h-8 w-8 text-green-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">28</div>
              <div className="text-sm text-gray-300">Posts Created</div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur border-white/20">
            <CardContent className="p-4 text-center">
              <Heart className="h-8 w-8 text-red-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">156</div>
              <div className="text-sm text-gray-300">Likes Received</div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur border-white/20">
            <CardContent className="p-4 text-center">
              <Trophy className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">7</div>
              <div className="text-sm text-gray-300">Achievements</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-white/10 border-white/20 mb-6">
            <TabsTrigger value="overview" className="data-[state=active]:bg-white/20 text-white">
              Overview
            </TabsTrigger>
            <TabsTrigger value="music" className="data-[state=active]:bg-white/20 text-white">
              Music
            </TabsTrigger>
            <TabsTrigger value="community" className="data-[state=active]:bg-white/20 text-white">
              Community
            </TabsTrigger>
            <TabsTrigger value="achievements" className="data-[state=active]:bg-white/20 text-white">
              Achievements
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <Card className="bg-white/10 backdrop-blur border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Recent Activity</CardTitle>
                  <CardDescription className="text-gray-300">Your latest interactions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 rounded-lg bg-white/5">
                      <activity.icon className="h-5 w-5 text-gray-400" />
                      <div className="flex-1">
                        <p className="text-white text-sm">{activity.content}</p>
                        <p className="text-gray-400 text-xs">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="bg-white/10 backdrop-blur border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Quick Actions</CardTitle>
                  <CardDescription className="text-gray-300">Jump to your favorite features</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    asChild
                    className="w-full justify-start bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                  >
                    <Link href="/community">
                      <Users className="h-4 w-4 mr-2" />
                      Visit Community
                    </Link>
                  </Button>
                  <Button
                    asChild
                    className="w-full justify-start bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600"
                  >
                    <Link href="/vault">
                      <Music className="h-4 w-4 mr-2" />
                      Browse Music
                    </Link>
                  </Button>
                  <Button
                    asChild
                    className="w-full justify-start bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                  >
                    <Link href="/chat">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Join Chat
                    </Link>
                  </Button>
                  <Button
                    asChild
                    className="w-full justify-start bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                  >
                    <Link href="/coins">
                      <Coins className="h-4 w-4 mr-2" />
                      Manage Coins
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="music" className="space-y-6">
            <Card className="bg-white/10 backdrop-blur border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Your Favorite Tracks</CardTitle>
                <CardDescription className="text-gray-300">Most played songs this month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {favoriteTracksData.map((track, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                          <Music className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-white">{track.title}</h4>
                          <p className="text-sm text-gray-400">{track.artist}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-sm text-white">{track.plays} plays</p>
                          <p className="text-xs text-gray-400">{track.duration}</p>
                        </div>
                        <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white">
                          <Play className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="community" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-white/10 backdrop-blur border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Community Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Posts Created</span>
                    <span className="text-white font-semibold">28</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Comments Made</span>
                    <span className="text-white font-semibold">156</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Likes Received</span>
                    <span className="text-white font-semibold">342</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Followers</span>
                    <span className="text-white font-semibold">89</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Recent Posts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3 rounded-lg bg-white/5">
                    <p className="text-white text-sm">"Just heard the new track - absolutely fire! 🔥"</p>
                    <p className="text-gray-400 text-xs mt-1">2 hours ago • 12 likes</p>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5">
                    <p className="text-white text-sm">"Can't wait for the concert next month!"</p>
                    <p className="text-gray-400 text-xs mt-1">1 day ago • 8 likes</p>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5">
                    <p className="text-white text-sm">"Erigga's storytelling is unmatched 💯"</p>
                    <p className="text-gray-400 text-xs mt-1">3 days ago • 15 likes</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="achievements" className="space-y-6">
            <Card className="bg-white/10 backdrop-blur border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Your Achievements</CardTitle>
                <CardDescription className="text-gray-300">
                  Unlock badges by being active in the community
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {achievements.map((achievement, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border-2 ${
                        achievement.earned ? "bg-green-500/10 border-green-500/30" : "bg-gray-500/10 border-gray-500/30"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${achievement.earned ? "bg-green-500" : "bg-gray-500"}`}>
                          <achievement.icon className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h4 className={`font-semibold ${achievement.earned ? "text-green-400" : "text-gray-400"}`}>
                            {achievement.name}
                          </h4>
                          <p className="text-sm text-gray-300">{achievement.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
