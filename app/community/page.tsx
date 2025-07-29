"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"
import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users, Plus, Search, TrendingUp, MessageSquare, Share, MoreVertical, Pin, Flag, ThumbsUp } from "lucide-react"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"

interface Category {
  id: number
  name: string
  slug: string
  description?: string
  is_active: boolean
}

interface Post {
  id: number
  user_id: number
  category_id: number
  title?: string
  content: string
  vote_count: number
  comment_count: number
  is_pinned: boolean
  created_at: string
  user?: {
    id: number
    username: string
    display_name?: string
    avatar_url?: string
    subscription_tier: string
  }
  category?: {
    id: number
    name: string
    slug: string
  }
  has_voted?: boolean
}

interface Comment {
  id: number
  post_id: number
  user_id: number
  content: string
  like_count: number
  created_at: string
  user?: {
    id: number
    username: string
    display_name?: string
    avatar_url?: string
    subscription_tier: string
  }
  has_liked?: boolean
}

// Fallback categories in case database query fails
const fallbackCategories: Category[] = [
  { id: 1, name: "General", slug: "general", description: "General discussions", is_active: true },
  { id: 2, name: "Music", slug: "music", description: "Music discussions and reviews", is_active: true },
  { id: 3, name: "Bars", slug: "bars", description: "Share your lyrical bars", is_active: true },
  { id: 4, name: "Events", slug: "events", description: "Community events and announcements", is_active: true },
]

// Mock data for posts
const mockPosts: Post[] = [
  {
    id: 1,
    user_id: 1,
    category_id: 1,
    title: "Welcome to the Erigga Community!",
    content:
      "This is the official community space where fans can connect, share music, and engage with exclusive content. Drop your thoughts and let's build something amazing together! 🎵",
    vote_count: 24,
    comment_count: 8,
    is_pinned: true,
    created_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    user: {
      id: 1,
      username: "erigga_official",
      display_name: "Erigga",
      avatar_url: "/placeholder-user.jpg",
      subscription_tier: "blood_brotherhood",
    },
    category: { id: 1, name: "General", slug: "general" },
    has_voted: false,
  },
  {
    id: 2,
    user_id: 2,
    category_id: 3,
    content:
      "Just dropped some fire bars! 🔥\n\n*Money dey my pocket, I no dey fear anybody*\n*Warri boy with the flow, making hits like it's easy*\n\nWhat y'all think? Drop your bars below! 👇",
    vote_count: 15,
    comment_count: 12,
    is_pinned: false,
    created_at: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
    user: {
      id: 2,
      username: "warri_finest",
      display_name: "Warri Finest",
      avatar_url: "/placeholder-user.jpg",
      subscription_tier: "pioneer",
    },
    category: { id: 3, name: "Bars", slug: "bars" },
    has_voted: true,
  },
  {
    id: 3,
    user_id: 3,
    category_id: 2,
    title: "Best Erigga Collaboration Ever?",
    content:
      "Been listening to Erigga's collabs and I think 'The Erigma II' had some of the sickest features. What's your favorite Erigga collaboration of all time?",
    vote_count: 31,
    comment_count: 18,
    is_pinned: false,
    created_at: new Date(Date.now() - 10800000).toISOString(), // 3 hours ago
    user: {
      id: 3,
      username: "music_lover",
      display_name: "Music Lover",
      avatar_url: "/placeholder-user.jpg",
      subscription_tier: "grassroot",
    },
    category: { id: 2, name: "Music", slug: "music" },
    has_voted: false,
  },
]

export default function CommunityPage() {
  const { user, profile } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [newPostContent, setNewPostContent] = useState("")
  const [newPostTitle, setNewPostTitle] = useState("")
  const [newPostCategory, setNewPostCategory] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  const supabase = createClient()

  useEffect(() => {
    fetchCategories()
    fetchPosts()
  }, [])

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase.from("community_categories").select("*").eq("is_active", true)

      if (error) {
        console.error("Error fetching categories:", error)
        setCategories(fallbackCategories)
      } else {
        setCategories(data || fallbackCategories)
      }
    } catch (error) {
      console.error("Error fetching categories:", error)
      setCategories(fallbackCategories)
    }
  }

  const fetchPosts = async () => {
    try {
      setLoading(true)
      // Use mock data for now
      setPosts(mockPosts)
    } catch (error) {
      console.error("Error fetching posts:", error)
      setPosts(mockPosts)
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) {
      toast.error("Post content cannot be empty")
      return
    }

    if (!newPostCategory) {
      toast.error("Please select a category")
      return
    }

    if (!user || !profile) {
      toast.error("Please sign in to create a post")
      return
    }

    setSubmitting(true)

    try {
      const newPost: Post = {
        id: Date.now(), // Mock ID
        user_id: profile.id,
        category_id: Number.parseInt(newPostCategory),
        title: newPostTitle.trim() || undefined,
        content: newPostContent.trim(),
        vote_count: 0,
        comment_count: 0,
        is_pinned: false,
        created_at: new Date().toISOString(),
        user: {
          id: profile.id,
          username: profile.username,
          display_name: profile.display_name || profile.full_name,
          avatar_url: profile.avatar_url,
          subscription_tier: profile.subscription_tier,
        },
        category: categories.find((c) => c.id === Number.parseInt(newPostCategory)),
        has_voted: false,
      }

      setPosts((prev) => [newPost, ...prev])
      setNewPostContent("")
      setNewPostTitle("")
      setNewPostCategory("")
      setShowCreatePost(false)
      toast.success("Post created successfully!")
    } catch (error) {
      console.error("Error creating post:", error)
      toast.error("Failed to create post")
    } finally {
      setSubmitting(false)
    }
  }

  const handleVote = async (postId: number) => {
    if (!user || !profile) {
      toast.error("Please sign in to vote")
      return
    }

    try {
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                vote_count: post.has_voted ? post.vote_count - 1 : post.vote_count + 1,
                has_voted: !post.has_voted,
              }
            : post,
        ),
      )

      toast.success("Vote recorded!")
    } catch (error) {
      console.error("Error voting:", error)
      toast.error("Failed to record vote")
    }
  }

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case "blood_brotherhood":
        return "bg-red-500 text-white"
      case "elder":
        return "bg-purple-500 text-white"
      case "pioneer":
        return "bg-blue-500 text-white"
      default:
        return "bg-green-500 text-white"
    }
  }

  const filteredPosts = posts.filter((post) => {
    const matchesCategory = selectedCategory === "all" || post.category?.slug === selectedCategory
    const matchesSearch =
      !searchTerm ||
      post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.user?.username?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <AuthGuard requireAuth={false}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-full text-lg font-bold mb-6 shadow-lg">
              <Users className="h-6 w-6" />
              Community
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-4">
              Connect & Share
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Join the conversation with fellow fans, share your music, and connect with Erigga's community
            </p>
          </div>

          {/* Actions Bar */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search posts, users, or content..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.slug}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={() => setShowCreatePost(!showCreatePost)}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Post
            </Button>
          </div>

          {/* Create Post Form */}
          {showCreatePost && (
            <Card className="mb-8 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-0 shadow-xl">
              <CardHeader>
                <CardTitle>Create New Post</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Post title (optional)"
                  value={newPostTitle}
                  onChange={(e) => setNewPostTitle(e.target.value)}
                />
                <Select value={newPostCategory} onValueChange={setNewPostCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Textarea
                  placeholder="What's on your mind? Share your thoughts, music, or bars..."
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  rows={4}
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleCreatePost}
                    disabled={submitting || !newPostContent.trim() || !newPostCategory}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                  >
                    {submitting ? "Posting..." : "Post"}
                  </Button>
                  <Button variant="outline" onClick={() => setShowCreatePost(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Posts Feed */}
          <div className="space-y-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading community posts...</p>
              </div>
            ) : filteredPosts.length === 0 ? (
              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-0 shadow-xl">
                <CardContent className="text-center py-12">
                  <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No posts found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm ? "Try adjusting your search terms" : "Be the first to start a conversation!"}
                  </p>
                  <Button
                    onClick={() => setShowCreatePost(true)}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                  >
                    Create First Post
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filteredPosts.map((post) => (
                <Card
                  key={post.id}
                  className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-0 shadow-xl hover:shadow-2xl transition-all"
                >
                  <CardContent className="p-6">
                    {/* Post Header */}
                    <div className="flex items-start gap-3 mb-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={post.user?.avatar_url || "/placeholder-user.jpg"} />
                        <AvatarFallback>{post.user?.username?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">{post.user?.display_name || post.user?.username}</span>
                          <Badge className={getTierBadgeColor(post.user?.subscription_tier || "grassroot")}>
                            {post.user?.subscription_tier?.charAt(0).toUpperCase() +
                              post.user?.subscription_tier?.slice(1)}
                          </Badge>
                          {post.is_pinned && (
                            <Badge variant="outline" className="text-blue-600 border-blue-600">
                              <Pin className="h-3 w-3 mr-1" />
                              Pinned
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{formatDistanceToNow(new Date(post.created_at))} ago</span>
                          <span>•</span>
                          <Badge variant="secondary">{post.category?.name}</Badge>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Post Content */}
                    <div className="mb-4">
                      {post.title && <h3 className="text-lg font-semibold mb-2">{post.title}</h3>}
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
                    </div>

                    {/* Post Actions */}
                    <div className="flex items-center gap-4 pt-4 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleVote(post.id)}
                        className={post.has_voted ? "text-blue-600" : ""}
                      >
                        <ThumbsUp className="h-4 w-4 mr-1" />
                        {post.vote_count}
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MessageSquare className="h-4 w-4 mr-1" />
                        {post.comment_count}
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Share className="h-4 w-4 mr-1" />
                        Share
                      </Button>
                      <Button variant="ghost" size="sm" className="ml-auto">
                        <Flag className="h-4 w-4 mr-1" />
                        Report
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Community Stats */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0">
              <CardContent className="p-6 text-center">
                <Users className="h-8 w-8 mx-auto mb-2" />
                <p className="text-2xl font-bold">{Math.floor(Math.random() * 5000 + 2500).toLocaleString()}</p>
                <p className="text-sm opacity-90">Community Members</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">
              <CardContent className="p-6 text-center">
                <MessageSquare className="h-8 w-8 mx-auto mb-2" />
                <p className="text-2xl font-bold">{Math.floor(Math.random() * 1000 + 500).toLocaleString()}</p>
                <p className="text-sm opacity-90">Posts This Month</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0">
              <CardContent className="p-6 text-center">
                <TrendingUp className="h-8 w-8 mx-auto mb-2" />
                <p className="text-2xl font-bold">{Math.floor(Math.random() * 100 + 50)}</p>
                <p className="text-sm opacity-90">Active Today</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
