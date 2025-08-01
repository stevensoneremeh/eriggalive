"use client"

import { useState, useEffect, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Heart, MessageCircle, Share2, Users, TrendingUp, Search, Plus, Filter, Send, Phone } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"

interface Post {
  id: number
  content: string
  media_url?: string
  media_type?: string
  vote_count: number
  comment_count: number
  created_at: string
  user: {
    id: number
    username: string
    full_name: string
    tier: string
    avatar_url?: string
  }
  category: {
    id: number
    name: string
    slug: string
  }
  user_has_voted: boolean
}

interface Category {
  id: number
  name: string
  slug: string
  description?: string
  is_active: boolean
}

interface ChatMessage {
  id: number
  content: string
  user_id: number
  created_at: string
  user: {
    id: number
    username: string
    full_name: string
    avatar_url?: string
    tier: string
  }
}

const TIER_COLORS = {
  admin: "bg-red-500 text-white",
  blood_brotherhood: "bg-red-600 text-white",
  elder: "bg-purple-500 text-white",
  pioneer: "bg-blue-500 text-white",
  grassroot: "bg-green-500 text-white",
}

export default function CommunityPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [newPost, setNewPost] = useState("")
  const [newMessage, setNewMessage] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [sortOrder, setSortOrder] = useState("newest")
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState("posts")

  const { user, profile } = useAuth()
  const { toast } = useToast()
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadData()
    loadChatMessages()

    // Set up real-time subscriptions
    const postsSubscription = supabase
      .channel("community_posts_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "community_posts" }, (payload) => {
        console.log("Post change received:", payload)
        loadData()
      })
      .subscribe()

    const chatSubscription = supabase
      .channel("community_chat_changes")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "community_chat" }, (payload) => {
        console.log("Chat message received:", payload)
        loadChatMessages()
      })
      .subscribe()

    return () => {
      postsSubscription.unsubscribe()
      chatSubscription.unsubscribe()
    }
  }, [sortOrder, categoryFilter, searchQuery])

  useEffect(() => {
    scrollToBottom()
  }, [chatMessages])

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const loadData = async () => {
    try {
      setLoading(true)

      // Load categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("community_categories")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true })

      if (categoriesError) {
        console.error("Categories error:", categoriesError)
      } else {
        setCategories(categoriesData || [])
      }

      // Build posts query
      let postsQuery = supabase
        .from("community_posts")
        .select(`
        *,
        user:users!community_posts_user_id_fkey (
          id, username, full_name, tier, avatar_url
        ),
        category:community_categories!community_posts_category_id_fkey (
          id, name, slug
        )
      `)
        .eq("is_published", true)
        .eq("is_deleted", false)

      if (categoryFilter) {
        postsQuery = postsQuery.eq("category_id", categoryFilter)
      }

      if (searchQuery) {
        postsQuery = postsQuery.ilike("content", `%${searchQuery}%`)
      }

      switch (sortOrder) {
        case "oldest":
          postsQuery = postsQuery.order("created_at", { ascending: true })
          break
        case "top":
          postsQuery = postsQuery.order("vote_count", { ascending: false }).order("created_at", { ascending: false })
          break
        case "newest":
        default:
          postsQuery = postsQuery.order("created_at", { ascending: false })
          break
      }

      postsQuery = postsQuery.limit(20)

      const { data: postsData, error: postsError } = await postsQuery

      if (postsError) {
        console.error("Posts error:", postsError)
        throw postsError
      }

      if (postsData) {
        let userVotes: number[] = []
        if (profile?.id) {
          const { data: votesData, error: votesError } = await supabase
            .from("community_post_votes")
            .select("post_id")
            .eq("user_id", profile.id)

          if (!votesError && votesData) {
            userVotes = votesData.map((v) => v.post_id)
          }
        }

        const formattedPosts = postsData.map((post) => ({
          ...post,
          user_has_voted: userVotes.includes(post.id),
        }))

        setPosts(formattedPosts)
      }
    } catch (error) {
      console.error("Error loading data:", error)
      toast({
        title: "Error",
        description: "Failed to load community data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadChatMessages = async () => {
    try {
      const { data: messages, error } = await supabase
        .from("community_chat")
        .select(`
          *,
          user:users!community_chat_user_id_fkey (
            id, username, full_name, avatar_url, tier
          )
        `)
        .order("created_at", { ascending: true })
        .limit(50)

      if (error) {
        console.error("Chat messages error:", error)
      } else {
        setChatMessages(messages || [])
      }
    } catch (error) {
      console.error("Error loading chat messages:", error)
    }
  }

  const createPost = async () => {
    if (!newPost.trim() || !profile || !selectedCategory) {
      toast({
        title: "Missing Information",
        description: "Please select a category and write your post content.",
        variant: "destructive",
      })
      return
    }

    setPosting(true)
    try {
      const { data, error } = await supabase
        .from("community_posts")
        .insert({
          user_id: profile.id,
          category_id: selectedCategory,
          content: newPost.trim(),
          is_published: true,
          is_deleted: false,
        })
        .select()
        .single()

      if (error) throw error

      toast({
        title: "Success!",
        description: "Your post has been created successfully.",
      })

      setNewPost("")
      setSelectedCategory(null)
      await loadData()
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

  const sendChatMessage = async () => {
    if (!newMessage.trim() || !profile) {
      return
    }

    setSendingMessage(true)
    try {
      const { error } = await supabase.from("community_chat").insert({
        user_id: profile.id,
        content: newMessage.trim(),
      })

      if (error) throw error

      setNewMessage("")
    } catch (error) {
      console.error("Error sending message:", error)
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSendingMessage(false)
    }
  }

  const voteOnPost = async (postId: number) => {
    if (!profile?.id) {
      toast({
        title: "Authentication Required",
        description: "Please log in to vote on posts.",
        variant: "destructive",
      })
      return
    }

    try {
      const { data: existingVote, error: voteCheckError } = await supabase
        .from("community_post_votes")
        .select("id")
        .eq("post_id", postId)
        .eq("user_id", profile.id)
        .maybeSingle()

      if (voteCheckError && voteCheckError.code !== "PGRST116") {
        throw voteCheckError
      }

      if (existingVote) {
        const { error: deleteError } = await supabase
          .from("community_post_votes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", profile.id)

        if (deleteError) throw deleteError

        await supabase
          .from("community_posts")
          .update({ vote_count: supabase.raw("GREATEST(vote_count - 1, 0)") })
          .eq("id", postId)

        toast({
          title: "Vote Removed",
          description: "Your vote has been removed.",
        })
      } else {
        const { error: insertError } = await supabase.from("community_post_votes").insert({
          post_id: postId,
          user_id: profile.id,
        })

        if (insertError) throw insertError

        await supabase
          .from("community_posts")
          .update({ vote_count: supabase.raw("vote_count + 1") })
          .eq("id", postId)

        toast({
          title: "Vote Added",
          description: "Thanks for voting!",
        })
      }

      await loadData()
    } catch (error) {
      console.error("Error voting:", error)
      toast({
        title: "Error",
        description: "Failed to vote on post. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading community...</p>
            </div>
          </div>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-6xl mx-auto p-4">
          {/* Header */}
          <div className="text-center py-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Erigga Community
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Connect, share, and engage with fellow fans</p>
          </div>

          {/* Main Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="posts" className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Posts & Discussions
              </TabsTrigger>
              <TabsTrigger value="chat" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Live Chat
              </TabsTrigger>
            </TabsList>

            <TabsContent value="posts" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Sidebar */}
                <div className="lg:col-span-1">
                  {/* User Info */}
                  {profile && (
                    <Card className="mb-6 border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={profile.avatar_url || "/placeholder-user.jpg"} />
                            <AvatarFallback>{profile.full_name?.[0] || profile.username?.[0] || "U"}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold">{profile.full_name}</p>
                            <p className="text-sm text-gray-500">@{profile.username}</p>
                            <Badge
                              className={`text-xs ${TIER_COLORS[profile.tier as keyof typeof TIER_COLORS] || "bg-gray-500 text-white"}`}
                            >
                              {profile.tier}
                            </Badge>
                          </div>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-4 text-center">
                          <div>
                            <p className="text-2xl font-bold text-purple-600">{profile.coins || 0}</p>
                            <p className="text-xs text-gray-500">Coins</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-blue-600">{profile.level || 1}</p>
                            <p className="text-xs text-gray-500">Level</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Community Stats */}
                  <Card className="mb-6 border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center text-lg">
                        <TrendingUp className="w-5 h-5 mr-2" />
                        Community Stats
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <Users className="h-4 w-4 text-blue-600 mx-auto mb-1" />
                            <div className="text-2xl font-bold text-blue-600">12,450</div>
                            <div className="text-xs text-blue-600">Members</div>
                          </div>
                          <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <MessageCircle className="h-4 w-4 text-green-600 mx-auto mb-1" />
                            <div className="text-2xl font-bold text-green-600">{posts.length}</div>
                            <div className="text-xs text-green-600">Posts</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Categories */}
                  <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="text-lg">Categories</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="space-y-2">
                        <div
                          className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                            categoryFilter === null
                              ? "bg-blue-100 dark:bg-blue-900/50"
                              : "hover:bg-gray-100 dark:hover:bg-gray-700"
                          }`}
                          onClick={() => setCategoryFilter(null)}
                        >
                          <span className="text-sm font-medium">All Categories</span>
                        </div>
                        {categories.map((category) => (
                          <div
                            key={category.id}
                            className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                              categoryFilter === category.id
                                ? "bg-blue-100 dark:bg-blue-900/50"
                                : "hover:bg-gray-100 dark:hover:bg-gray-700"
                            }`}
                            onClick={() => setCategoryFilter(category.id)}
                          >
                            <span className="text-sm font-medium">{category.name}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Main Content */}
                <div className="lg:col-span-3">
                  {/* Search and Filter Controls */}
                  <Card className="mb-6 border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                        <div className="flex items-center space-x-2 flex-1">
                          <Search className="h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="Search posts..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="border-0 bg-gray-50 dark:bg-gray-700"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Filter className="h-4 w-4 text-gray-400" />
                          <Select value={sortOrder} onValueChange={setSortOrder}>
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="newest">Newest</SelectItem>
                              <SelectItem value="oldest">Oldest</SelectItem>
                              <SelectItem value="top">Top Voted</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Create Post */}
                  {profile && (
                    <Card className="mb-6 border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                      <CardHeader>
                        <CardTitle className="flex items-center text-lg">
                          <Plus className="w-5 h-5 mr-2" />
                          Share your thoughts
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Textarea
                          placeholder="What's on your mind?"
                          value={newPost}
                          onChange={(e) => setNewPost(e.target.value)}
                          className="mb-4 border-0 bg-gray-50 dark:bg-gray-700"
                          rows={3}
                        />
                        <div className="flex items-center justify-between">
                          <Select
                            value={selectedCategory?.toString() || ""}
                            onValueChange={(value) => setSelectedCategory(Number(value))}
                          >
                            <SelectTrigger className="w-48">
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
                          <Button
                            onClick={createPost}
                            disabled={!newPost.trim() || posting || !selectedCategory}
                            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                          >
                            {posting ? "Posting..." : "Post"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Posts Feed */}
                  <div className="space-y-6">
                    {posts.map((post) => (
                      <Card
                        key={post.id}
                        className="border-0 shadow-sm bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm hover:shadow-md transition-all duration-200 rounded-xl"
                      >
                        <CardContent className="p-4">
                          {/* Post Header */}
                          <div className="flex items-center space-x-3 mb-3">
                            <Avatar className="h-10 w-10 ring-2 ring-primary/10">
                              <AvatarImage src={post.user?.avatar_url || "/placeholder-user.jpg"} />
                              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                                {post.user?.full_name?.[0] || post.user?.username?.[0] || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                                  {post.user?.full_name || post.user?.username}
                                </p>
                                <Badge
                                  className={`text-xs px-2 py-1 ${TIER_COLORS[post.user?.tier as keyof typeof TIER_COLORS] || "bg-gray-500 text-white"}`}
                                >
                                  {post.user?.tier}
                                </Badge>
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                              </p>
                            </div>
                          </div>

                          {/* Category Badge */}
                          {post.category && (
                            <div className="mb-3">
                              <Badge
                                variant="outline"
                                className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300"
                              >
                                {post.category.name}
                              </Badge>
                            </div>
                          )}

                          {/* Post Content */}
                          <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl border-l-4 border-blue-400">
                            <p className="text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap text-sm">
                              {post.content}
                            </p>
                          </div>

                          {/* Media */}
                          {post.media_url && (
                            <div className="mb-4 rounded-lg overflow-hidden">
                              {post.media_type === "image" && (
                                <img
                                  src={post.media_url || "/placeholder.svg"}
                                  alt="Post media"
                                  className="w-full h-auto max-h-96 object-cover"
                                />
                              )}
                              {post.media_type === "video" && (
                                <video src={post.media_url} controls className="w-full h-auto max-h-96" />
                              )}
                              {post.media_type === "audio" && (
                                <div className="p-4 bg-muted rounded-lg">
                                  <audio src={post.media_url} controls className="w-full" />
                                </div>
                              )}
                            </div>
                          )}

                          {/* Post Actions */}
                          <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                            <div className="flex items-center space-x-4">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => voteOnPost(post.id)}
                                className={`flex items-center space-x-1 text-xs px-3 py-2 rounded-full transition-all ${
                                  post.user_has_voted
                                    ? "text-red-500 bg-red-50 hover:bg-red-100 dark:bg-red-900/20"
                                    : "text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                }`}
                                disabled={!profile}
                              >
                                <Heart className={`h-4 w-4 ${post.user_has_voted ? "fill-current" : ""}`} />
                                <span className="font-medium">{post.vote_count || 0}</span>
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                className="flex items-center space-x-1 text-xs px-3 py-2 rounded-full text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                              >
                                <MessageCircle className="h-4 w-4" />
                                <span className="font-medium">{post.comment_count || 0}</span>
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                className="flex items-center space-x-1 text-xs px-3 py-2 rounded-full text-gray-500 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all"
                              >
                                <Share2 className="h-4 w-4" />
                                <span className="font-medium">Share</span>
                              </Button>
                            </div>

                            <div className="text-xs text-gray-400 dark:text-gray-500 flex items-center">
                              <span>
                                {new Date(post.created_at).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {posts.length === 0 && (
                      <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                        <CardContent className="p-12 text-center">
                          <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">No posts yet</h3>
                          <p className="text-gray-500 dark:text-gray-400">
                            Be the first to share something with the community!
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="chat" className="space-y-6">
              {/* WhatsApp-style Live Chat */}
              <Card className="border-0 shadow-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Phone className="w-5 h-5 mr-2" />
                      Community Live Chat
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm text-green-600 font-medium">Live</span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {/* Chat Messages */}
                  <div className="h-96 overflow-y-auto px-4 space-y-3 bg-gradient-to-b from-blue-50/30 to-purple-50/30 dark:from-blue-900/10 dark:to-purple-900/10">
                    {chatMessages.map((message) => (
                      <div key={message.id} className="flex items-start space-x-2">
                        <Avatar className="h-8 w-8 mt-1">
                          <AvatarImage src={message.user?.avatar_url || "/placeholder-user.jpg"} />
                          <AvatarFallback className="text-xs">{message.user?.username?.[0] || "U"}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-semibold text-sm">
                              {message.user?.full_name || message.user?.username}
                            </span>
                            <Badge
                              className={`text-xs ${TIER_COLORS[message.user?.tier as keyof typeof TIER_COLORS] || "bg-gray-500 text-white"}`}
                            >
                              {message.user?.tier}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                            </span>
                          </div>
                          <div className="bg-white dark:bg-gray-700 rounded-lg p-3 shadow-sm max-w-md">
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Chat Input */}
                  {profile ? (
                    <div className="p-4 border-t bg-white dark:bg-gray-800">
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={profile.avatar_url || "/placeholder-user.jpg"} />
                          <AvatarFallback className="text-xs">{profile.username?.[0] || "U"}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 flex items-center space-x-2">
                          <Input
                            placeholder="Type a message..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={(e) =>
                              e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendChatMessage())
                            }
                            className="border-0 bg-gray-50 dark:bg-gray-700 rounded-full"
                            disabled={sendingMessage}
                          />
                          <Button
                            size="icon"
                            onClick={sendChatMessage}
                            disabled={!newMessage.trim() || sendingMessage}
                            className="rounded-full bg-blue-500 hover:bg-blue-600"
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 border-t bg-gray-50 dark:bg-gray-800 text-center">
                      <p className="text-gray-500">Please log in to join the chat</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AuthGuard>
  )
}
