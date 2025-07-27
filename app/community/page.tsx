"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Users,
  MessageSquare,
  Heart,
  Share2,
  Search,
  Filter,
  Plus,
  TrendingUp,
  Clock,
  Eye,
  MessageCircle,
  Crown,
  Star,
  User,
} from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { useRouter } from "next/navigation"

interface CommunityPost {
  id: string
  title: string
  content: string
  author: {
    id: string
    username: string
    avatar_url?: string
    tier: string
  }
  category: string
  likes: number
  comments: number
  views: number
  created_at: string
  is_pinned?: boolean
  tags?: string[]
}

interface Category {
  id: string
  name: string
  description: string
  color: string
  post_count: number
}

export default function CommunityPage() {
  const { profile, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [sortBy, setSortBy] = useState("recent")
  const [loadingPosts, setLoadingPosts] = useState(true)
  const [newPost, setNewPost] = useState({ title: "", content: "", category: "" })
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const supabase = createClient()

  // Mock data for demonstration
  const mockCategories: Category[] = [
    {
      id: "general",
      name: "General Discussion",
      description: "General community discussions",
      color: "blue",
      post_count: 45,
    },
    {
      id: "music",
      name: "Music & Lyrics",
      description: "Discuss Erigga's music and lyrics",
      color: "purple",
      post_count: 32,
    },
    { id: "events", name: "Events & News", description: "Latest events and news", color: "green", post_count: 18 },
    {
      id: "fan-art",
      name: "Fan Art & Creativity",
      description: "Share your creative works",
      color: "pink",
      post_count: 12,
    },
    {
      id: "support",
      name: "Support & Help",
      description: "Get help from the community",
      color: "orange",
      post_count: 8,
    },
  ]

  const mockPosts: CommunityPost[] = [
    {
      id: "1",
      title: "Welcome to the Erigga Community! 🎵",
      content:
        "Hey everyone! Welcome to our official community space. This is where we can all connect, share our love for Erigga's music, and stay updated with the latest news. Feel free to introduce yourselves and let's build an amazing community together!",
      author: {
        id: "admin",
        username: "EriggaOfficial",
        avatar_url: "/placeholder-user.jpg",
        tier: "blood_brotherhood",
      },
      category: "general",
      likes: 127,
      comments: 34,
      views: 892,
      created_at: new Date(Date.now() - 86400000).toISOString(),
      is_pinned: true,
      tags: ["welcome", "community", "introduction"],
    },
    {
      id: "2",
      title: "What's your favorite Erigga track of all time?",
      content:
        "I've been listening to Erigga for years now, and I'm curious to know what everyone's favorite track is. For me, it has to be 'The Erigma' - that song just hits different every time I hear it. What about you all?",
      author: {
        id: "user1",
        username: "MusicLover23",
        avatar_url: "/placeholder-user.jpg",
        tier: "pioneer",
      },
      category: "music",
      likes: 89,
      comments: 67,
      views: 445,
      created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
      tags: ["music", "favorites", "discussion"],
    },
    {
      id: "3",
      title: "Upcoming Concert - Who's Going?",
      content:
        "Just saw that Erigga announced a new concert date! Is anyone else planning to attend? Would love to meet up with fellow fans there. Let me know if you're going!",
      author: {
        id: "user2",
        username: "ConcertGoer",
        avatar_url: "/placeholder-user.jpg",
        tier: "elder",
      },
      category: "events",
      likes: 56,
      comments: 23,
      views: 234,
      created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
      tags: ["concert", "meetup", "events"],
    },
    {
      id: "4",
      title: "Fan Art: Erigga Portrait",
      content:
        "Hey everyone! I just finished this digital portrait of Erigga. Took me about 15 hours to complete. What do you think? Any feedback is welcome!",
      author: {
        id: "user3",
        username: "ArtisticSoul",
        avatar_url: "/placeholder-user.jpg",
        tier: "grassroot",
      },
      category: "fan-art",
      likes: 134,
      comments: 28,
      views: 567,
      created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
      tags: ["fan-art", "portrait", "digital-art"],
    },
    {
      id: "5",
      title: "New to the community - Hello everyone!",
      content:
        "Hi all! I'm new here and super excited to be part of this community. I've been a fan of Erigga for about 2 years now. Looking forward to connecting with everyone and sharing our love for his music!",
      author: {
        id: "user4",
        username: "NewFan2024",
        avatar_url: "/placeholder-user.jpg",
        tier: "grassroot",
      },
      category: "general",
      likes: 42,
      comments: 15,
      views: 123,
      created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
      tags: ["introduction", "new-member", "hello"],
    },
  ]

  const loadCommunityData = async () => {
    try {
      setLoadingPosts(true)

      // Try to load real data from database
      const { data: postsData, error: postsError } = await supabase
        .from("community_posts")
        .select(`
          id,
          title,
          content,
          category,
          vote_count,
          comment_count,
          view_count,
          created_at,
          is_pinned,
          profiles:user_id (
            id,
            username,
            avatar_url,
            tier
          )
        `)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false })
        .limit(20)

      if (postsError) {
        console.error("Error loading posts:", postsError)
        // Use mock data as fallback
        setPosts(mockPosts)
        setCategories(mockCategories)
      } else if (postsData && postsData.length > 0) {
        // Transform real data to match our interface
        const transformedPosts = postsData.map((post) => ({
          id: post.id,
          title: post.title,
          content: post.content,
          author: {
            id: post.profiles?.id || "",
            username: post.profiles?.username || "Unknown User",
            avatar_url: post.profiles?.avatar_url,
            tier: post.profiles?.tier || "grassroot",
          },
          category: post.category || "general",
          likes: post.vote_count || 0,
          comments: post.comment_count || 0,
          views: post.view_count || 0,
          created_at: post.created_at,
          is_pinned: post.is_pinned || false,
          tags: [],
        }))
        setPosts(transformedPosts)
        setCategories(mockCategories) // Use mock categories for now
      } else {
        // No real data, use mock data
        setPosts(mockPosts)
        setCategories(mockCategories)
      }
    } catch (error) {
      console.error("Error loading community data:", error)
      // Use mock data as fallback
      setPosts(mockPosts)
      setCategories(mockCategories)
    } finally {
      setLoadingPosts(false)
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
        return "Blood Brotherhood"
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

  const getCategoryColor = (category: string) => {
    const cat = categories.find((c) => c.id === category)
    return cat?.color || "gray"
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
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "all" || post.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const sortedPosts = [...filteredPosts].sort((a, b) => {
    switch (sortBy) {
      case "popular":
        return b.likes + b.comments - (a.likes + a.comments)
      case "mostLiked":
        return b.likes - a.likes
      case "mostComments":
        return b.comments - a.comments
      case "recent":
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }
  })

  const handleCreatePost = async () => {
    if (!isAuthenticated || !profile) {
      router.push("/login?redirect=/community")
      return
    }

    if (!newPost.title.trim() || !newPost.content.trim()) {
      return
    }

    try {
      // In a real app, you would create the post in the database here
      const mockNewPost: CommunityPost = {
        id: Date.now().toString(),
        title: newPost.title,
        content: newPost.content,
        author: {
          id: profile.id,
          username: profile.username || "User",
          avatar_url: profile.avatar_url,
          tier: profile.tier || "grassroot",
        },
        category: newPost.category || "general",
        likes: 0,
        comments: 0,
        views: 1,
        created_at: new Date().toISOString(),
        tags: [],
      }

      setPosts((prev) => [mockNewPost, ...prev])
      setNewPost({ title: "", content: "", category: "" })
      setIsCreateDialogOpen(false)
    } catch (error) {
      console.error("Error creating post:", error)
    }
  }

  useEffect(() => {
    loadCommunityData()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 pt-24">
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 pt-24">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-2">
                Community
              </h1>
              <p className="text-muted-foreground">
                Connect with fellow fans and share your passion for Erigga's music
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{posts.length} posts</span>
              </div>
              {isAuthenticated ? (
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Post
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create New Post</DialogTitle>
                      <DialogDescription>
                        Share your thoughts, questions, or content with the community.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Input
                          placeholder="Post title..."
                          value={newPost.title}
                          onChange={(e) => setNewPost((prev) => ({ ...prev, title: e.target.value }))}
                          className="text-lg font-medium"
                        />
                      </div>
                      <div>
                        <Select
                          value={newPost.category}
                          onValueChange={(value) => setNewPost((prev) => ({ ...prev, category: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Textarea
                          placeholder="What's on your mind?"
                          value={newPost.content}
                          onChange={(e) => setNewPost((prev) => ({ ...prev, content: e.target.value }))}
                          className="min-h-32"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleCreatePost} disabled={!newPost.title.trim() || !newPost.content.trim()}>
                          Create Post
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              ) : (
                <Button asChild>
                  <Link href="/login?redirect=/community">Sign In to Post</Link>
                </Button>
              )}
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Recent</SelectItem>
                  <SelectItem value="popular">Popular</SelectItem>
                  <SelectItem value="mostLiked">Most Liked</SelectItem>
                  <SelectItem value="mostComments">Most Comments</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="feed" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="feed" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
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
                {loadingPosts ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Card key={i} className="backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 border-0 shadow-xl">
                        <CardContent className="p-6">
                          <div className="animate-pulse space-y-4">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 bg-muted rounded-full"></div>
                              <div className="space-y-2">
                                <div className="h-4 w-32 bg-muted rounded"></div>
                                <div className="h-3 w-24 bg-muted rounded"></div>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="h-4 w-full bg-muted rounded"></div>
                              <div className="h-4 w-3/4 bg-muted rounded"></div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : sortedPosts.length === 0 ? (
                  <Card className="backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 border-0 shadow-xl">
                    <CardContent className="p-12 text-center">
                      <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-xl font-semibold mb-2">No posts found</h3>
                      <p className="text-muted-foreground mb-4">
                        {searchQuery || selectedCategory !== "all"
                          ? "Try adjusting your search or filters"
                          : "Be the first to start a conversation!"}
                      </p>
                      {isAuthenticated && (
                        <Button onClick={() => setIsCreateDialogOpen(true)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Create First Post
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  sortedPosts.map((post) => (
                    <Card
                      key={post.id}
                      className="backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 border-0 shadow-xl hover:shadow-2xl transition-all duration-300"
                    >
                      <CardContent className="p-6">
                        {post.is_pinned && (
                          <div className="flex items-center gap-2 mb-4 text-sm text-orange-600 dark:text-orange-400">
                            <Star className="h-4 w-4 fill-current" />
                            <span className="font-medium">Pinned Post</span>
                          </div>
                        )}

                        <div className="flex items-start gap-4 mb-4">
                          <Avatar className="h-12 w-12 ring-2 ring-white/20">
                            <AvatarImage src={post.author.avatar_url || "/placeholder-user.jpg"} />
                            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                              {post.author.username.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-sm">{post.author.username}</h4>
                              <Badge
                                className={`${getTierColor(post.author.tier)} text-white border-0 text-xs px-2 py-0`}
                              >
                                <Crown className="h-3 w-3 mr-1" />
                                {getTierDisplayName(post.author.tier)}
                              </Badge>
                              <Badge
                                variant="outline"
                                className={`text-${getCategoryColor(post.category)}-600 border-${getCategoryColor(post.category)}-200 text-xs`}
                              >
                                {categories.find((c) => c.id === post.category)?.name || post.category}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatTimeAgo(post.created_at)}
                            </p>
                          </div>
                        </div>

                        <div className="mb-4">
                          <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">{post.title}</h3>
                          <p className="text-muted-foreground leading-relaxed">{post.content}</p>
                          {post.tags && post.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {post.tags.map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  #{tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
                          <div className="flex items-center gap-6">
                            <button className="flex items-center gap-2 text-muted-foreground hover:text-red-500 transition-colors">
                              <Heart className="h-4 w-4" />
                              <span className="text-sm font-medium">{post.likes}</span>
                            </button>
                            <button className="flex items-center gap-2 text-muted-foreground hover:text-blue-500 transition-colors">
                              <MessageCircle className="h-4 w-4" />
                              <span className="text-sm font-medium">{post.comments}</span>
                            </button>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Eye className="h-4 w-4" />
                              <span className="text-sm">{post.views}</span>
                            </div>
                          </div>
                          <button className="flex items-center gap-2 text-muted-foreground hover:text-green-500 transition-colors">
                            <Share2 className="h-4 w-4" />
                            <span className="text-sm">Share</span>
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="my-posts" className="space-y-6">
                {!isAuthenticated ? (
                  <Card className="backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 border-0 shadow-xl">
                    <CardContent className="p-12 text-center">
                      <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-xl font-semibold mb-2">Sign in to view your posts</h3>
                      <p className="text-muted-foreground mb-4">Join the community to create and manage your posts</p>
                      <Button asChild>
                        <Link href="/login?redirect=/community">Sign In</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {posts.filter((post) => post.author.id === profile?.id).length === 0 ? (
                      <Card className="backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 border-0 shadow-xl">
                        <CardContent className="p-12 text-center">
                          <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-xl font-semibold mb-2">No posts yet</h3>
                          <p className="text-muted-foreground mb-4">
                            You haven't created any posts yet. Start sharing with the community!
                          </p>
                          <Button onClick={() => setIsCreateDialogOpen(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Your First Post
                          </Button>
                        </CardContent>
                      </Card>
                    ) : (
                      posts
                        .filter((post) => post.author.id === profile?.id)
                        .map((post) => (
                          <Card
                            key={post.id}
                            className="backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 border-0 shadow-xl"
                          >
                            <CardContent className="p-6">
                              <div className="flex items-center justify-between mb-4">
                                <Badge
                                  variant="outline"
                                  className={`text-${getCategoryColor(post.category)}-600 border-${getCategoryColor(post.category)}-200`}
                                >
                                  {categories.find((c) => c.id === post.category)?.name || post.category}
                                </Badge>
                                <span className="text-xs text-muted-foreground">{formatTimeAgo(post.created_at)}</span>
                              </div>
                              <h3 className="text-lg font-bold mb-2">{post.title}</h3>
                              <p className="text-muted-foreground mb-4">{post.content}</p>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Heart className="h-4 w-4" />
                                    {post.likes}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <MessageCircle className="h-4 w-4" />
                                    {post.comments}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Eye className="h-4 w-4" />
                                    {post.views}
                                  </span>
                                </div>
                                <Button variant="outline" size="sm">
                                  Edit
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="create" className="space-y-6">
                {!isAuthenticated ? (
                  <Card className="backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 border-0 shadow-xl">
                    <CardContent className="p-12 text-center">
                      <Plus className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-xl font-semibold mb-2">Sign in to create posts</h3>
                      <p className="text-muted-foreground mb-4">
                        Join the community to share your thoughts and connect with other fans
                      </p>
                      <Button asChild>
                        <Link href="/login?redirect=/community">Sign In</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 border-0 shadow-xl">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Plus className="h-5 w-5" />
                        Create New Post
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Input
                          placeholder="Post title..."
                          value={newPost.title}
                          onChange={(e) => setNewPost((prev) => ({ ...prev, title: e.target.value }))}
                          className="text-lg font-medium"
                        />
                      </div>
                      <div>
                        <Select
                          value={newPost.category}
                          onValueChange={(value) => setNewPost((prev) => ({ ...prev, category: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Textarea
                          placeholder="What's on your mind?"
                          value={newPost.content}
                          onChange={(e) => setNewPost((prev) => ({ ...prev, content: e.target.value }))}
                          className="min-h-32"
                        />
                      </div>
                      <div className="flex justify-end">
                        <Button onClick={handleCreatePost} disabled={!newPost.title.trim() || !newPost.content.trim()}>
                          Create Post
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Categories */}
            <Card className="backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5 text-blue-500" />
                  Categories
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedCategory === category.id
                          ? `bg-${category.color}-50 dark:bg-${category.color}-900/20 border border-${category.color}-200 dark:border-${category.color}-800`
                          : "hover:bg-slate-50 dark:hover:bg-slate-700/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{category.name}</p>
                          <p className="text-xs text-muted-foreground">{category.description}</p>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {category.post_count}
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Trending Topics */}
            <Card className="backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Trending Topics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <span className="text-sm font-medium">#EriggaMusic</span>
                    <Badge variant="secondary" className="text-xs">
                      24 posts
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <span className="text-sm font-medium">#NewRelease</span>
                    <Badge variant="secondary" className="text-xs">
                      18 posts
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <span className="text-sm font-medium">#Concert2024</span>
                    <Badge variant="secondary" className="text-xs">
                      12 posts
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <span className="text-sm font-medium">#FanArt</span>
                    <Badge variant="secondary" className="text-xs">
                      8 posts
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Community Stats */}
            <Card className="backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-500" />
                  Community Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Posts</span>
                    <span className="font-semibold">{posts.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Active Members</span>
                    <span className="font-semibold">1,234</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">This Week</span>
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      +15%
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
