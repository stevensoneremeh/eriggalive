"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Send,
  Heart,
  MessageCircle,
  Share2,
  MoreVertical,
  ImageIcon,
  Video,
  Music,
  Hash,
  Users,
  TrendingUp,
  Clock,
  Search,
  Filter,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

interface CommunityPost {
  id: number
  title: string
  content: string
  media_url?: string
  media_type?: string
  hashtags: string[]
  vote_count: number
  comment_count: number
  created_at: string
  updated_at: string
  user_id: string
  category_id: number
  category_name: string
  category_color: string
  category_icon: string
  username: string
  full_name: string
  avatar_url?: string
  user_voted: boolean
}

interface CommunityCategory {
  id: number
  name: string
  slug: string
  description: string
  color: string
  icon: string
  display_order: number
  is_active: boolean
  created_at: string
}

export default function CommunityPage() {
  const { user, isAuthenticated } = useAuth()
  const { toast } = useToast()
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [categories, setCategories] = useState<CommunityCategory[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)
  const [newPost, setNewPost] = useState({ title: "", content: "", category_id: 1 })
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<"recent" | "popular" | "trending">("recent")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const supabase = createClient()

  // Fetch categories
  useEffect(() => {
    fetchCategories()
  }, [])

  // Fetch posts when category or sort changes
  useEffect(() => {
    fetchPosts()
  }, [selectedCategory, sortBy])

  // Auto-scroll to bottom for new posts
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [posts])

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
      toast({
        title: "Error",
        description: "Failed to load categories",
        variant: "destructive",
      })
    }
  }

  const fetchPosts = async () => {
    try {
      setLoading(true)

      // Get category ID if filtering by specific category
      let categoryFilter = null
      if (selectedCategory !== "all") {
        const category = categories.find((c) => c.slug === selectedCategory)
        if (category) {
          categoryFilter = category.id
        }
      }

      // Use the new database function
      const { data, error } = await supabase.rpc("get_community_posts_with_user_data", {
        category_filter: categoryFilter,
      })

      if (error) throw error

      // Sort posts on client side since the function returns them in creation order
      let sortedPosts = data || []
      switch (sortBy) {
        case "popular":
          sortedPosts = sortedPosts.sort((a, b) => b.vote_count - a.vote_count)
          break
        case "trending":
          sortedPosts = sortedPosts.sort((a, b) => b.comment_count - a.comment_count)
          break
        default:
          sortedPosts = sortedPosts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      }

      setPosts(sortedPosts)
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

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAuthenticated || !user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to create posts",
        variant: "destructive",
      })
      return
    }

    if (!newPost.title.trim() || !newPost.content.trim()) {
      toast({
        title: "Missing Content",
        description: "Please provide both title and content",
        variant: "destructive",
      })
      return
    }

    try {
      setPosting(true)

      // Use the new database function
      const { data, error } = await supabase.rpc("create_community_post", {
        post_title: newPost.title.trim(),
        post_content: newPost.content.trim(),
        post_category_id: newPost.category_id,
        post_hashtags: extractHashtags(newPost.content),
      })

      if (error) throw error

      toast({
        title: "Success",
        description: "Your post has been created!",
      })

      setNewPost({ title: "", content: "", category_id: 1 })
      fetchPosts() // Refresh posts
    } catch (error) {
      console.error("Error creating post:", error)
      toast({
        title: "Error",
        description: "Failed to create post",
        variant: "destructive",
      })
    } finally {
      setPosting(false)
    }
  }

  const extractHashtags = (content: string): string[] => {
    const hashtags = content.match(/#\w+/g) || []
    return hashtags.map((tag) => tag.toLowerCase())
  }

  const handleVotePost = async (postId: number) => {
    if (!isAuthenticated || !user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to vote",
        variant: "destructive",
      })
      return
    }

    try {
      // Use the new database function
      const { data, error } = await supabase.rpc("toggle_post_vote", {
        post_id_param: postId,
      })

      if (error) throw error

      fetchPosts() // Refresh posts to show updated vote counts
    } catch (error) {
      console.error("Error voting:", error)
      toast({
        title: "Error",
        description: "Failed to vote on post",
        variant: "destructive",
      })
    }
  }

  const filteredPosts = posts.filter(
    (post) =>
      searchQuery === "" ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.username.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const getCategoryIcon = (iconName: string) => {
    const icons: { [key: string]: any } = {
      music: Music,
      video: Video,
      image: ImageIcon,
      hash: Hash,
      users: Users,
      trending: TrendingUp,
    }
    return icons[iconName] || Hash
  }

  return (
    <div className="min-h-screen bg-background pt-16">
      {/* Header - Fixed positioning issue */}
      <div className="sticky top-16 z-30 bg-background/95 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Community</h1>
              <p className="text-sm text-muted-foreground">Connect with fellow Erigga fans</p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search posts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setSortBy(sortBy === "recent" ? "popular" : sortBy === "popular" ? "trending" : "recent")
                }
                className="w-full sm:w-auto"
              >
                <Filter className="h-4 w-4 mr-2" />
                {sortBy === "recent" ? "Recent" : sortBy === "popular" ? "Popular" : "Trending"}
              </Button>
            </div>
          </div>

          {/* Category Tabs - WhatsApp Style with improved mobile layout */}
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
            <TabsList className="w-full h-auto p-1 bg-muted/50 overflow-x-auto">
              <div className="flex gap-2 min-w-max">
                <TabsTrigger
                  value="all"
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground whitespace-nowrap"
                >
                  <Users className="h-4 w-4" />
                  <span className="text-sm">All</span>
                </TabsTrigger>
                {categories.map((category) => {
                  const IconComponent = getCategoryIcon(category.icon)
                  return (
                    <TabsTrigger
                      key={category.id}
                      value={category.slug}
                      className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground whitespace-nowrap"
                    >
                      <IconComponent className="h-4 w-4" />
                      <span className="text-sm">{category.name}</span>
                    </TabsTrigger>
                  )
                })}
              </div>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-4 sm:space-y-6">
            {/* Create Post Form - Improved mobile layout */}
            {isAuthenticated && (
              <Card className="glass-card">
                <CardContent className="p-4 sm:p-6">
                  <form onSubmit={handleCreatePost} className="space-y-4">
                    <div className="flex items-center gap-3 mb-4">
                      <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                        <AvatarImage src={user?.avatar_url || "/placeholder.svg"} />
                        <AvatarFallback>{user?.username?.[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm sm:text-base">{user?.username}</p>
                        <Badge variant="secondary" className="text-xs">
                          {user?.tier || "Free"}
                        </Badge>
                      </div>
                    </div>

                    <Input
                      placeholder="What's the title of your post?"
                      value={newPost.title}
                      onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                      className="border-0 bg-muted/50 focus-visible:ring-1 text-sm sm:text-base"
                    />

                    <Textarea
                      placeholder="Share your thoughts with the community... Use #hashtags to categorize your post!"
                      value={newPost.content}
                      onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                      className="border-0 bg-muted/50 focus-visible:ring-1 min-h-[80px] sm:min-h-[100px] resize-none text-sm sm:text-base"
                      rows={4}
                    />

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                      <select
                        value={newPost.category_id}
                        onChange={(e) => setNewPost({ ...newPost, category_id: Number.parseInt(e.target.value) })}
                        className="px-3 py-2 rounded-lg bg-muted/50 border-0 focus:ring-1 focus:ring-primary text-sm w-full sm:w-auto"
                      >
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>

                      <Button type="submit" disabled={posting} className="rounded-full w-full sm:w-auto">
                        {posting ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                        <span className="ml-2">{posting ? "Posting..." : "Post"}</span>
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Posts Feed - Improved mobile layout */}
            <div className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : filteredPosts.length === 0 ? (
                <Card className="glass-card">
                  <CardContent className="p-8 sm:p-12 text-center">
                    <Users className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-base sm:text-lg font-semibold mb-2">No posts yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {selectedCategory === "all"
                        ? "Be the first to start a conversation!"
                        : `No posts in ${categories.find((c) => c.slug === selectedCategory)?.name} yet.`}
                    </p>
                    {!isAuthenticated && (
                      <Link href="/login">
                        <Button>Join the Community</Button>
                      </Link>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <AnimatePresence>
                  {filteredPosts.map((post, index) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <Card className="glass-card hover:shadow-lg transition-all duration-300">
                        <CardContent className="p-4 sm:p-6">
                          {/* Post Header - Improved mobile layout */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
                                <AvatarImage src={post.avatar_url || "/placeholder.svg"} />
                                <AvatarFallback>{post.username?.[0]?.toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-medium text-sm sm:text-base truncate">{post.username}</p>
                                  <Badge
                                    variant="secondary"
                                    className="text-xs flex-shrink-0"
                                    style={{ backgroundColor: post.category_color + "20" }}
                                  >
                                    Fan
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground flex-wrap">
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {new Date(post.created_at).toLocaleDateString()}
                                  </div>
                                  <Badge variant="outline" className="text-xs">
                                    {post.category_name}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" className="flex-shrink-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </div>

                          {/* Post Content */}
                          <div className="mb-4">
                            <h3 className="text-base sm:text-lg font-semibold mb-2 break-words">{post.title}</h3>
                            <p className="text-sm sm:text-base text-foreground leading-relaxed whitespace-pre-wrap break-words">
                              {post.content}
                            </p>

                            {/* Hashtags */}
                            {post.hashtags && post.hashtags.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-3">
                                {post.hashtags.map((hashtag, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">
                                    {hashtag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Post Actions - Improved mobile layout */}
                          <div className="flex items-center justify-between pt-4 border-t">
                            <div className="flex items-center gap-2 sm:gap-4">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleVotePost(post.id)}
                                className={`flex items-center gap-1 sm:gap-2 hover:text-red-500 text-xs sm:text-sm ${post.user_voted ? "text-red-500" : ""}`}
                              >
                                <Heart className={`h-3 w-3 sm:h-4 sm:w-4 ${post.user_voted ? "fill-current" : ""}`} />
                                {post.vote_count}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
                              >
                                <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                                {post.comment_count}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
                              >
                                <Share2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span className="hidden sm:inline">Share</span>
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Sidebar - Improved mobile layout */}
          <div className="space-y-4 sm:space-y-6">
            {/* Community Stats */}
            <Card className="glass-card">
              <CardContent className="p-4 sm:p-6">
                <h3 className="font-semibold mb-4 text-sm sm:text-base">Community Stats</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm text-muted-foreground">Total Posts</span>
                    <span className="font-medium text-sm sm:text-base">{posts.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm text-muted-foreground">Active Categories</span>
                    <span className="font-medium text-sm sm:text-base">{categories.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm text-muted-foreground">Online Now</span>
                    <span className="font-medium text-green-500">●</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Trending Hashtags */}
            <Card className="glass-card">
              <CardContent className="p-4 sm:p-6">
                <h3 className="font-semibold mb-4 text-sm sm:text-base">Trending Topics</h3>
                <div className="space-y-2">
                  {["#EriggaLive", "#PaperBoi", "#WarriPikin", "#NewMusic", "#Community"].map((tag, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{Math.floor(Math.random() * 50) + 10}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Community Guidelines */}
            <Card className="glass-card">
              <CardContent className="p-4 sm:p-6">
                <h3 className="font-semibold mb-4 text-sm sm:text-base">Community Guidelines</h3>
                <ul className="text-xs sm:text-sm text-muted-foreground space-y-2">
                  <li>• Be respectful to all members</li>
                  <li>• No spam or self-promotion</li>
                  <li>• Keep discussions relevant</li>
                  <li>• Use appropriate hashtags</li>
                  <li>• Report inappropriate content</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
