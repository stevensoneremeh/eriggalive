"use client"

import type React from "react"

import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Heart, MessageSquare, Share2, Search, Filter, Plus, TrendingUp, Users } from "lucide-react"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

// Mock data for demonstration
const mockPosts = [
  {
    id: 1,
    title: "Thoughts on Erigga's latest track",
    content:
      "Just listened to the new single and I'm blown away! The production quality is incredible and the lyrics hit different. What does everyone think?",
    author: {
      id: 1,
      username: "erigga_fan_1",
      avatar_url: "/placeholder-user.jpg",
      tier: "pioneer",
    },
    category: "music",
    likes: 24,
    comments: 8,
    shares: 3,
    created_at: "2024-01-15T10:30:00Z",
    liked_by_user: false,
  },
  {
    id: 2,
    title: "Concert Experience - Lagos Show",
    content:
      "Attended the Lagos concert last night and it was absolutely incredible! The energy was unmatched. Erigga really knows how to connect with the crowd.",
    author: {
      id: 2,
      username: "lagos_vibes",
      avatar_url: "/placeholder-user.jpg",
      tier: "elder",
    },
    category: "events",
    likes: 45,
    comments: 12,
    shares: 7,
    created_at: "2024-01-14T15:45:00Z",
    liked_by_user: true,
  },
  {
    id: 3,
    title: "Favorite Erigga lyrics of all time",
    content:
      "What are your favorite Erigga lyrics? Mine has to be from 'The Erigma' - so much depth and meaning. Let's share our favorites!",
    author: {
      id: 3,
      username: "lyric_lover",
      avatar_url: "/placeholder-user.jpg",
      tier: "grassroot",
    },
    category: "discussion",
    likes: 18,
    comments: 23,
    shares: 5,
    created_at: "2024-01-13T09:20:00Z",
    liked_by_user: false,
  },
]

const mockCategories = [
  { id: "all", name: "All Posts", count: 156 },
  { id: "music", name: "Music", count: 89 },
  { id: "events", name: "Events", count: 34 },
  { id: "discussion", name: "Discussion", count: 67 },
  { id: "news", name: "News", count: 23 },
  { id: "fan-art", name: "Fan Art", count: 12 },
]

export default function CommunityPage() {
  const { user, profile, isAuthenticated } = useAuth()
  const [posts, setPosts] = useState(mockPosts)
  const [categories, setCategories] = useState(mockCategories)
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("recent")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newPost, setNewPost] = useState({
    title: "",
    content: "",
    category: "discussion",
  })
  const [isLoading, setIsLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const { data, error } = await supabase
          .from("community_posts")
          .select(`
            *,
            users (
              username,
              avatar_url,
              tier
            )
          `)
          .order("created_at", { ascending: false })

        if (error) {
          console.error("Error fetching posts:", error)
          // Use mock data as fallback
          setPosts(mockPosts)
        } else if (data) {
          setPosts(data)
        }
      } catch (error) {
        console.error("Error fetching posts:", error)
        setPosts(mockPosts)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPosts()
  }, [supabase])

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isAuthenticated) {
      toast.error("Please sign in to create a post")
      return
    }

    if (!newPost.title.trim() || !newPost.content.trim()) {
      toast.error("Please fill in all fields")
      return
    }

    try {
      const { data, error } = await supabase
        .from("community_posts")
        .insert([
          {
            title: newPost.title,
            content: newPost.content,
            category: newPost.category,
            user_id: user?.id,
          },
        ])
        .select()

      if (error) {
        console.error("Error creating post:", error)
        toast.error("Failed to create post")
      } else {
        toast.success("Post created successfully!")
        setNewPost({ title: "", content: "", category: "discussion" })
        setIsCreateDialogOpen(false)
        // Refresh posts
        window.location.reload()
      }
    } catch (error) {
      console.error("Error creating post:", error)
      toast.error("Failed to create post")
    }
  }

  const handleLikePost = async (postId: number) => {
    if (!isAuthenticated) {
      toast.error("Please sign in to like posts")
      return
    }

    // Update UI immediately for better UX
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.id === postId
          ? {
              ...post,
              likes: post.liked_by_user ? post.likes - 1 : post.likes + 1,
              liked_by_user: !post.liked_by_user,
            }
          : post,
      ),
    )

    // Here you would typically make an API call to update the like status
    // For now, we'll just show a toast
    toast.success("Post liked!")
  }

  const filteredPosts = posts.filter((post) => {
    const matchesCategory = selectedCategory === "all" || post.category === selectedCategory
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const sortedPosts = filteredPosts.sort((a, b) => {
    switch (sortBy) {
      case "popular":
        return b.likes - a.likes
      case "discussed":
        return b.comments - a.comments
      case "recent":
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "blood_brotherhood":
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Community</h1>
          <p className="text-muted-foreground">Connect with fellow Erigga fans and share your thoughts</p>
        </div>
        {isAuthenticated && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="mt-4 md:mt-0">
                <Plus className="h-4 w-4 mr-2" />
                Create Post
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>Create New Post</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreatePost} className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={newPost.title}
                    onChange={(e) => setNewPost((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter post title..."
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={newPost.category}
                    onValueChange={(value) => setNewPost((prev) => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="music">Music</SelectItem>
                      <SelectItem value="events">Events</SelectItem>
                      <SelectItem value="discussion">Discussion</SelectItem>
                      <SelectItem value="news">News</SelectItem>
                      <SelectItem value="fan-art">Fan Art</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    value={newPost.content}
                    onChange={(e) => setNewPost((prev) => ({ ...prev, content: e.target.value }))}
                    placeholder="What's on your mind?"
                    rows={4}
                    required
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Post</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Categories
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${
                    selectedCategory === category.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <span className="text-sm font-medium">{category.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {category.count}
                  </Badge>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Community Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">Total Members</span>
                </div>
                <span className="font-semibold">2,456</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Posts Today</span>
                </div>
                <span className="font-semibold">23</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-red-500" />
                  <span className="text-sm">Likes Today</span>
                </div>
                <span className="font-semibold">186</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* Search and Sort */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="discussed">Most Discussed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Posts */}
          <div className="space-y-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading posts...</p>
                </div>
              </div>
            ) : sortedPosts.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No posts found</h3>
                <p className="text-muted-foreground">
                  {searchQuery ? "Try adjusting your search terms" : "Be the first to start a discussion!"}
                </p>
              </div>
            ) : (
              sortedPosts.map((post) => (
                <Card key={post.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-10 w-10 ring-2 ring-white/20">
                        <AvatarImage src={post.author.avatar_url || "/placeholder.svg"} />
                        <AvatarFallback className={`${getTierColor(post.author.tier)} text-white`}>
                          {post.author.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold">{post.author.username}</span>
                          <Badge variant="secondary" className="text-xs">
                            {post.author.tier}
                          </Badge>
                          <span className="text-sm text-muted-foreground">{formatDate(post.created_at)}</span>
                        </div>
                        <h3 className="text-lg font-semibold mb-2">{post.title}</h3>
                        <p className="text-muted-foreground mb-4 line-clamp-3">{post.content}</p>
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => handleLikePost(post.id)}
                            className={`flex items-center gap-2 px-3 py-1 rounded-full transition-colors ${
                              post.liked_by_user
                                ? "bg-red-50 text-red-600 dark:bg-red-900/20"
                                : "hover:bg-slate-100 dark:hover:bg-slate-800"
                            }`}
                          >
                            <Heart className={`h-4 w-4 ${post.liked_by_user ? "fill-current" : ""}`} />
                            <span className="text-sm">{post.likes}</span>
                          </button>
                          <button className="flex items-center gap-2 px-3 py-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                            <MessageSquare className="h-4 w-4" />
                            <span className="text-sm">{post.comments}</span>
                          </button>
                          <button className="flex items-center gap-2 px-3 py-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                            <Share2 className="h-4 w-4" />
                            <span className="text-sm">{post.shares}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
