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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Send,
  Heart,
  MessageCircle,
  Share2,
  MoreVertical,
  Users,
  Clock,
  Search,
  Filter,
  Radio,
  Mic,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { ShoutOutDisplay } from "@/components/shout-out-display"
import { AnimatedRadioCharacter } from "@/components/radio/animated-radio-character"

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

      if (error) {
        console.log("[v0] Categories error:", error)
        // Create default categories if none exist
        setCategories([
          {
            id: 1,
            name: "General",
            slug: "general",
            description: "General discussion",
            color: "#3B82F6",
            icon: "users",
            display_order: 1,
            is_active: true,
            created_at: new Date().toISOString(),
          },
        ])
        return
      }
      setCategories(data || [])
    } catch (error) {
      console.error("Error fetching categories:", error)
      setCategories([
        {
          id: 1,
          name: "General",
          slug: "general",
          description: "General discussion",
          color: "#3B82F6",
          icon: "users",
          display_order: 1,
          is_active: true,
          created_at: new Date().toISOString(),
        },
      ])
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

      console.log("[v0] Fetching posts with category filter:", categoryFilter)

      // Use the database function
      const { data, error } = await supabase.rpc("get_community_posts_with_user_data", {
        category_filter: categoryFilter,
      })

      if (error) {
        console.log("[v0] Posts fetch error:", error)
        // If function doesn't exist, try direct table query
        const { data: fallbackData, error: fallbackError } = await supabase
          .from("community_posts")
          .select(`
            *,
            users:user_id (username, full_name, avatar_url),
            community_categories:category_id (name, color, icon)
          `)
          .eq("is_published", true)
          .eq("is_deleted", false)
          .order("created_at", { ascending: false })

        if (fallbackError) {
          console.log("[v0] Fallback query error:", fallbackError)
          setPosts([])
          return
        }

        // Transform fallback data to match expected format
        const transformedData = (fallbackData || []).map((post: any) => ({
          ...post,
          category_name: post.community_categories?.name || "General",
          category_color: post.community_categories?.color || "#3B82F6",
          category_icon: post.community_categories?.icon || "hash",
          username: post.users?.username || "Anonymous",
          full_name: post.users?.full_name || "Anonymous User",
          avatar_url: post.users?.avatar_url,
          user_voted: false,
        }))

        setPosts(transformedData)
        return
      }

      console.log("[v0] Posts fetched successfully:", data?.length || 0)

      // Sort posts on client side
      let sortedPosts = data || []
      switch (sortBy) {
        case "popular":
          sortedPosts = sortedPosts.sort((a: any, b: any) => b.vote_count - a.vote_count)
          break
        case "trending":
          sortedPosts = sortedPosts.sort((a: any, b: any) => b.comment_count - a.comment_count)
          break
        default:
          sortedPosts = sortedPosts.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      }

      setPosts(sortedPosts)
    } catch (error) {
      console.error("Error fetching posts:", error)
      setPosts([])
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

      console.log("[v0] Starting post creation", { user: user?.id, title: newPost.title })

      // Use the database function
      const { data, error } = await supabase.rpc("create_community_post", {
        post_title: newPost.title.trim(),
        post_content: newPost.content.trim(),
        post_category_id: newPost.category_id,
        post_hashtags: extractHashtags(newPost.content),
      })

      if (error) {
        console.log("[v0] Error creating post:", error)

        // Fallback: try direct insert
        const { data: fallbackData, error: fallbackError } = await supabase
          .from("community_posts")
          .insert({
            title: newPost.title.trim(),
            content: newPost.content.trim(),
            category_id: newPost.category_id,
            hashtags: extractHashtags(newPost.content),
            user_id: user.id,
          })
          .select()

        if (fallbackError) {
          console.log("[v0] Fallback insert error:", fallbackError)
          throw fallbackError
        }

        console.log("[v0] Post created via fallback:", fallbackData)
      } else {
        console.log("[v0] Post created successfully:", data)
      }

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
        description: "Failed to create post. Please try again.",
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
      console.log("[v0] Toggling vote for post:", postId)

      // Use the database function
      const { data, error } = await supabase.rpc("toggle_post_vote", {
        post_id_param: postId,
      })

      if (error) {
        console.log("[v0] Error voting:", error)
        throw error
      }

      console.log("[v0] Vote toggled successfully:", data)
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

  return (
    <div className="min-h-screen bg-background">
      <ShoutOutDisplay position="top" />

      {/* Header */}
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
        </div>
      </div>

      <div className="container mx-auto px-4 py-4 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-4 sm:space-y-6">
            {/* Posts Feed */}
            <div className="space-y-4 pb-32">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : filteredPosts.length === 0 ? (
                <Card className="glass-card">
                  <CardContent className="p-8 sm:p-12 text-center">
                    <Users className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-base sm:text-lg font-semibold mb-2">No posts yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">Be the first to start a conversation!</p>
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
                          {/* Post Header */}
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

                          {/* Post Actions */}
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

          {/* Sidebar - Replaced trending topics with shoutout feature and mini radio */}
          <div className="space-y-4 sm:space-y-6">
            {/* Shoutout Feature */}
            <Card className="glass-card">
              <CardContent className="p-4 sm:p-6">
                <h3 className="font-semibold mb-4 text-sm sm:text-base flex items-center gap-2">
                  <Mic className="h-4 w-4" />
                  Live Shoutouts
                </h3>
                <div className="flex justify-center mb-4">
                  <AnimatedRadioCharacter
                    isPlaying={true}
                    isLive={true}
                    shoutouts={["Welcome to the community!", "Erigga fans unite!", "Paper Boi forever!"]}
                    className="w-full"
                  />
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-2">Send a shoutout to go live!</p>
                  <Link href="/radio">
                    <Button size="sm" className="w-full">
                      <Radio className="h-3 w-3 mr-2" />
                      Go to Radio
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Mini Erigga Radio */}
            <Card className="glass-card">
              <CardContent className="p-4 sm:p-6">
                <h3 className="font-semibold mb-4 text-sm sm:text-base flex items-center gap-2">
                  <Radio className="h-4 w-4" />
                  Erigga Radio
                </h3>
                <div className="text-center space-y-3">
                  <div className="relative">
                    <motion.div
                      className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                    >
                      <Radio className="h-6 w-6 text-white" />
                    </motion.div>
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Now Playing</p>
                    <p className="text-xs text-muted-foreground">Paper Boi Vibes</p>
                  </div>
                  <Link href="/radio">
                    <Button size="sm" className="w-full">
                      Listen Live
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

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
          </div>
        </div>
      </div>

      {isAuthenticated && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-t">
          <div className="container mx-auto px-4 py-4">
            <form onSubmit={handleCreatePost} className="space-y-3">
              {/* Category Selection Dropdown */}
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src={(user as any)?.avatar_url || "/placeholder.svg"} />
                  <AvatarFallback>{(user as any)?.username?.[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <Select
                  value={newPost.category_id.toString()}
                  onValueChange={(value) => {
                    setNewPost({ ...newPost, category_id: Number.parseInt(value) })
                  }}
                >
                  <SelectTrigger className="w-40 h-8 text-xs">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()} className="text-xs">
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Title Input */}
              <Input
                placeholder="What's on your mind?"
                value={newPost.title}
                onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                className="border-0 bg-muted/50 focus-visible:ring-1 text-sm"
              />

              {/* Content and Send Button */}
              <div className="flex items-end gap-2">
                <Textarea
                  placeholder="Share your thoughts with the community... Use #hashtags!"
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  className="border-0 bg-muted/50 focus-visible:ring-1 min-h-[60px] resize-none text-sm flex-1"
                  rows={2}
                />
                <Button
                  type="submit"
                  disabled={posting || !newPost.title.trim() || !newPost.content.trim()}
                  className="rounded-full h-10 w-10 p-0 flex-shrink-0"
                >
                  {posting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
