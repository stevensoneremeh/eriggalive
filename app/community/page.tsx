"use client"

import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Users,
  MessageSquare,
  Heart,
  Share2,
  Plus,
  TrendingUp,
  Clock,
  Star,
  Music,
  Mic,
  Trophy,
  FlameIcon as Fire,
} from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { useState, useEffect } from "react"

interface Post {
  id: number
  title: string
  content: string
  author: {
    id: number
    username: string
    display_name: string
    avatar_url: string | null
    subscription_tier: string
    is_verified: boolean
  }
  category: {
    id: number
    name: string
    slug: string
  }
  vote_count: number
  comment_count: number
  created_at: string
  user_vote?: "up" | "down" | null
}

interface Category {
  id: number
  name: string
  slug: string
  description: string
  post_count: number
  is_active: boolean
}

function CommunityPage() {
  const { profile } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [activeCategory, setActiveCategory] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)

  // Mock data for demo
  useEffect(() => {
    const mockCategories: Category[] = [
      {
        id: 1,
        name: "General",
        slug: "general",
        description: "General discussions about everything",
        post_count: 156,
        is_active: true,
      },
      {
        id: 2,
        name: "Music",
        slug: "music",
        description: "Share and discuss music",
        post_count: 89,
        is_active: true,
      },
      {
        id: 3,
        name: "Bars & Lyrics",
        slug: "bars",
        description: "Drop your hottest bars",
        post_count: 234,
        is_active: true,
      },
      {
        id: 4,
        name: "News & Updates",
        slug: "news",
        description: "Latest news and announcements",
        post_count: 45,
        is_active: true,
      },
    ]

    const mockPosts: Post[] = [
      {
        id: 1,
        title: "Welcome to the Erigga Mission Community! 🎵",
        content:
          "This is where we connect, share, and grow together. Drop your thoughts, share your music, and let's build something amazing!",
        author: {
          id: 1,
          username: "erigga_official",
          display_name: "Erigga",
          avatar_url: null,
          subscription_tier: "vip",
          is_verified: true,
        },
        category: {
          id: 1,
          name: "General",
          slug: "general",
        },
        vote_count: 45,
        comment_count: 12,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      },
      {
        id: 2,
        title: "New track dropping soon! 🔥",
        content:
          "Been working on something special in the studio. Can't wait to share it with y'all. What kind of vibe are you expecting?",
        author: {
          id: 1,
          username: "erigga_official",
          display_name: "Erigga",
          avatar_url: null,
          subscription_tier: "vip",
          is_verified: true,
        },
        category: {
          id: 2,
          name: "Music",
          slug: "music",
        },
        vote_count: 78,
        comment_count: 23,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
      },
      {
        id: 3,
        title: "Drop your best bars here! 🎤",
        content:
          "Let's see what y'all got! Share your hottest bars and let the community vote. Best bars get featured!",
        author: {
          id: 2,
          username: "community_mod",
          display_name: "Community Moderator",
          avatar_url: null,
          subscription_tier: "premium",
          is_verified: false,
        },
        category: {
          id: 3,
          name: "Bars & Lyrics",
          slug: "bars",
        },
        vote_count: 34,
        comment_count: 67,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
      },
      {
        id: 4,
        title: "What's your favorite Erigga track?",
        content:
          "Been listening to the catalog and wondering what tracks hit different for y'all. Drop your favorites below!",
        author: {
          id: 3,
          username: "musiclover23",
          display_name: "Music Lover",
          avatar_url: null,
          subscription_tier: "general",
          is_verified: false,
        },
        category: {
          id: 2,
          name: "Music",
          slug: "music",
        },
        vote_count: 56,
        comment_count: 89,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
      },
    ]

    setCategories(mockCategories)
    setPosts(mockPosts)
    setIsLoading(false)
  }, [])

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
        return <Users className="w-3 h-3" />
      case "general":
        return <Star className="w-3 h-3" />
      case "premium":
        return <Trophy className="w-3 h-3" />
      case "vip":
        return <Fire className="w-3 h-3" />
      default:
        return <Users className="w-3 h-3" />
    }
  }

  const filteredPosts = activeCategory === "all" ? posts : posts.filter((post) => post.category.slug === activeCategory)

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Community</h1>
          <p className="text-gray-600">Connect, share, and engage with the Erigga Mission family</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Categories */}
          <div className="lg:col-span-1 space-y-6">
            {/* Create Post */}
            <Card>
              <CardContent className="p-4">
                <Button className="w-full" asChild>
                  <Link href="/community/create">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Post
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Categories */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant={activeCategory === "all" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveCategory("all")}
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  All Posts
                  <Badge variant="secondary" className="ml-auto">
                    {posts.length}
                  </Badge>
                </Button>
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={activeCategory === category.slug ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setActiveCategory(category.slug)}
                  >
                    {category.slug === "music" && <Music className="w-4 h-4 mr-2" />}
                    {category.slug === "bars" && <Mic className="w-4 h-4 mr-2" />}
                    {category.slug === "general" && <MessageSquare className="w-4 h-4 mr-2" />}
                    {category.slug === "news" && <Clock className="w-4 h-4 mr-2" />}
                    {category.name}
                    <Badge variant="secondary" className="ml-auto">
                      {posts.filter((p) => p.category.slug === category.slug).length}
                    </Badge>
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Community Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Community Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Members</span>
                  <span className="font-semibold">2,847</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Posts Today</span>
                  <span className="font-semibold">23</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Active Now</span>
                  <span className="font-semibold">156</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content - Posts */}
          <div className="lg:col-span-3">
            <div className="space-y-6">
              {/* Filter Tabs */}
              <Tabs defaultValue="hot" className="w-full">
                <TabsList>
                  <TabsTrigger value="hot">🔥 Hot</TabsTrigger>
                  <TabsTrigger value="new">🆕 New</TabsTrigger>
                  <TabsTrigger value="top">⭐ Top</TabsTrigger>
                </TabsList>

                <TabsContent value="hot" className="space-y-4 mt-6">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : filteredPosts.length === 0 ? (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <MessageSquare className="w-12 h-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
                        <p className="text-muted-foreground text-center mb-4">
                          Be the first to start a conversation in this category!
                        </p>
                        <Button asChild>
                          <Link href="/community/create">Create First Post</Link>
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    filteredPosts.map((post) => (
                      <Card key={post.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          {/* Post Header */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-10 h-10">
                                <AvatarImage src={post.author.avatar_url || ""} alt={post.author.display_name} />
                                <AvatarFallback>{post.author.display_name.charAt(0).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold">{post.author.display_name}</span>
                                  {post.author.is_verified && (
                                    <Badge variant="secondary" className="text-xs">
                                      ✓
                                    </Badge>
                                  )}
                                  <Badge
                                    className={`${getTierColor(post.author.subscription_tier)} text-white text-xs`}
                                  >
                                    {getTierIcon(post.author.subscription_tier)}
                                    <span className="ml-1 capitalize">{post.author.subscription_tier}</span>
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span>@{post.author.username}</span>
                                  <span>•</span>
                                  <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                                  <span>•</span>
                                  <Badge variant="outline" className="text-xs">
                                    {post.category.name}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Post Content */}
                          <div className="mb-4">
                            <h3 className="text-lg font-semibold mb-2">{post.title}</h3>
                            <p className="text-gray-700 leading-relaxed">{post.content}</p>
                          </div>

                          <Separator className="my-4" />

                          {/* Post Actions */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <Button variant="ghost" size="sm" className="gap-2">
                                <Heart className="w-4 h-4" />
                                <span>{post.vote_count}</span>
                              </Button>
                              <Button variant="ghost" size="sm" className="gap-2" asChild>
                                <Link href={`/community/posts/${post.id}`}>
                                  <MessageSquare className="w-4 h-4" />
                                  <span>{post.comment_count}</span>
                                </Link>
                              </Button>
                              <Button variant="ghost" size="sm" className="gap-2">
                                <Share2 className="w-4 h-4" />
                                <span>Share</span>
                              </Button>
                            </div>
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/community/posts/${post.id}`}>View Post</Link>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="new" className="space-y-4 mt-6">
                  <Card>
                    <CardContent className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Newest Posts</h3>
                        <p className="text-muted-foreground">Fresh content from the community</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="top" className="space-y-4 mt-6">
                  <Card>
                    <CardContent className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Top Posts</h3>
                        <p className="text-muted-foreground">Most popular content this week</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CommunityPage
