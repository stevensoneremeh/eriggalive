"use client"

import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users, MessageSquare, TrendingUp, Star, Heart, Share2, MessageCircle } from "lucide-react"
import Link from "next/link"

export default function CommunityPage() {
  const { user, profile, loading, isAuthenticated } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-700 rounded w-1/3"></div>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              <div className="lg:col-span-3 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-32 bg-gray-700 rounded"></div>
                ))}
              </div>
              <div className="space-y-4">
                <div className="h-48 bg-gray-700 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const communityStats = [
    { label: "Total Members", value: "1,250", icon: Users },
    { label: "Active Today", value: "89", icon: TrendingUp },
    { label: "Posts Today", value: "34", icon: MessageSquare },
    { label: "Trending Topics", value: "12", icon: Star },
  ]

  const samplePosts = [
    {
      id: 1,
      author: "EriggaFan2024",
      avatar: "/placeholder-user.jpg",
      tier: "Pioneer",
      content: "Just listened to the new track 'Paper Boi' - absolutely fire! 🔥 The production is next level.",
      timestamp: "2 hours ago",
      likes: 24,
      comments: 8,
      shares: 3,
    },
    {
      id: 2,
      author: "WarriStateOfMind",
      avatar: "/placeholder-user.jpg",
      tier: "Elder",
      content: "Can't wait for the upcoming concert in Lagos! Who else got their tickets? Let's meet up!",
      timestamp: "4 hours ago",
      likes: 18,
      comments: 12,
      shares: 5,
    },
    {
      id: 3,
      author: "HipHopHead",
      avatar: "/placeholder-user.jpg",
      tier: "Grassroot",
      content: "Erigga's storytelling ability is unmatched. Every track tells a story that hits different.",
      timestamp: "6 hours ago",
      likes: 31,
      comments: 15,
      shares: 7,
    },
  ]

  const trendingTopics = [
    { tag: "#PaperBoi", posts: 45 },
    { tag: "#EriggaLive", posts: 32 },
    { tag: "#WarriState", posts: 28 },
    { tag: "#NewMusic", posts: 21 },
    { tag: "#Concert2024", posts: 18 },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Community</h1>
          <p className="text-gray-300 text-lg">
            Connect with fellow fans, share your thoughts, and stay updated with the latest from Erigga
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {communityStats.map((stat) => (
            <Card key={stat.label} className="bg-white/10 backdrop-blur border-white/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-300">{stat.label}</p>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                  </div>
                  <stat.icon className="h-8 w-8 text-orange-400" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Feed */}
          <div className="lg:col-span-3">
            <Card className="bg-white/10 backdrop-blur border-white/20 mb-6">
              <CardHeader>
                <CardTitle className="text-white">Community Feed</CardTitle>
                <CardDescription className="text-gray-300">
                  Latest posts and discussions from the community
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Create Post Section */}
            {isAuthenticated ? (
              <Card className="bg-white/10 backdrop-blur border-white/20 mb-6">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={profile?.avatar_url || "/placeholder-user.jpg"} />
                      <AvatarFallback>
                        {profile?.username?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left bg-white/5 border-white/20 text-gray-300 hover:bg-white/10"
                      >
                        What's on your mind, {profile?.username || "fan"}?
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-white/10 backdrop-blur border-white/20 mb-6">
                <CardContent className="p-6 text-center">
                  <h3 className="text-lg font-semibold text-white mb-2">Join the Conversation</h3>
                  <p className="text-gray-300 mb-4">Sign in to share your thoughts and connect with other fans</p>
                  <div className="flex justify-center space-x-4">
                    <Link href="/login">
                      <Button variant="outline" className="bg-transparent border-white/20 text-white hover:bg-white/10">
                        Login
                      </Button>
                    </Link>
                    <Link href="/signup">
                      <Button className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600">
                        Sign Up
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Posts */}
            <div className="space-y-6">
              {samplePosts.map((post) => (
                <Card key={post.id} className="bg-white/10 backdrop-blur border-white/20">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={post.avatar || "/placeholder.svg"} />
                        <AvatarFallback>{post.author.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-semibold text-white">{post.author}</h4>
                          <Badge
                            variant="secondary"
                            className={`text-xs ${
                              post.tier === "Elder"
                                ? "bg-yellow-500 text-black"
                                : post.tier === "Pioneer"
                                  ? "bg-blue-500 text-white"
                                  : "bg-green-500 text-white"
                            }`}
                          >
                            {post.tier}
                          </Badge>
                          <span className="text-sm text-gray-400">{post.timestamp}</span>
                        </div>
                        <p className="text-gray-200 mb-4">{post.content}</p>
                        <div className="flex items-center space-x-6">
                          <button className="flex items-center space-x-2 text-gray-400 hover:text-red-400 transition-colors">
                            <Heart className="h-4 w-4" />
                            <span className="text-sm">{post.likes}</span>
                          </button>
                          <button className="flex items-center space-x-2 text-gray-400 hover:text-blue-400 transition-colors">
                            <MessageCircle className="h-4 w-4" />
                            <span className="text-sm">{post.comments}</span>
                          </button>
                          <button className="flex items-center space-x-2 text-gray-400 hover:text-green-400 transition-colors">
                            <Share2 className="h-4 w-4" />
                            <span className="text-sm">{post.shares}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* User Info */}
            {isAuthenticated && profile && (
              <Card className="bg-white/10 backdrop-blur border-white/20 mb-6">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={profile.avatar_url || "/placeholder-user.jpg"} />
                      <AvatarFallback className="text-lg">
                        {profile.username?.charAt(0)?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-white">{profile.username}</h3>
                      <Badge
                        variant="secondary"
                        className={`text-xs ${
                          profile.tier === "elder"
                            ? "bg-yellow-500 text-black"
                            : profile.tier === "pioneer"
                              ? "bg-blue-500 text-white"
                              : "bg-green-500 text-white"
                        }`}
                      >
                        {profile.tier}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-gray-300">
                      <span>Level:</span>
                      <span className="text-white font-medium">{profile.level || 1}</span>
                    </div>
                    <div className="flex justify-between text-gray-300">
                      <span>Points:</span>
                      <span className="text-white font-medium">{profile.points || 0}</span>
                    </div>
                    <div className="flex justify-between text-gray-300">
                      <span>Coins:</span>
                      <span className="text-yellow-400 font-medium">{profile.coins || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Trending Topics */}
            <Card className="bg-white/10 backdrop-blur border-white/20 mb-6">
              <CardHeader>
                <CardTitle className="text-white text-lg">Trending Topics</CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <div className="space-y-3">
                  {trendingTopics.map((topic, index) => (
                    <div key={topic.tag} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-400">#{index + 1}</span>
                        <span className="text-orange-400 font-medium">{topic.tag}</span>
                      </div>
                      <span className="text-sm text-gray-400">{topic.posts} posts</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-white/10 backdrop-blur border-white/20">
              <CardHeader>
                <CardTitle className="text-white text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-0 space-y-3">
                <Button
                  asChild
                  variant="outline"
                  className="w-full justify-start bg-transparent border-white/20 text-white hover:bg-white/10"
                >
                  <Link href="/chat">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Join Chat Rooms
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="w-full justify-start bg-transparent border-white/20 text-white hover:bg-white/10"
                >
                  <Link href="/vault">
                    <Star className="mr-2 h-4 w-4" />
                    Browse Media
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="w-full justify-start bg-transparent border-white/20 text-white hover:bg-white/10"
                >
                  <Link href="/premium">
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Upgrade Tier
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
