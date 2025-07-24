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
import { Heart, MessageCircle, Share2, TrendingUp, Users, Plus, Search, Filter, Clock } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"

interface Post {
  id: string
  title: string
  content: string
  author_id: string
  author?: {
    username: string
    avatar_url?: string
    tier: string
  }
  category: string
  likes_count: number
  comments_count: number
  created_at: string
  updated_at: string
}

interface Comment {
  id: string
  content: string
  author_id: string
  author?: {
    username: string
    avatar_url?: string
    tier: string
  }
  post_id: string
  created_at: string
}

const mockPosts: Post[] = [
  {
    id: "1",
    title: "Welcome to Erigga Live Community!",
    content:
      "This is the official community platform for all Erigga fans. Share your thoughts, connect with other fans, and stay updated with the latest news!",
    author_id: "admin",
    author: {
      username: "EriggaOfficial",
      avatar_url: "/placeholder-user.jpg",
      tier: "blood_brotherhood",
    },
    category: "announcement",
    likes_count: 45,
    comments_count: 12,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "2",
    title: "New Album Coming Soon!",
    content: "Working on some fire tracks for you all. What kind of vibes do you want to hear on the next project?",
    author_id: "admin",
    author: {
      username: "EriggaOfficial",
      avatar_url: "/placeholder-user.jpg",
      tier: "blood_brotherhood",
    },
    category: "music",
    likes_count: 89,
    comments_count: 34,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
  },
]

export default function CommunityPage() {
  const { isAuthenticated, profile, isLoading } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [newPostTitle, setNewPostTitle] = useState("")
  const [newPostContent, setNewPostContent] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("general")
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("feed")

  const supabase = createClient()

  const loadPosts = async () => {
    try {
      setLoading(true)

      // Try to load from database first
      const { data: postsData, error: postsError } = await supabase
        .from("community_posts")
        .select(`
          *,
          profiles:author_id (
            username,
            avatar_url,
            tier
          )
        `)
        .order("created_at", { ascending: false })
        .limit(20)

      if (postsError) {
        console.error("Error loading posts:", postsError)
        // Use mock data as fallback
        setPosts(mockPosts)
        return
      }

      // Transform the data to match our interface
      const transformedPosts =
        postsData?.map((post) => ({
          ...post,
          author: post.profiles
            ? {
                username: post.profiles.username,
                avatar_url: post.profiles.avatar_url,
                tier: post.profiles.tier,
              }
            : undefined,
        })) || []

      setPosts(transformedPosts.length > 0 ? transformedPosts : mockPosts)
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
      const { data, error } = await supabase
        .from("community_posts")
        .insert([
          {
            title: newPostTitle.trim(),
            content: newPostContent.trim(),
            author_id: profile.id,
            category: selectedCategory,
            likes_count: 0,
            comments_count: 0,
          },
        ])
        .select()
        .single()

      if (error) {
        console.error("Error creating post:", error)
        toast.error("Failed to create post")
        return
      }

      // Add the new post to the local state
      const newPost = {
        ...data,
        author: {
          username: profile.username,
          avatar_url: profile.avatar_url,
          tier: profile.tier,
        },
      }

      setPosts((prev) => [newPost, ...prev])
      setNewPostTitle("")
      setNewPostContent("")
      toast.success("Post created successfully!")
    } catch (error) {
      console.error("Error creating post:", error)
      toast.error("Failed to create post")
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case "blood_brotherhood":
      case "blood":
        return "bg-red-500"
      case "elder":
        return "bg-purple-500"
      case "pioneer":
        return "bg-blue-500"
      case "grassroot":
        return "bg-green-500"
      default:
        return "bg-gray-500"
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
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return "Just now"
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    return `${Math.floor(diffInSeconds / 86400)}d ago`
  }

  useEffect(() => {
    loadPosts()
  }, [])

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading community...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Community</h1>
        <p className="text-muted-foreground">
          Connect with fellow fans, share your thoughts, and stay updated with the latest from Erigga
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">1,234</p>
                <p className="text-sm text-muted-foreground">Active Members</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <MessageCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{posts.length}</p>
                <p className="text-sm text-muted-foreground">Posts Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">89%</p>
                <p className="text-sm text-muted-foreground">Engagement Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="feed">Feed</TabsTrigger>
              <TabsTrigger value="trending">Trending</TabsTrigger>
              <TabsTrigger value="create">Create Post</TabsTrigger>
            </TabsList>

            <TabsContent value="feed" className="space-y-6">
              {/* Search and Filter */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search posts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </div>

              {/* Posts */}
              <div className="space-y-6">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading posts...</p>
                  </div>
                ) : posts.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Be the first to start a conversation in the community!
                      </p>
                      <Button onClick={() => setActiveTab("create")}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Post
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  posts
                    .filter(
                      (post) =>
                        searchQuery === "" ||
                        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        post.content.toLowerCase().includes(searchQuery.toLowerCase()),
                    )
                    .map((post) => (
                      <Card key={post.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-start space-x-4">
                            <Avatar className="h-10 w-10">
                              <AvatarImage
                                src={post.author?.avatar_url || "/placeholder-user.jpg"}
                                alt={post.author?.username || "User"}
                              />
                              <AvatarFallback>{post.author?.username?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-2">
                                <h4 className="font-semibold">{post.author?.username || "Anonymous"}</h4>
                                <Badge
                                  className={`text-xs ${getTierColor(post.author?.tier || "grassroot")} text-white`}
                                >
                                  {getTierDisplayName(post.author?.tier || "grassroot")}
                                </Badge>
                                <span className="text-sm text-muted-foreground">•</span>
                                <span className="text-sm text-muted-foreground flex items-center">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {formatTimeAgo(post.created_at)}
                                </span>
                              </div>
                              <h3 className="text-lg font-semibold mb-2">{post.title}</h3>
                              <p className="text-muted-foreground mb-4 whitespace-pre-wrap">{post.content}</p>
                              <div className="flex items-center space-x-6">
                                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-red-500">
                                  <Heart className="h-4 w-4 mr-1" />
                                  {post.likes_count}
                                </Button>
                                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-blue-500">
                                  <MessageCircle className="h-4 w-4 mr-1" />
                                  {post.comments_count}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-muted-foreground hover:text-green-500"
                                >
                                  <Share2 className="h-4 w-4 mr-1" />
                                  Share
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

            <TabsContent value="trending" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Trending Posts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Trending posts will appear here based on engagement and activity.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="create" className="space-y-6">
              {isAuthenticated ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Plus className="h-5 w-5 mr-2" />
                      Create New Post
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Title</label>
                      <Input
                        placeholder="What's on your mind?"
                        value={newPostTitle}
                        onChange={(e) => setNewPostTitle(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Content</label>
                      <Textarea
                        placeholder="Share your thoughts with the community..."
                        value={newPostContent}
                        onChange={(e) => setNewPostContent(e.target.value)}
                        rows={6}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Category</label>
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full p-2 border rounded-md bg-background"
                      >
                        <option value="general">General</option>
                        <option value="music">Music</option>
                        <option value="announcement">Announcement</option>
                        <option value="discussion">Discussion</option>
                      </select>
                    </div>
                    <Button onClick={createPost} className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Post
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Sign in to create posts</h3>
                    <p className="text-muted-foreground mb-4">
                      Join the community to share your thoughts and connect with other fans.
                    </p>
                    <Button asChild>
                      <a href="/login">Sign In</a>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Community Guidelines */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Community Guidelines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>• Be respectful to all members</p>
              <p>• No spam or self-promotion</p>
              <p>• Keep discussions relevant</p>
              <p>• Report inappropriate content</p>
            </CardContent>
          </Card>

          {/* Popular Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Popular Categories</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Music</span>
                <Badge variant="secondary">24</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">General</span>
                <Badge variant="secondary">18</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Discussion</span>
                <Badge variant="secondary">12</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Announcements</span>
                <Badge variant="secondary">8</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
