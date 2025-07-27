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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Heart,
  MessageSquare,
  Share2,
  Search,
  Filter,
  Plus,
  TrendingUp,
  Users,
  Eye,
  Clock,
  Pin,
  Star,
} from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"

interface CommunityPost {
  id: number
  user_id: number
  category_id: number
  content: string
  media_url?: string
  media_type?: string
  hashtags?: string[]
  vote_count: number
  comment_count: number
  view_count: number
  is_pinned: boolean
  is_featured: boolean
  is_active: boolean
  created_at: string
  updated_at: string
  user: {
    id: number
    username: string
    display_name?: string
    avatar_url?: string
    subscription_tier: string
    is_verified: boolean
  }
  category: {
    id: number
    name: string
    slug: string
    icon?: string
    color?: string
  }
  has_voted?: boolean
  user_vote_type?: "up" | "down" | null
}

interface CommunityCategory {
  id: number
  name: string
  slug: string
  description?: string
  icon?: string
  color?: string
  is_active: boolean
  post_count?: number
}

export default function CommunityPage() {
  const { user, profile, isAuthenticated, loading: authLoading } = useAuth()
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [categories, setCategories] = useState<CommunityCategory[]>([])
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("recent")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newPost, setNewPost] = useState({
    content: "",
    category_id: 1,
    hashtags: [] as string[],
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState("feed")

  const supabase = createClient()

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("community_categories")
        .select("*")
        .eq("is_active", true)
        .order("name")

      if (error) {
        console.error("Error fetching categories:", error)
        // Fallback categories
        setCategories([
          { id: 1, name: "General", slug: "general", icon: "💬", color: "#3B82F6", is_active: true },
          { id: 2, name: "Music", slug: "music", icon: "🎵", color: "#8B5CF6", is_active: true },
          { id: 3, name: "Events", slug: "events", icon: "📅", color: "#10B981", is_active: true },
          { id: 4, name: "Fan Art", slug: "fan-art", icon: "🎨", color: "#F59E0B", is_active: true },
        ])
      } else {
        setCategories(data || [])
      }
    } catch (error) {
      console.error("Error fetching categories:", error)
    }
  }, [supabase])

  // Fetch posts with user votes
  const fetchPosts = useCallback(async () => {
    try {
      setIsLoading(true)

      let query = supabase
        .from("community_posts")
        .select(`
          *,
          user:users!community_posts_user_id_fkey (
            id,
            username,
            display_name,
            avatar_url,
            subscription_tier,
            is_verified
          ),
          category:community_categories!community_posts_category_id_fkey (
            id,
            name,
            slug,
            icon,
            color
          )
        `)
        .eq("is_active", true)

      // Apply category filter
      if (selectedCategory) {
        query = query.eq("category_id", selectedCategory)
      }

      // Apply search filter
      if (searchQuery.trim()) {
        query = query.ilike("content", `%${searchQuery.trim()}%`)
      }

      // Apply sorting
      switch (sortBy) {
        case "popular":
          query = query.order("vote_count", { ascending: false })
          break
        case "discussed":
          query = query.order("comment_count", { ascending: false })
          break
        case "recent":
        default:
          query = query.order("created_at", { ascending: false })
          break
      }

      const { data: postsData, error } = await query.limit(50)

      if (error) {
        console.error("Error fetching posts:", error)
        toast.error("Failed to load posts")
        return
      }

      // If user is authenticated, fetch their votes
      let postsWithVotes = postsData || []
      if (isAuthenticated && profile && postsData) {
        const postIds = postsData.map((post) => post.id)
        const { data: votesData } = await supabase
          .from("community_post_votes")
          .select("post_id, vote_type")
          .eq("user_id", profile.id)
          .in("post_id", postIds)

        const userVotes = new Map(votesData?.map((vote) => [vote.post_id, vote.vote_type]) || [])

        postsWithVotes = postsData.map((post) => ({
          ...post,
          has_voted: userVotes.has(post.id),
          user_vote_type: userVotes.get(post.id) || null,
        }))
      }

      setPosts(postsWithVotes)
    } catch (error) {
      console.error("Error fetching posts:", error)
      toast.error("Failed to load posts")
    } finally {
      setIsLoading(false)
    }
  }, [supabase, selectedCategory, searchQuery, sortBy, isAuthenticated, profile])

  // Create new post
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isAuthenticated || !profile) {
      toast.error("Please sign in to create a post")
      return
    }

    if (!newPost.content.trim()) {
      toast.error("Please enter some content")
      return
    }

    setIsSubmitting(true)

    try {
      // Extract hashtags from content
      const hashtagMatches = newPost.content.match(/#\w+/g)
      const hashtags = hashtagMatches ? hashtagMatches.map((tag) => tag.slice(1)) : []

      const { data, error } = await supabase
        .from("community_posts")
        .insert({
          user_id: profile.id,
          category_id: newPost.category_id,
          content: newPost.content.trim(),
          hashtags: hashtags,
          vote_count: 0,
          comment_count: 0,
          view_count: 0,
          is_pinned: false,
          is_featured: false,
          is_active: true,
        })
        .select(`
          *,
          user:users!community_posts_user_id_fkey (
            id,
            username,
            display_name,
            avatar_url,
            subscription_tier,
            is_verified
          ),
          category:community_categories!community_posts_category_id_fkey (
            id,
            name,
            slug,
            icon,
            color
          )
        `)
        .single()

      if (error) {
        console.error("Error creating post:", error)
        toast.error("Failed to create post")
        return
      }

      // Update user's total posts count
      await supabase
        .from("users")
        .update({ total_posts: (profile.total_posts || 0) + 1 })
        .eq("id", profile.id)

      // Add new post to the beginning of the list
      setPosts((prevPosts) => [{ ...data, has_voted: false, user_vote_type: null }, ...prevPosts])

      // Reset form
      setNewPost({ content: "", category_id: 1, hashtags: [] })
      setIsCreateDialogOpen(false)
      setActiveTab("feed")

      toast.success("Post created successfully!")
    } catch (error) {
      console.error("Error creating post:", error)
      toast.error("Failed to create post")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle voting
  const handleVote = async (postId: number, voteType: "up" | "down") => {
    if (!isAuthenticated || !profile) {
      toast.error("Please sign in to vote")
      return
    }

    try {
      const post = posts.find((p) => p.id === postId)
      if (!post) return

      // Check if user already voted
      const { data: existingVote } = await supabase
        .from("community_post_votes")
        .select("vote_type")
        .eq("post_id", postId)
        .eq("user_id", profile.id)
        .single()

      let newVoteCount = post.vote_count
      let hasVoted = false
      let userVoteType: "up" | "down" | null = null

      if (existingVote) {
        if (existingVote.vote_type === voteType) {
          // Remove vote
          await supabase.from("community_post_votes").delete().eq("post_id", postId).eq("user_id", profile.id)

          newVoteCount = existingVote.vote_type === "up" ? post.vote_count - 1 : post.vote_count + 1
          hasVoted = false
          userVoteType = null
        } else {
          // Change vote
          await supabase
            .from("community_post_votes")
            .update({ vote_type: voteType })
            .eq("post_id", postId)
            .eq("user_id", profile.id)

          newVoteCount = voteType === "up" ? post.vote_count + 2 : post.vote_count - 2
          hasVoted = true
          userVoteType = voteType
        }
      } else {
        // Add new vote
        await supabase.from("community_post_votes").insert({
          post_id: postId,
          user_id: profile.id,
          vote_type: voteType,
        })

        newVoteCount = voteType === "up" ? post.vote_count + 1 : post.vote_count - 1
        hasVoted = true
        userVoteType = voteType
      }

      // Update post vote count
      await supabase.from("community_posts").update({ vote_count: newVoteCount }).eq("id", postId)

      // Update local state
      setPosts((prevPosts) =>
        prevPosts.map((p) =>
          p.id === postId ? { ...p, vote_count: newVoteCount, has_voted: hasVoted, user_vote_type: userVoteType } : p,
        ),
      )

      // Award coins to post author if upvoted
      if (voteType === "up" && !existingVote) {
        const { data: postAuthor } = await supabase
          .from("users")
          .select("coins_balance, total_votes_received")
          .eq("id", post.user_id)
          .single()

        if (postAuthor) {
          await supabase
            .from("users")
            .update({
              coins_balance: postAuthor.coins_balance + 10,
              total_votes_received: postAuthor.total_votes_received + 1,
            })
            .eq("id", post.user_id)

          // Create coin transaction record
          await supabase.from("coin_transactions").insert({
            user_id: post.user_id,
            transaction_type: "reward",
            amount: 10,
            balance_after: postAuthor.coins_balance + 10,
            description: "Received upvote on post",
            reference_id: postId.toString(),
            status: "completed",
          })
        }
      }
    } catch (error) {
      console.error("Error voting:", error)
      toast.error("Failed to vote")
    }
  }

  // Get tier color
  const getTierColor = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case "blood":
        return "bg-red-500"
      case "elder":
        return "bg-purple-500"
      case "pioneer":
        return "bg-blue-500"
      case "grassroot":
        return "bg-green-500"
      case "general":
      default:
        return "bg-gray-500"
    }
  }

  // Get tier display name
  const getTierDisplayName = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case "blood":
        return "Blood"
      case "elder":
        return "Elder"
      case "pioneer":
        return "Pioneer"
      case "grassroot":
        return "Grassroot"
      case "general":
      default:
        return "General"
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch {
      return "Recently"
    }
  }

  // Filter posts for "My Posts" tab
  const userPosts = posts.filter((post) => post.user_id === profile?.id)

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  useEffect(() => {
    if (!authLoading) {
      fetchPosts()
    }
  }, [fetchPosts, authLoading])

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    )
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
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={newPost.category_id.toString()}
                    onValueChange={(value) => setNewPost((prev) => ({ ...prev, category_id: Number.parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          <div className="flex items-center gap-2">
                            {category.icon && <span>{category.icon}</span>}
                            {category.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    value={newPost.content}
                    onChange={(e) => setNewPost((prev) => ({ ...prev, content: e.target.value }))}
                    placeholder="What's on your mind? Use #hashtags to categorize your post..."
                    rows={4}
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Tip: Use #hashtags to make your post discoverable
                  </p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Creating..." : "Create Post"}
                  </Button>
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
              <button
                onClick={() => setSelectedCategory(null)}
                className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${
                  selectedCategory === null
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <span className="text-sm font-medium">All Posts</span>
                <Badge variant="secondary" className="text-xs">
                  {posts.length}
                </Badge>
              </button>
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
                  <div className="flex items-center gap-2">
                    {category.icon && <span>{category.icon}</span>}
                    <span className="text-sm font-medium">{category.name}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {posts.filter((p) => p.category_id === category.id).length}
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
                  <span className="text-sm">Total Posts</span>
                </div>
                <span className="font-semibold">{posts.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Active Users</span>
                </div>
                <span className="font-semibold">{new Set(posts.map((p) => p.user_id)).size}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-red-500" />
                  <span className="text-sm">Total Votes</span>
                </div>
                <span className="font-semibold">{posts.reduce((sum, p) => sum + p.vote_count, 0)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="feed" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Feed
              </TabsTrigger>
              {isAuthenticated && (
                <TabsTrigger value="my-posts" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  My Posts ({userPosts.length})
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="feed" className="space-y-6">
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
                ) : posts.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No posts found</h3>
                    <p className="text-muted-foreground mb-4">
                      {searchQuery || selectedCategory
                        ? "Try adjusting your search or filters"
                        : "Be the first to start a discussion!"}
                    </p>
                    {isAuthenticated && (
                      <Button onClick={() => setIsCreateDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Post
                      </Button>
                    )}
                  </div>
                ) : (
                  posts.map((post) => (
                    <Card key={post.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        {post.is_pinned && (
                          <div className="flex items-center gap-2 mb-3 text-orange-600 dark:text-orange-400">
                            <Pin className="h-4 w-4" />
                            <span className="text-sm font-medium">Pinned Post</span>
                          </div>
                        )}

                        <div className="flex items-start gap-4">
                          <Avatar className="h-10 w-10 ring-2 ring-white/20">
                            <AvatarImage src={post.user.avatar_url || "/placeholder.svg"} />
                            <AvatarFallback className={`${getTierColor(post.user.subscription_tier)} text-white`}>
                              {post.user.username.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-semibold">{post.user.display_name || post.user.username}</span>
                              {post.user.is_verified && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                              <Badge variant="secondary" className="text-xs">
                                {getTierDisplayName(post.user.subscription_tier)}
                              </Badge>
                              <Badge
                                variant="outline"
                                className="text-xs"
                                style={{
                                  borderColor: post.category.color,
                                  color: post.category.color,
                                }}
                              >
                                {post.category.icon} {post.category.name}
                              </Badge>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {formatDate(post.created_at)}
                              </div>
                            </div>

                            <p className="text-muted-foreground mb-4 whitespace-pre-wrap">{post.content}</p>

                            {post.hashtags && post.hashtags.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-4">
                                {post.hashtags.map((hashtag, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    #{hashtag}
                                  </Badge>
                                ))}
                              </div>
                            )}

                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleVote(post.id, "up")}
                                    className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
                                      post.user_vote_type === "up"
                                        ? "bg-green-50 text-green-600 dark:bg-green-900/20"
                                        : "hover:bg-slate-100 dark:hover:bg-slate-800"
                                    }`}
                                    disabled={!isAuthenticated}
                                  >
                                    <Heart
                                      className={`h-4 w-4 ${post.user_vote_type === "up" ? "fill-current" : ""}`}
                                    />
                                  </button>
                                  <span className="text-sm font-medium">{post.vote_count}</span>
                                </div>

                                <button className="flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                  <MessageSquare className="h-4 w-4" />
                                  <span className="text-sm">{post.comment_count}</span>
                                </button>

                                <button className="flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                  <Share2 className="h-4 w-4" />
                                </button>
                              </div>

                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Eye className="h-3 w-3" />
                                {post.view_count}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {isAuthenticated && (
              <TabsContent value="my-posts" className="space-y-6">
                <div className="space-y-6">
                  {userPosts.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
                      <p className="text-muted-foreground mb-4">
                        You haven't created any posts yet. Start sharing with the community!
                      </p>
                      <Button onClick={() => setIsCreateDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Your First Post
                      </Button>
                    </div>
                  ) : (
                    userPosts.map((post) => (
                      <Card key={post.id} className="hover:shadow-lg transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <Badge
                              variant="outline"
                              className="text-xs"
                              style={{
                                borderColor: post.category.color,
                                color: post.category.color,
                              }}
                            >
                              {post.category.icon} {post.category.name}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{formatDate(post.created_at)}</span>
                          </div>

                          <p className="text-muted-foreground mb-4 whitespace-pre-wrap">{post.content}</p>

                          {post.hashtags && post.hashtags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                              {post.hashtags.map((hashtag, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  #{hashtag}
                                </Badge>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Heart className="h-4 w-4" />
                                {post.vote_count}
                              </span>
                              <span className="flex items-center gap-1">
                                <MessageSquare className="h-4 w-4" />
                                {post.comment_count}
                              </span>
                              <span className="flex items-center gap-1">
                                <Eye className="h-4 w-4" />
                                {post.view_count}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    </div>
  )
}
