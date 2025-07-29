"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Users, MessageSquare, Heart, Share2, Plus, TrendingUp, Clock } from "lucide-react"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"

interface CommunityPost {
  id: number
  user_id: number
  category_id: number
  title?: string
  content: string
  media_url?: string
  media_type?: string
  vote_count: number
  comment_count: number
  is_pinned: boolean
  created_at: string
  user?: {
    id: number
    username: string
    full_name?: string
    avatar_url?: string
    tier: string
  }
  category?: {
    id: number
    name: string
    slug: string
  }
  has_voted?: boolean
}

interface CommunityCategory {
  id: number
  name: string
  slug: string
  description?: string
  is_active: boolean
}

export default function CommunityPage() {
  const { user, profile, isAuthenticated } = useAuth()
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [categories, setCategories] = useState<CommunityCategory[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const [createPostOpen, setCreatePostOpen] = useState(false)
  const [newPost, setNewPost] = useState({
    title: "",
    content: "",
    category_id: 1,
  })
  const supabase = createClient()

  // Fallback categories in case database query fails
  const fallbackCategories: CommunityCategory[] = [
    { id: 1, name: "General", slug: "general", description: "General discussions", is_active: true },
    { id: 2, name: "Music", slug: "music", description: "Music discussions", is_active: true },
    { id: 3, name: "Events", slug: "events", description: "Event announcements", is_active: true },
    { id: 4, name: "Bars", slug: "bars", description: "Share your bars", is_active: true },
  ]

  // Mock posts for demonstration
  const mockPosts: CommunityPost[] = [
    {
      id: 1,
      user_id: 1,
      category_id: 1,
      title: "Welcome to the Erigga Community!",
      content:
        "This is where we connect, share, and grow together. Drop your thoughts and let's build something amazing!",
      vote_count: 25,
      comment_count: 8,
      is_pinned: true,
      created_at: new Date(Date.now() - 3600000).toISOString(),
      user: {
        id: 1,
        username: "erigga_official",
        full_name: "Erigga",
        avatar_url: "/placeholder-user.jpg",
        tier: "blood_brotherhood",
      },
      category: {
        id: 1,
        name: "General",
        slug: "general",
      },
      has_voted: false,
    },
    {
      id: 2,
      user_id: 2,
      category_id: 2,
      title: "New Track Alert! 🔥",
      content: "Just dropped some fire bars! What y'all think about the new sound? Let me know in the comments 💯",
      media_url: "/placeholder.jpg",
      media_type: "image",
      vote_count: 42,
      comment_count: 15,
      is_pinned: false,
      created_at: new Date(Date.now() - 7200000).toISOString(),
      user: {
        id: 2,
        username: "warri_boy",
        full_name: "Warri Boy",
        avatar_url: "/placeholder-user.jpg",
        tier: "pioneer",
      },
      category: {
        id: 2,
        name: "Music",
        slug: "music",
      },
      has_voted: true,
    },
    {
      id: 3,
      user_id: 3,
      category_id: 4,
      content:
        "Yo, check this bar I just wrote:\n\n'Money dey my pocket, but my mind dey street\nEvery hustle wey I do, na for my people to eat'\n\nWhat you think? 🎤",
      vote_count: 18,
      comment_count: 6,
      is_pinned: false,
      created_at: new Date(Date.now() - 10800000).toISOString(),
      user: {
        id: 3,
        username: "lyrical_genius",
        full_name: "Lyrical Genius",
        avatar_url: "/placeholder-user.jpg",
        tier: "grassroot",
      },
      category: {
        id: 4,
        name: "Bars",
        slug: "bars",
      },
      has_voted: false,
    },
  ]

  useEffect(() => {
    loadCategories()
    loadPosts()
  }, [selectedCategory])

  const loadCategories = async () => {
    try {
      // Use fallback categories for now to avoid the .order() error
      setCategories(fallbackCategories)
    } catch (error) {
      console.error("Error fetching categories:", error)
      setCategories(fallbackCategories)
    }
  }

  const loadPosts = async () => {
    try {
      setLoading(true)
      // Use mock posts for demonstration
      setPosts(mockPosts)
    } catch (error) {
      console.error("Error fetching posts:", error)
      setPosts(mockPosts)
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePost = async () => {
    if (!isAuthenticated || !newPost.content.trim()) {
      toast.error("Please sign in and add content to create a post")
      return
    }

    try {
      // Mock post creation
      const mockNewPost: CommunityPost = {
        id: Date.now(),
        user_id: profile?.id || 1,
        category_id: newPost.category_id,
        title: newPost.title || undefined,
        content: newPost.content,
        vote_count: 0,
        comment_count: 0,
        is_pinned: false,
        created_at: new Date().toISOString(),
        user: {
          id: profile?.id || 1,
          username: profile?.username || "user",
          full_name: profile?.full_name || profile?.username || "User",
          avatar_url: profile?.avatar_url || "/placeholder-user.jpg",
          tier: profile?.tier || "grassroot",
        },
        category: categories.find((c) => c.id === newPost.category_id),
        has_voted: false,
      }

      setPosts([mockNewPost, ...posts])
      setNewPost({ title: "", content: "", category_id: 1 })
      setCreatePostOpen(false)
      toast.success("Post created successfully!")
    } catch (error) {
      console.error("Error creating post:", error)
      toast.error("Failed to create post")
    }
  }

  const handleVote = async (postId: number) => {
    if (!isAuthenticated) {
      toast.error("Please sign in to vote")
      return
    }

    try {
      // Mock voting
      setPosts(
        posts.map((post) =>
          post.id === postId
            ? {
                ...post,
                vote_count: post.has_voted ? post.vote_count - 1 : post.vote_count + 1,
                has_voted: !post.has_voted,
              }
            : post,
        ),
      )

      toast.success(posts.find((p) => p.id === postId)?.has_voted ? "Vote removed" : "Vote added!")
    } catch (error) {
      console.error("Error voting:", error)
      toast.error("Failed to vote")
    }
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

  const filteredPosts =
    selectedCategory === "all" ? posts : posts.filter((post) => post.category?.slug === selectedCategory)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Users className="h-4 w-4" />
            Community
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
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-0 shadow-xl">
            <CardContent className="p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full mb-4">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-blue-600">2.5K+</p>
              <p className="text-sm text-muted-foreground">Members</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-0 shadow-xl">
            <CardContent className="p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full mb-4">
                <MessageSquare className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-600">1.2K+</p>
              <p className="text-sm text-muted-foreground">Posts</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-0 shadow-xl">
            <CardContent className="p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full mb-4">
                <Heart className="h-6 w-6 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-purple-600">8.5K+</p>
              <p className="text-sm text-muted-foreground">Likes</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-0 shadow-xl">
            <CardContent className="p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-full mb-4">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
              <p className="text-2xl font-bold text-orange-600">95%</p>
              <p className="text-sm text-muted-foreground">Active</p>
            </CardContent>
          </Card>
        </div>

        {/* Create Post Button */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold">Community Feed</h2>
            <Badge variant="secondary">{filteredPosts.length} posts</Badge>
          </div>
          {isAuthenticated && (
            <Dialog open={createPostOpen} onOpenChange={setCreatePostOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Post
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Post</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Category</label>
                    <select
                      value={newPost.category_id}
                      onChange={(e) => setNewPost({ ...newPost, category_id: Number.parseInt(e.target.value) })}
                      className="w-full p-2 border rounded-md bg-background"
                    >
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Title (Optional)</label>
                    <Input
                      placeholder="Enter post title..."
                      value={newPost.title}
                      onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Content</label>
                    <Textarea
                      placeholder="What's on your mind?"
                      value={newPost.content}
                      onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                      rows={4}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setCreatePostOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreatePost} disabled={!newPost.content.trim()}>
                      Create Post
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Category Filter */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All</TabsTrigger>
            {categories.slice(0, 4).map((category) => (
              <TabsTrigger key={category.slug} value={category.slug}>
                {category.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Posts Feed */}
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading posts...</p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-0 shadow-xl">
              <CardContent className="text-center py-12">
                <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
                <p className="text-muted-foreground mb-4">Be the first to start a conversation in this category!</p>
                {isAuthenticated && (
                  <Button onClick={() => setCreatePostOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Post
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredPosts.map((post) => (
              <Card key={post.id} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-0 shadow-xl">
                <CardContent className="p-6">
                  {/* Post Header */}
                  <div className="flex items-start gap-4 mb-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={post.user?.avatar_url || "/placeholder.svg"} />
                      <AvatarFallback className={`${getTierColor(post.user?.tier || "grassroot")} text-white`}>
                        {post.user?.username?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{post.user?.full_name || post.user?.username}</h3>
                        <Badge variant="secondary" className="text-xs">
                          {post.user?.tier?.replace("_", " ")}
                        </Badge>
                        {post.is_pinned && (
                          <Badge variant="default" className="text-xs bg-yellow-500">
                            Pinned
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{post.category?.name}</span>
                        <span>•</span>
                        <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                      </div>
                    </div>
                  </div>

                  {/* Post Content */}
                  <div className="mb-4">
                    {post.title && <h2 className="text-xl font-bold mb-2">{post.title}</h2>}
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{post.content}</p>
                    {post.media_url && (
                      <div className="mt-4">
                        {post.media_type === "image" && (
                          <img
                            src={post.media_url || "/placeholder.svg"}
                            alt="Post media"
                            className="rounded-lg max-w-full h-auto max-h-96 object-cover"
                          />
                        )}
                        {post.media_type === "video" && (
                          <video controls className="rounded-lg max-w-full h-auto max-h-96">
                            <source src={post.media_url} type="video/mp4" />
                          </video>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Post Actions */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleVote(post.id)}
                        className={`${post.has_voted ? "text-red-500" : "text-muted-foreground"} hover:text-red-500`}
                      >
                        <Heart className={`h-4 w-4 mr-1 ${post.has_voted ? "fill-current" : ""}`} />
                        {post.vote_count}
                      </Button>
                      <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-blue-500">
                        <MessageSquare className="h-4 w-4 mr-1" />
                        {post.comment_count}
                      </Button>
                      <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-green-500">
                        <Share2 className="h-4 w-4 mr-1" />
                        Share
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
