"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { getTierDisplayInfo } from "@/hooks/useMembership"
import { Heart, MessageCircle, Plus, TrendingUp, Clock, MessageSquare, Filter } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface CommunityCategory {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string
  color: string
  display_order: number
  is_active: boolean
}

interface CommunityPost {
  id: string
  user_id: string
  category_id: string
  title: string | null
  content: string
  media_url: string | null
  media_type: string | null
  vote_count: number
  comment_count: number
  created_at: string
  updated_at: string
  username: string
  full_name: string
  avatar_url: string | null
  tier: string
  category_name: string
  category_color: string
  category_icon: string
  user_voted: boolean
}

export default function CommunityPage() {
  const { user, profile } = useAuth()
  const { toast } = useToast()
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [categories, setCategories] = useState<CommunityCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("newest")
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  // Form state
  const [newPost, setNewPost] = useState({
    title: "",
    content: "",
    category_id: "",
  })

  useEffect(() => {
    fetchCategories()
    fetchPosts()
  }, [selectedCategory, sortBy])

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/community/categories")
      const data = await response.json()
      if (data.categories) {
        setCategories(data.categories)
      }
    } catch (error) {
      console.error("Error fetching categories:", error)
    }
  }

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (selectedCategory !== "all") {
        params.append("category", selectedCategory)
      }
      params.append("sort", sortBy)

      const response = await fetch(`/api/community/posts?${params}`)
      const data = await response.json()
      if (data.posts) {
        setPosts(data.posts)
      }
    } catch (error) {
      console.error("Error fetching posts:", error)
      toast({
        title: "Error",
        description: "Failed to load posts",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePost = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to create a post",
        variant: "destructive",
      })
      return
    }

    if (!newPost.content.trim()) {
      toast({
        title: "Content Required",
        description: "Please enter some content for your post",
        variant: "destructive",
      })
      return
    }

    try {
      setCreating(true)
      const response = await fetch("/api/community/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newPost),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Success",
          description: "Your post has been created!",
        })
        setNewPost({ title: "", content: "", category_id: "" })
        setShowCreateDialog(false)
        fetchPosts() // Refresh posts
      } else {
        throw new Error(data.error || "Failed to create post")
      }
    } catch (error: any) {
      console.error("Error creating post:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to create post",
        variant: "destructive",
      })
    } finally {
      setCreating(false)
    }
  }

  const handleVote = async (postId: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to vote",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch(`/api/community/posts/${postId}/vote`, {
        method: "POST",
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Update the post in the local state
        setPosts((prevPosts) =>
          prevPosts.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  vote_count: data.vote_count,
                  user_voted: data.voted,
                }
              : post,
          ),
        )

        toast({
          title: "Success",
          description: data.message,
        })
      } else {
        throw new Error(data.error || "Failed to vote")
      }
    } catch (error: any) {
      console.error("Error voting:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to vote",
        variant: "destructive",
      })
    }
  }

  const getTierBadgeColor = (tier: string) => {
    const tierInfo = getTierDisplayInfo(tier)
    switch (tierInfo.color) {
      case "green":
        return "bg-green-100 text-green-800 border-green-200"
      case "blue":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "yellow":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Community</h1>
          <p className="text-gray-600 dark:text-gray-300">Connect with fellow Erigga fans and share your thoughts</p>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex gap-2">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">
                  <Clock className="w-4 h-4 mr-2 inline" />
                  Newest
                </SelectItem>
                <SelectItem value="popular">
                  <TrendingUp className="w-4 h-4 mr-2 inline" />
                  Popular
                </SelectItem>
                <SelectItem value="discussed">
                  <MessageSquare className="w-4 h-4 mr-2 inline" />
                  Most Discussed
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1" />

          {user && (
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Post
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Create New Post</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={newPost.category_id}
                      onValueChange={(value) => setNewPost({ ...newPost, category_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.icon} {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="title">Title (Optional)</Label>
                    <Input
                      id="title"
                      placeholder="Enter a title for your post..."
                      value={newPost.title}
                      onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="content">Content</Label>
                    <Textarea
                      id="content"
                      placeholder="What's on your mind?"
                      value={newPost.content}
                      onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                      rows={4}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreatePost} disabled={creating}>
                      {creating ? "Creating..." : "Create Post"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Posts */}
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-300">Loading posts...</p>
            </div>
          ) : posts.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No posts yet</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">Be the first to start a conversation!</p>
                {user && (
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Post
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            posts.map((post) => (
              <Card key={post.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={post.avatar_url || undefined} alt={post.username} />
                      <AvatarFallback>{post.username?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {post.full_name || post.username}
                        </span>
                        <Badge className={`text-xs ${getTierBadgeColor(post.tier)}`}>
                          {getTierDisplayInfo(post.tier).label}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                        </span>
                        {post.category_name && (
                          <Badge
                            variant="outline"
                            style={{ borderColor: post.category_color, color: post.category_color }}
                          >
                            {post.category_icon} {post.category_name}
                          </Badge>
                        )}
                      </div>
                      {post.title && (
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{post.title}</h3>
                      )}
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap mb-4">{post.content}</p>
                      <div className="flex items-center gap-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleVote(post.id)}
                          className={`${post.user_voted ? "text-red-600 bg-red-50 hover:bg-red-100" : "text-gray-600 hover:text-red-600"}`}
                        >
                          <Heart className={`w-4 h-4 mr-1 ${post.user_voted ? "fill-current" : ""}`} />
                          {post.vote_count}
                        </Button>
                        <Button variant="ghost" size="sm" className="text-gray-600 hover:text-blue-600">
                          <MessageCircle className="w-4 h-4 mr-1" />
                          {post.comment_count}
                        </Button>
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
  )
}
