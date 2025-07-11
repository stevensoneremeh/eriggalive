"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Plus, Heart, Share2, Search, TrendingUp, Clock, Users, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import Link from "next/link"
import { CommentSection } from "@/components/community/comment-section"

interface Category {
  id: number
  name: string
  slug: string
  icon: string
  color: string
}

interface Post {
  id: number
  content: string
  type: string
  media_url?: string
  media_type?: string
  hashtags: string[]
  vote_count: number
  comment_count: number
  view_count: number
  created_at: string
  user: {
    id: number
    username: string
    full_name: string
    avatar_url?: string
    tier: string
  }
  category: {
    id: number
    name: string
    slug: string
    icon: string
    color: string
  }
  has_voted: boolean
}

export default function CommunityPage() {
  const { profile, isAuthenticated } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)

  // Form state
  const [newPostContent, setNewPostContent] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("newest")

  useEffect(() => {
    loadPosts()
    loadCategories()
  }, [])

  const loadPosts = async () => {
    try {
      const response = await fetch("/api/community/posts")
      const data = await response.json()

      if (data.error) {
        console.error("Error loading posts:", data.error)
      } else {
        setPosts(data.posts || [])
      }
    } catch (error) {
      console.error("Error loading posts:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const response = await fetch("/api/community/categories")
      const data = await response.json()

      if (data.error) {
        console.error("Error loading categories:", data.error)
      } else {
        setCategories(data.categories || [])
      }
    } catch (error) {
      console.error("Error loading categories:", error)
    }
  }

  const handleCreatePost = async () => {
    if (!newPostContent.trim() || !selectedCategory) {
      toast.error("Please fill in all required fields")
      return
    }

    if (!isAuthenticated) {
      toast.error("Please sign in to create posts")
      return
    }

    setCreating(true)

    try {
      const response = await fetch("/api/community/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: newPostContent,
          categoryId: Number.parseInt(selectedCategory),
          type: "post",
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success("Post created successfully!")
        setNewPostContent("")
        setSelectedCategory("")
        setShowCreateForm(false)
        loadPosts() // Reload posts
      } else {
        toast.error(result.error || "Failed to create post")
      }
    } catch (error) {
      console.error("Error creating post:", error)
      toast.error("Failed to create post")
    } finally {
      setCreating(false)
    }
  }

  const handleVote = async (postId: number) => {
    if (!isAuthenticated) {
      toast.error("Please sign in to vote")
      return
    }

    try {
      const response = await fetch("/api/community/vote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ postId }),
      })

      const result = await response.json()

      if (result.success) {
        // Update local state
        setPosts((prev) =>
          prev.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  vote_count: result.voted ? post.vote_count + 1 : post.vote_count - 1,
                  has_voted: result.voted,
                }
              : post,
          ),
        )
        toast.success(result.voted ? "Vote added!" : "Vote removed!")
      } else {
        toast.error(result.error || "Failed to vote")
      }
    } catch (error) {
      console.error("Error voting:", error)
      toast.error("Failed to vote")
    }
  }

  const handleCommentCountChange = (postId: number, newCount: number) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? {
              ...post,
              comment_count: newCount,
            }
          : post,
      ),
    )
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

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.user.username.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  const sortedPosts = [...filteredPosts].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      case "oldest":
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      case "popular":
        return b.vote_count - a.vote_count
      default:
        return 0
    }
  })

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Community</h1>
        <p className="text-muted-foreground">Connect with fellow Erigga fans and share your thoughts</p>
      </div>

      {/* Create Post Section */}
      {isAuthenticated && profile ? (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Share with the community</CardTitle>
              <Button
                onClick={() => setShowCreateForm(!showCreateForm)}
                variant={showCreateForm ? "secondary" : "default"}
              >
                <Plus className="h-4 w-4 mr-2" />
                {showCreateForm ? "Cancel" : "Create Post"}
              </Button>
            </div>
          </CardHeader>

          {showCreateForm && (
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3 mb-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={profile?.avatar_url || "/placeholder-user.jpg"} />
                  <AvatarFallback>{profile?.username?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{profile?.username}</p>
                  <Badge className={cn("text-xs", getTierColor(profile?.tier || "grassroot"), "text-white")}>
                    {getTierDisplayName(profile?.tier || "grassroot")}
                  </Badge>
                </div>
              </div>

              <Textarea
                placeholder="What's on your mind?"
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                className="min-h-[100px]"
              />

              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      <div className="flex items-center space-x-2">
                        <span>{category.icon}</span>
                        <span>{category.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreatePost} disabled={creating || !newPostContent.trim() || !selectedCategory}>
                  {creating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Post"
                  )}
                </Button>
              </div>
            </CardContent>
          )}
        </Card>
      ) : (
        <Card className="mb-6">
          <CardContent className="text-center py-8">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Join the conversation</h3>
            <p className="text-muted-foreground mb-4">Sign in to create posts, vote, and interact with the community</p>
            <div className="space-x-2">
              <Button asChild>
                <Link href="/login">Sign In</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/signup">Sign Up</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    Newest
                  </div>
                </SelectItem>
                <SelectItem value="oldest">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    Oldest
                  </div>
                </SelectItem>
                <SelectItem value="popular">
                  <div className="flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Most Popular
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Posts */}
      <div className="space-y-6">
        {sortedPosts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No posts found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? "Try adjusting your search terms" : "Be the first to start a conversation!"}
              </p>
              {isAuthenticated && !showCreateForm && (
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Post
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          sortedPosts.map((post) => (
            <Card key={post.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                {/* Post Header */}
                <div className="flex items-start space-x-3 mb-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={post.user.avatar_url || "/placeholder-user.jpg"} />
                    <AvatarFallback>{post.user.username.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium">{post.user.username}</span>
                      <Badge className={cn("text-xs", getTierColor(post.user.tier), "text-white")}>
                        {getTierDisplayName(post.user.tier)}
                      </Badge>
                      <span className="text-sm text-muted-foreground">•</span>
                      <span className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span
                        className="text-xs px-2 py-1 rounded-full"
                        style={{ backgroundColor: post.category.color + "20", color: post.category.color }}
                      >
                        {post.category.icon} {post.category.name}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Post Content */}
                <div className="mb-4">
                  <p className="text-foreground whitespace-pre-wrap break-words">{post.content}</p>

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
                        <video src={post.media_url} controls className="rounded-lg max-w-full h-auto max-h-96" />
                      )}
                      {post.media_type === "audio" && <audio src={post.media_url} controls className="w-full" />}
                    </div>
                  )}

                  {post.hashtags && post.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {post.hashtags.map((tag, index) => (
                        <span key={index} className="text-sm text-primary hover:underline cursor-pointer">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <Separator className="mb-4" />

                {/* Post Actions */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <Button
                      variant={post.has_voted ? "default" : "ghost"}
                      size="sm"
                      onClick={() => handleVote(post.id)}
                      className={cn("flex items-center space-x-1", post.has_voted && "text-red-500")}
                    >
                      <Heart className={cn("h-4 w-4", post.has_voted && "fill-current")} />
                      <span>{post.vote_count}</span>
                    </Button>

                    <Button variant="ghost" size="sm" className="flex items-center space-x-1">
                      <Share2 className="h-4 w-4" />
                      <span>Share</span>
                    </Button>
                  </div>

                  <span className="text-sm text-muted-foreground">{post.view_count} views</span>
                </div>

                {/* Comments Section */}
                <CommentSection
                  postId={post.id}
                  commentCount={post.comment_count}
                  onCommentCountChange={(newCount) => handleCommentCountChange(post.id, newCount)}
                />
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
