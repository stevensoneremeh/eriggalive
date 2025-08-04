"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabaseClient"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MessageSquare, Share2, Plus, Search, ChevronUp, Send } from "lucide-react"

interface Post {
  id: number
  user_id: number
  category_id: number
  title: string | null
  content: string
  media_url: string | null
  media_type: string | null
  vote_count: number
  comment_count: number
  is_pinned: boolean
  created_at: string
  user?: {
    id: number
    username: string
    full_name: string | null
    avatar_url: string | null
    tier: string
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
    full_name: string | null
    avatar_url: string | null
    tier: string
  }
  has_liked?: boolean
}

interface Category {
  id: number
  name: string
  slug: string
  description: string | null
  icon: string | null
  color: string | null
}

export function CommunityClient() {
  const { user, profile } = useAuth()
  const { toast } = useToast()
  const [posts, setPosts] = useState<Post[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const [createPostOpen, setCreatePostOpen] = useState(false)
  const [newPost, setNewPost] = useState({
    title: "",
    content: "",
    category_id: "",
  })
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("recent")

  useEffect(() => {
    fetchCategories()
    fetchPosts()
  }, [selectedCategory, sortBy])

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("community_categories")
        .select("*")
        .eq("is_active", true)
        .order("display_order")

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error("Error fetching categories:", error)
    }
  }

  const fetchPosts = async () => {
    try {
      let query = supabase
        .from("community_posts")
        .select(`
          *,
          user:users!community_posts_user_id_fkey(id, username, full_name, avatar_url, tier),
          category:community_categories!community_posts_category_id_fkey(id, name, slug)
        `)
        .eq("is_published", true)
        .eq("is_deleted", false)

      if (selectedCategory !== "all") {
        const category = categories.find((c) => c.slug === selectedCategory)
        if (category) {
          query = query.eq("category_id", category.id)
        }
      }

      if (sortBy === "recent") {
        query = query.order("created_at", { ascending: false })
      } else if (sortBy === "popular") {
        query = query.order("vote_count", { ascending: false })
      } else if (sortBy === "discussed") {
        query = query.order("comment_count", { ascending: false })
      }

      const { data, error } = await query.limit(50)

      if (error) throw error
      setPosts(data || [])
    } catch (error) {
      console.error("Error fetching posts:", error)
    } finally {
      setLoading(false)
    }
  }

  const createPost = async () => {
    if (!profile || !newPost.content.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      const { data, error } = await supabase
        .from("community_posts")
        .insert({
          user_id: profile.id,
          category_id: Number.parseInt(newPost.category_id),
          title: newPost.title.trim() || null,
          content: newPost.content.trim(),
        })
        .select()

      if (error) throw error

      toast({
        title: "Success",
        description: "Your post has been created!",
      })

      setNewPost({ title: "", content: "", category_id: "" })
      setCreatePostOpen(false)
      fetchPosts()
    } catch (error) {
      console.error("Error creating post:", error)
      toast({
        title: "Error",
        description: "Failed to create post. Please try again.",
        variant: "destructive",
      })
    }
  }

  const votePost = async (postId: number, currentVoteCount: number) => {
    if (!profile) return

    try {
      // Check if user has already voted
      const { data: existingVote } = await supabase
        .from("community_votes")
        .select("*")
        .eq("user_id", profile.id)
        .eq("post_id", postId)
        .single()

      if (existingVote) {
        // Remove vote
        await supabase.from("community_votes").delete().eq("user_id", profile.id).eq("post_id", postId)

        // Update post vote count
        await supabase
          .from("community_posts")
          .update({ vote_count: currentVoteCount - 1 })
          .eq("id", postId)
      } else {
        // Add vote
        await supabase.from("community_votes").insert({
          user_id: profile.id,
          post_id: postId,
          vote_type: "up",
        })

        // Update post vote count
        await supabase
          .from("community_posts")
          .update({ vote_count: currentVoteCount + 1 })
          .eq("id", postId)
      }

      fetchPosts()
    } catch (error) {
      console.error("Error voting:", error)
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "blood":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
      case "elder":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300"
      case "pioneer":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300"
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const filteredPosts = posts.filter(
    (post) =>
      searchQuery === "" ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.title?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Community</h1>
            <p className="text-gray-600 dark:text-gray-300">Connect with fellow fans and share your thoughts</p>
          </div>

          <Dialog open={createPostOpen} onOpenChange={setCreatePostOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Create Post
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>Create New Post</DialogTitle>
                <DialogDescription>Share your thoughts with the community</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <Select
                    value={newPost.category_id}
                    onValueChange={(value) => setNewPost((prev) => ({ ...prev, category_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.icon} {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Title (Optional)</label>
                  <Input
                    placeholder="Enter post title..."
                    value={newPost.title}
                    onChange={(e) => setNewPost((prev) => ({ ...prev, title: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Content</label>
                  <Textarea
                    placeholder="What's on your mind?"
                    value={newPost.content}
                    onChange={(e) => setNewPost((prev) => ({ ...prev, content: e.target.value }))}
                    rows={4}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setCreatePostOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createPost} disabled={!newPost.content.trim() || !newPost.category_id}>
                    <Send className="w-4 h-4 mr-2" />
                    Post
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.slug} value={category.slug}>
                    {category.icon} {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Recent</SelectItem>
                <SelectItem value="popular">Popular</SelectItem>
                <SelectItem value="discussed">Most Discussed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Posts */}
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-300">Loading posts...</p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardContent className="text-center py-12">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No posts found</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {searchQuery ? "Try adjusting your search terms" : "Be the first to start a discussion!"}
                </p>
                {!searchQuery && (
                  <Button onClick={() => setCreatePostOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Post
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredPosts.map((post) => (
              <Card
                key={post.id}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:shadow-lg transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={post.user?.avatar_url || ""} />
                      <AvatarFallback>{getInitials(post.user?.full_name || post.user?.username || "U")}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {post.user?.full_name || post.user?.username}
                        </span>
                        <Badge className={`text-xs ${getTierColor(post.user?.tier || "grassroot")}`}>
                          {post.user?.tier?.toUpperCase() || "GRASSROOT"}
                        </Badge>
                        <span className="text-sm text-gray-500">{new Date(post.created_at).toLocaleDateString()}</span>
                        {post.category && (
                          <Badge variant="outline" className="text-xs">
                            {post.category.name}
                          </Badge>
                        )}
                      </div>

                      {post.title && (
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{post.title}</h3>
                      )}

                      <p className="text-gray-700 dark:text-gray-300 mb-4 whitespace-pre-wrap">{post.content}</p>

                      <div className="flex items-center space-x-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => votePost(post.id, post.vote_count)}
                          className="flex items-center space-x-1 hover:bg-purple-100 dark:hover:bg-purple-900/20"
                        >
                          <ChevronUp className="w-4 h-4" />
                          <span>{post.vote_count}</span>
                        </Button>

                        <Button variant="ghost" size="sm" className="flex items-center space-x-1">
                          <MessageSquare className="w-4 h-4" />
                          <span>{post.comment_count}</span>
                        </Button>

                        <Button variant="ghost" size="sm" className="flex items-center space-x-1">
                          <Share2 className="w-4 h-4" />
                          <span>Share</span>
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
