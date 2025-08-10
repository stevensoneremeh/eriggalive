"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Heart,
  MessageCircle,
  Share2,
  TrendingUp,
  Users,
  Plus,
  Search,
  Filter,
  Clock,
  Send,
  Sparkles,
  FlameIcon as Fire,
  Eye,
  MoreHorizontal,
  User,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"

interface Post {
  id: string
  title: string
  content: string
  author_id: string
  author?: {
    username: string
    full_name: string
    avatar_url?: string
    tier: string
  }
  category: string
  likes_count: number
  comments_count: number
  views_count: number
  created_at: string
  updated_at: string
}

interface Category {
  id: string
  name: string
  description: string
  icon: string
  color: string
  post_count: number
}

const mockCategories: Category[] = [
  {
    id: "general",
    name: "General",
    description: "General discussions",
    icon: "💬",
    color: "bg-blue-500",
    post_count: 24,
  },
  { id: "music", name: "Music", description: "Music discussions", icon: "🎵", color: "bg-purple-500", post_count: 18 },
  { id: "events", name: "Events", description: "Upcoming events", icon: "📅", color: "bg-green-500", post_count: 8 },
  { id: "freebies", name: "Freebies", description: "Free content", icon: "🎁", color: "bg-orange-500", post_count: 12 },
  {
    id: "bars",
    name: "Bars & Lyrics",
    description: "Share your bars",
    icon: "🎤",
    color: "bg-red-500",
    post_count: 15,
  },
]

const mockPosts: Post[] = [
  {
    id: "1",
    title: "Welcome to the Erigga Community! 🔥",
    content:
      "This is the official community platform for all Erigga fans worldwide. Share your thoughts, connect with other fans, stay updated with the latest news, and be part of the movement! Let's build something special together. #EriggaLive #Community",
    author_id: "admin",
    author: {
      username: "EriggaOfficial",
      full_name: "Erigga Official",
      avatar_url: "/placeholder-user.jpg",
      tier: "blood_brotherhood",
    },
    category: "general",
    likes_count: 156,
    comments_count: 42,
    views_count: 1200,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "2",
    title: "New Album 'Street Motivation 2' Coming Soon! 🎵",
    content:
      "Working on some fire tracks for you all. The streets have been waiting and I'm about to deliver something special. What kind of vibes do you want to hear on the next project? Drop your suggestions below! 🔥🔥",
    author_id: "admin",
    author: {
      username: "EriggaOfficial",
      full_name: "Erigga Official",
      avatar_url: "/placeholder-user.jpg",
      tier: "blood_brotherhood",
    },
    category: "music",
    likes_count: 234,
    comments_count: 67,
    views_count: 2100,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
  },
]

export default function CommunityPage() {
  const { isAuthenticated, profile, isLoading } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [userPosts, setUserPosts] = useState<Post[]>([])
  const [categories] = useState<Category[]>(mockCategories)
  const [loading, setLoading] = useState(true)
  const [newPostTitle, setNewPostTitle] = useState("")
  const [newPostContent, setNewPostContent] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("general")
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("feed")
  const [sortBy, setSortBy] = useState("newest")
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("all")

  const supabase = createClient()

  const loadPosts = async () => {
    try {
      setLoading(true)
      // For now, use mock data - you can implement real data loading later
      setPosts(mockPosts)
    } catch (error) {
      console.error("Error loading posts:", error)
      setPosts(mockPosts)
    } finally {
      setLoading(false)
    }
  }

  const createPost = async () => {
    if (!isAuthenticated || !profile) {
      toast.error("Please sign in to create a post")
      return
    }

    if (!newPostTitle.trim() || !newPostContent.trim()) {
      toast.error("Please fill in both title and content")
      return
    }

    try {
      // Add the new post to the local state
      const newPost: Post = {
        id: Date.now().toString(),
        title: newPostTitle.trim(),
        content: newPostContent.trim(),
        author_id: profile.id.toString(),
        author: {
          username: profile.username,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
          tier: profile.tier,
        },
        category: selectedCategory,
        likes_count: 0,
        comments_count: 0,
        views_count: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      setPosts((prev) => [newPost, ...prev])
      setUserPosts((prev) => [newPost, ...prev])
      setNewPostTitle("")
      setNewPostContent("")
      toast.success("Post created successfully!")
      setActiveTab("feed")
    } catch (error) {
      console.error("Error creating post:", error)
      toast.error("Failed to create post")
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case "blood_brotherhood":
      case "blood":
        return "bg-gradient-to-r from-red-500 to-red-600"
      case "elder":
        return "bg-gradient-to-r from-purple-500 to-purple-600"
      case "pioneer":
        return "bg-gradient-to-r from-blue-500 to-blue-600"
      case "grassroot":
        return "bg-gradient-to-r from-green-500 to-green-600"
      default:
        return "bg-gradient-to-r from-gray-500 to-gray-600"
    }
  }

  const getTierDisplayName = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case "blood_brotherhood":
      case "blood":
        return "Blood"
      case "elder":
        return "Elder"
      case "pioneer":
        return "Pioneer"
      case "grassroot":
        return "Grassroot"
      default:
        return "Fan"
    }
  }

  const formatTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch {
      return "Recently"
    }
  }

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      searchQuery === "" ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.author?.username.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory = selectedCategoryFilter === "all" || post.category === selectedCategoryFilter

    return matchesSearch && matchesCategory
  })

  const sortedPosts = [...filteredPosts].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      case "oldest":
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      case "popular":
        return b.likes_count - a.likes_count
      case "trending":
        return b.likes_count + b.comments_count - (a.likes_count + a.comments_count)
      default:
        return 0
    }
  })

  useEffect(() => {
    loadPosts()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading community...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Sparkles className="h-4 w-4" />
            Community Hub
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-4">
            Erigga Community
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Connect with fellow fans, share your thoughts, and be part of the movement
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Active Members</p>
                  <p className="text-3xl font-bold">2,847</p>
                </div>
                <Users className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Total Posts</p>
                  <p className="text-3xl font-bold">{posts.length}</p>
                </div>
                <MessageCircle className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Engagement</p>
                  <p className="text-3xl font-bold">94%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Online Now</p>
                  <p className="text-3xl font-bold">156</p>
                </div>
                <Fire className="h-8 w-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Categories */}
            <Card className="backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Categories
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant={selectedCategoryFilter === "all" ? "default" : "ghost"}
                  className="w-full justify-between"
                  onClick={() => setSelectedCategoryFilter("all")}
                >
                  All Posts
                  <Badge variant="secondary">{posts.length}</Badge>
                </Button>
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategoryFilter === category.id ? "default" : "ghost"}
                    className="w-full justify-between"
                    onClick={() => setSelectedCategoryFilter(category.id)}
                  >
                    <span className="flex items-center gap-2">
                      <span>{category.icon}</span>
                      {category.name}
                    </span>
                    <Badge variant="secondary">{category.post_count}</Badge>
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Community Guidelines */}
            <Card className="backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-lg">Community Guidelines</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Be respectful to all community members</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Keep discussions relevant and constructive</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>No spam, self-promotion, or inappropriate content</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Report any violations to moderators</p>
                </div>
              </CardContent>
            </Card>

            {/* Trending Topics */}
            <Card className="backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Fire className="h-5 w-5 text-orange-500" />
                  Trending
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">#NewAlbum</span>
                  <Badge variant="secondary">24 posts</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">#BarsChallenge</span>
                  <Badge variant="secondary">18 posts</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">#EriggaLive</span>
                  <Badge variant="secondary">12 posts</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">#StreetMotivation</span>
                  <Badge variant="secondary">8 posts</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="feed" className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Feed
                </TabsTrigger>
                <TabsTrigger value="my-posts" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  My Posts
                </TabsTrigger>
                <TabsTrigger value="create" className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create
                </TabsTrigger>
              </TabsList>

              <TabsContent value="feed" className="space-y-6">
                {/* Search and Filter */}
                <Card className="backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 border-0 shadow-xl">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          placeholder="Search posts, users, or topics..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10 bg-white/50 dark:bg-slate-700/50"
                        />
                      </div>
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="w-full sm:w-48 bg-white/50 dark:bg-slate-700/50">
                          <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="newest">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              Newest
                            </div>
                          </SelectItem>
                          <SelectItem value="popular">
                            <div className="flex items-center gap-2">
                              <Heart className="h-4 w-4" />
                              Most Liked
                            </div>
                          </SelectItem>
                          <SelectItem value="trending">
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-4 w-4" />
                              Trending
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Posts */}
                <div className="space-y-6">
                  {loading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-muted-foreground">Loading posts...</p>
                    </div>
                  ) : sortedPosts.length === 0 ? (
                    <Card className="backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 border-0 shadow-xl">
                      <CardContent className="p-12 text-center">
                        <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-xl font-semibold mb-2">No posts found</h3>
                        <p className="text-muted-foreground mb-6">
                          {searchQuery ? "Try adjusting your search terms" : "Be the first to start a conversation!"}
                        </p>
                        <Button
                          onClick={() => setActiveTab("create")}
                          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Create First Post
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    sortedPosts.map((post) => (
                      <Card
                        key={post.id}
                        className="backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 group"
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start space-x-4">
                            <Avatar className="h-12 w-12 ring-2 ring-white/20">
                              <AvatarImage
                                src={post.author?.avatar_url || "/placeholder-user.jpg"}
                                alt={post.author?.username || "User"}
                              />
                              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                                {post.author?.username?.charAt(0).toUpperCase() || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-3">
                                <h4 className="font-semibold text-lg">
                                  {post.author?.full_name || post.author?.username || "Anonymous"}
                                </h4>
                                <Badge
                                  className={`text-xs ${getTierColor(post.author?.tier || "grassroot")} text-white border-0`}
                                >
                                  {getTierDisplayName(post.author?.tier || "grassroot")}
                                </Badge>
                                <span className="text-sm text-muted-foreground">•</span>
                                <span className="text-sm text-muted-foreground flex items-center">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {formatTimeAgo(post.created_at)}
                                </span>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Eye className="h-3 w-3" />
                                  {post.views_count}
                                </div>
                              </div>

                              <div className="mb-4">
                                <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                                  {post.title}
                                </h3>
                                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                  {post.content}
                                </p>
                              </div>

                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-6">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-muted-foreground hover:text-red-500 transition-colors"
                                  >
                                    <Heart className="h-4 w-4 mr-2" />
                                    {post.likes_count}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-muted-foreground hover:text-blue-500 transition-colors"
                                  >
                                    <MessageCircle className="h-4 w-4 mr-2" />
                                    {post.comments_count}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-muted-foreground hover:text-green-500 transition-colors"
                                  >
                                    <Share2 className="h-4 w-4 mr-2" />
                                    Share
                                  </Button>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="my-posts" className="space-y-6">
                {isAuthenticated ? (
                  <div className="space-y-6">
                    <Card className="backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 border-0 shadow-xl">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <User className="h-5 w-5" />
                          My Posts ({userPosts.length})
                        </CardTitle>
                      </CardHeader>
                    </Card>

                    {userPosts.length === 0 ? (
                      <Card className="backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 border-0 shadow-xl">
                        <CardContent className="p-12 text-center">
                          <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-xl font-semibold mb-2">No posts yet</h3>
                          <p className="text-muted-foreground mb-6">
                            You haven't created any posts yet. Share your thoughts with the community!
                          </p>
                          <Button
                            onClick={() => setActiveTab("create")}
                            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Create Your First Post
                          </Button>
                        </CardContent>
                      </Card>
                    ) : (
                      userPosts.map((post) => (
                        <Card
                          key={post.id}
                          className="backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 group"
                        >
                          <CardContent className="p-6">
                            <div className="flex items-start space-x-4">
                              <Avatar className="h-12 w-12 ring-2 ring-white/20">
                                <AvatarImage
                                  src={post.author?.avatar_url || "/placeholder-user.jpg"}
                                  alt={post.author?.username || "User"}
                                />
                                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                                  {post.author?.username?.charAt(0).toUpperCase() || "U"}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-3">
                                  <h4 className="font-semibold text-lg">
                                    {post.author?.full_name || post.author?.username || "You"}
                                  </h4>
                                  <Badge
                                    className={`text-xs ${getTierColor(post.author?.tier || "grassroot")} text-white border-0`}
                                  >
                                    {getTierDisplayName(post.author?.tier || "grassroot")}
                                  </Badge>
                                  <span className="text-sm text-muted-foreground">•</span>
                                  <span className="text-sm text-muted-foreground flex items-center">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {formatTimeAgo(post.created_at)}
                                  </span>
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Eye className="h-3 w-3" />
                                    {post.views_count}
                                  </div>
                                </div>

                                <div className="mb-4">
                                  <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                                    {post.title}
                                  </h3>
                                  <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                    {post.content}
                                  </p>
                                </div>

                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-6">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <Heart className="h-4 w-4 text-red-500" />
                                      {post.likes_count} likes
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <MessageCircle className="h-4 w-4 text-blue-500" />
                                      {post.comments_count} comments
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <Eye className="h-4 w-4 text-green-500" />
                                      {post.views_count} views
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                ) : (
                  <Card className="backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 border-0 shadow-xl">
                    <CardContent className="p-12 text-center">
                      <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-xl font-semibold mb-2">Sign in to view your posts</h3>
                      <p className="text-muted-foreground mb-6">
                        Join the community to create posts and connect with other fans.
                      </p>
                      <Button
                        asChild
                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                      >
                        <a href="/login">Sign In</a>
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="create" className="space-y-6">
                {isAuthenticated ? (
                  <Card className="backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 border-0 shadow-xl">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Plus className="h-5 w-5" />
                        Create New Post
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg">
                        <Avatar className="h-12 w-12 ring-2 ring-white/20">
                          <AvatarImage src={profile?.avatar_url || "/placeholder-user.jpg"} />
                          <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                            {profile?.username?.charAt(0).toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{profile?.full_name || profile?.username}</p>
                          <Badge
                            className={`text-xs ${getTierColor(profile?.tier || "grassroot")} text-white border-0`}
                          >
                            {getTierDisplayName(profile?.tier || "grassroot")}
                          </Badge>
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">Post Title</label>
                        <Input
                          placeholder="What's your post about?"
                          value={newPostTitle}
                          onChange={(e) => setNewPostTitle(e.target.value)}
                          className="bg-white/50 dark:bg-slate-700/50"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">Content</label>
                        <Textarea
                          placeholder="Share your thoughts with the community..."
                          value={newPostContent}
                          onChange={(e) => setNewPostContent(e.target.value)}
                          rows={8}
                          className="bg-white/50 dark:bg-slate-700/50 resize-none"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">Category</label>
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                          <SelectTrigger className="bg-white/50 dark:bg-slate-700/50">
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                <div className="flex items-center gap-2">
                                  <span>{category.icon}</span>
                                  <span>{category.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <Separator />

                      <div className="flex justify-between items-center">
                        <p className="text-sm text-muted-foreground">
                          Make sure your post follows our community guidelines
                        </p>
                        <Button
                          onClick={createPost}
                          disabled={!newPostTitle.trim() || !newPostContent.trim()}
                          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50"
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Publish Post
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 border-0 shadow-xl">
                    <CardContent className="p-12 text-center">
                      <Plus className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-xl font-semibold mb-2">Sign in to create posts</h3>
                      <p className="text-muted-foreground mb-6">
                        Join the community to share your thoughts and connect with other fans.
                      </p>
                      <Button
                        asChild
                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                      >
                        <a href="/login">Sign In</a>
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
