"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Heart, MessageCircle, Send, Smile, Paperclip, MoreVertical, Search, Menu, X, Filter, Zap } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"

interface Category {
  id: number
  name: string
  slug: string
  icon: string
  color: string
  is_active: boolean
}

interface Post {
  id: number
  content: string
  created_at: string
  vote_count: number
  comment_count: number
  media_url?: string
  media_type?: string
  user: {
    id: string
    username: string
    full_name: string
    avatar_url?: string
    tier: string
  }
  category: {
    id: number
    name: string
    slug: string
  }
  has_voted: boolean
}

interface Comment {
  id: number
  content: string
  created_at: string
  like_count: number
  user: {
    id: string
    username: string
    full_name: string
    avatar_url?: string
    tier: string
  }
  has_liked: boolean
}

export default function CommunityPage() {
  const { isAuthenticated, profile } = useAuth()
  const supabase = createClient()

  // State
  const [categories, setCategories] = useState<Category[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [comments, setComments] = useState<{ [postId: number]: Comment[] }>({})
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [newComment, setNewComment] = useState("")
  const [activePost, setActivePost] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Load categories
  const loadCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("community_categories")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true })

      if (error) throw error

      setCategories(data || [])
      if (data && data.length > 0 && !selectedCategory) {
        setSelectedCategory(data[0].id)
      }
    } catch (error) {
      console.error("Error loading categories:", error)
      // Fallback categories
      const fallbackCategories = [
        { id: 1, name: "General", slug: "general", icon: "💬", color: "#25D366", is_active: true },
        { id: 2, name: "Music", slug: "music", icon: "🎵", color: "#128C7E", is_active: true },
        { id: 3, name: "Events", slug: "events", icon: "📅", color: "#075E54", is_active: true },
      ]
      setCategories(fallbackCategories)
      setSelectedCategory(1)
    }
  }, [selectedCategory, supabase])

  // Load posts
  const loadPosts = useCallback(async () => {
    if (!selectedCategory) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("community_posts")
        .select(`
          *,
          user:users!community_posts_user_id_fkey(id, username, full_name, avatar_url, tier),
          category:community_categories!community_posts_category_id_fkey(id, name, slug)
        `)
        .eq("category_id", selectedCategory)
        .eq("is_published", true)
        .eq("is_deleted", false)
        .order("created_at", { ascending: true })
        .limit(50)

      if (error) throw error

      const transformedPosts = (data || []).map((post) => ({
        id: post.id,
        content: post.content,
        created_at: post.created_at,
        vote_count: post.vote_count || 0,
        comment_count: post.comment_count || 0,
        media_url: post.media_url,
        media_type: post.media_type,
        user: post.user || {
          id: "unknown",
          username: "Unknown User",
          full_name: "Unknown User",
          avatar_url: null,
          tier: "grassroot",
        },
        category: post.category || {
          id: selectedCategory,
          name: "General",
          slug: "general",
        },
        has_voted: false, // TODO: Check actual vote status
      }))

      setPosts(transformedPosts)
      setTimeout(scrollToBottom, 100)
    } catch (error) {
      console.error("Error loading posts:", error)
      // Show sample posts on error
      const samplePosts = [
        {
          id: 1,
          content:
            "Welcome to the Erigga community! 🎵 This is where real music lovers connect and share their passion.",
          created_at: new Date().toISOString(),
          vote_count: 12,
          comment_count: 3,
          user: {
            id: "sample-1",
            username: "eriggaofficial",
            full_name: "Erigga Official",
            avatar_url: "/placeholder-user.jpg",
            tier: "blood",
          },
          category: {
            id: selectedCategory,
            name: "General",
            slug: "general",
          },
          has_voted: false,
        },
      ]
      setPosts(samplePosts)
    } finally {
      setLoading(false)
    }
  }, [selectedCategory, supabase])

  // Load comments for a post
  const loadComments = useCallback(
    async (postId: number) => {
      try {
        const { data, error } = await supabase
          .from("community_comments")
          .select(`
          *,
          user:users!community_comments_user_id_fkey(id, username, full_name, avatar_url, tier)
        `)
          .eq("post_id", postId)
          .eq("is_deleted", false)
          .order("created_at", { ascending: true })

        if (error) throw error

        const transformedComments = (data || []).map((comment) => ({
          id: comment.id,
          content: comment.content,
          created_at: comment.created_at,
          like_count: comment.like_count || 0,
          user: comment.user || {
            id: "unknown",
            username: "Unknown User",
            full_name: "Unknown User",
            avatar_url: null,
            tier: "grassroot",
          },
          has_liked: false, // TODO: Check actual like status
        }))

        setComments((prev) => ({ ...prev, [postId]: transformedComments }))
      } catch (error) {
        console.error("Error loading comments:", error)
      }
    },
    [supabase],
  )

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || !isAuthenticated || !profile || !selectedCategory) {
      if (!isAuthenticated) {
        toast.error("Please sign in to post messages")
      }
      return
    }

    try {
      const { data, error } = await supabase
        .from("community_posts")
        .insert({
          content: newMessage.trim(),
          user_id: profile.id,
          category_id: selectedCategory,
          is_published: true,
          is_deleted: false,
        })
        .select(`
          *,
          user:users!community_posts_user_id_fkey(id, username, full_name, avatar_url, tier),
          category:community_categories!community_posts_category_id_fkey(id, name, slug)
        `)
        .single()

      if (error) throw error

      const newPost = {
        id: data.id,
        content: data.content,
        created_at: data.created_at,
        vote_count: 0,
        comment_count: 0,
        user: data.user,
        category: data.category,
        has_voted: false,
      }

      setPosts((prev) => [...prev, newPost])
      setNewMessage("")
      setTimeout(scrollToBottom, 100)
      toast.success("Message sent!")
    } catch (error) {
      console.error("Error sending message:", error)
      toast.error("Failed to send message")
    }
  }

  // Send comment
  const sendComment = async (postId: number) => {
    if (!newComment.trim() || !isAuthenticated || !profile) {
      if (!isAuthenticated) {
        toast.error("Please sign in to comment")
      }
      return
    }

    try {
      const { data, error } = await supabase
        .from("community_comments")
        .insert({
          content: newComment.trim(),
          user_id: profile.id,
          post_id: postId,
          is_deleted: false,
        })
        .select(`
          *,
          user:users!community_comments_user_id_fkey(id, username, full_name, avatar_url, tier)
        `)
        .single()

      if (error) throw error

      const newCommentObj = {
        id: data.id,
        content: data.content,
        created_at: data.created_at,
        like_count: 0,
        user: data.user,
        has_liked: false,
      }

      setComments((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), newCommentObj],
      }))

      // Update comment count
      setPosts((prev) =>
        prev.map((post) => (post.id === postId ? { ...post, comment_count: post.comment_count + 1 } : post)),
      )

      setNewComment("")
      toast.success("Comment added!")
    } catch (error) {
      console.error("Error sending comment:", error)
      toast.error("Failed to send comment")
    }
  }

  // Vote on post
  const voteOnPost = async (postId: number) => {
    if (!isAuthenticated || !profile) {
      toast.error("Please sign in to vote")
      return
    }

    try {
      const post = posts.find((p) => p.id === postId)
      if (!post) return

      if (post.has_voted) {
        // Remove vote
        await supabase.from("community_post_votes").delete().eq("post_id", postId).eq("user_id", profile.id)
      } else {
        // Add vote
        await supabase.from("community_post_votes").insert({
          post_id: postId,
          user_id: profile.id,
        })
      }

      // Update local state optimistically
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                has_voted: !p.has_voted,
                vote_count: p.has_voted ? p.vote_count - 1 : p.vote_count + 1,
              }
            : p,
        ),
      )

      toast.success(post.has_voted ? "Vote removed" : "Vote added!")
    } catch (error) {
      console.error("Error voting:", error)
      toast.error("Failed to vote")
    }
  }

  // Get tier color
  const getTierColor = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case "blood":
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

  // Filter posts by search
  const filteredPosts = posts.filter(
    (post) =>
      searchQuery === "" ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.user.username.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Effects
  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  useEffect(() => {
    if (selectedCategory) {
      loadPosts()
    }
  }, [selectedCategory, loadPosts])

  useEffect(() => {
    scrollToBottom()
  }, [posts])

  // Real-time subscriptions
  useEffect(() => {
    if (!selectedCategory) return

    const postsSubscription = supabase
      .channel(`posts-${selectedCategory}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "community_posts",
          filter: `category_id=eq.${selectedCategory}`,
        },
        (payload) => {
          // Reload posts when new ones are added
          loadPosts()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(postsSubscription)
    }
  }, [selectedCategory, supabase, loadPosts])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;utf8,%3Csvg%20width=%2260%22%20height=%2260%22%20viewBox=%220%200%2060%2060%22%20xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg%20fill=%22none%22%20fillRule=%22evenodd%22%3E%3Cg%20fill=%22%23ffffff%22%20fillOpacity=%220.02%22%3E%3Ccircle%20cx=%2230%22%20cy=%2230%22%20r=%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
      <div className="relative flex h-screen overflow-hidden">
        {/* Sidebar */}
        <div
          className={cn(
            "w-80 backdrop-blur-xl bg-white/5 border-r border-white/10 flex flex-col transition-all duration-500 ease-out shadow-2xl",
            sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          )}
        >
          <div className="p-6 backdrop-blur-xl bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center shadow-lg">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Community Hub</h1>
                  <p className="text-sm text-white/70">Connect & Share</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden text-white hover:bg-white/10 rounded-xl"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/50 h-4 w-4" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 bg-white/5 backdrop-blur-sm border-white/10 text-white placeholder-white/50 rounded-xl h-12 text-lg focus:bg-white/10 transition-all duration-300"
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg"
              >
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1 px-4">
            <div className="space-y-2">
              {categories.map((category, index) => (
                <div
                  key={category.id}
                  className={cn(
                    "group relative overflow-hidden rounded-2xl transition-all duration-300 hover:scale-[1.02] cursor-pointer",
                    selectedCategory === category.id
                      ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-blue-400/30 shadow-lg shadow-blue-500/10"
                      : "bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:border-white/20",
                  )}
                  onClick={() => {
                    setSelectedCategory(category.id)
                    setSidebarOpen(false)
                  }}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="p-4">
                    <div className="flex items-center space-x-4">
                      <div
                        className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-lg transition-all duration-300",
                          selectedCategory === category.id
                            ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                            : "bg-white/10 text-white/80 group-hover:bg-white/20",
                        )}
                      >
                        {category.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-white truncate text-lg">{category.name}</div>
                        <div className="text-sm text-white/60 truncate">
                          {posts.filter((p) => p.category.id === category.id).length} messages
                        </div>
                      </div>
                      {selectedCategory === category.id && (
                        <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
                      )}
                    </div>
                  </div>
                  {selectedCategory === category.id && (
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl"></div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>

          {isAuthenticated && profile && (
            <div className="p-4 backdrop-blur-xl bg-white/5 border-t border-white/10">
              <div className="flex items-center space-x-4 p-3 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
                <Avatar className="h-12 w-12 ring-2 ring-white/20">
                  <AvatarImage src={profile.avatar_url || "/placeholder-user.jpg"} />
                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold">
                    {profile.username?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white truncate">{profile.full_name || profile.username}</div>
                  <Badge
                    className={cn(
                      "text-xs text-white font-medium px-3 py-1 rounded-full",
                      getTierColor(profile.tier || "grassroot"),
                    )}
                  >
                    {profile.tier || "grassroot"}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col backdrop-blur-xl bg-white/5">
          <div className="p-6 backdrop-blur-xl bg-gradient-to-r from-white/10 to-white/5 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="md:hidden text-white hover:bg-white/10 rounded-xl"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                </Button>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-2xl shadow-lg">
                  {categories.find((c) => c.id === selectedCategory)?.icon || "💬"}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {categories.find((c) => c.id === selectedCategory)?.name || "General"}
                  </h2>
                  <p className="text-white/60">
                    {filteredPosts.length} posts • {categories.length} active members
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white/70 hover:text-white hover:bg-white/10 rounded-xl"
                >
                  <Search className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white/70 hover:text-white hover:bg-white/10 rounded-xl"
                >
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>

          <ScrollArea className="flex-1 p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              {loading ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center mx-auto mb-6 animate-pulse">
                    <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  </div>
                  <p className="text-white/70 text-lg">Loading conversations...</p>
                </div>
              ) : filteredPosts.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-24 h-24 rounded-3xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm flex items-center justify-center text-4xl mx-auto mb-6 border border-white/10">
                    💬
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">Start the Conversation</h3>
                  <p className="text-white/60 text-lg">Be the first to share your thoughts with the community!</p>
                </div>
              ) : (
                filteredPosts.map((post, index) => (
                  <div
                    key={post.id}
                    className="group animate-fade-in-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 p-6 shadow-2xl hover:shadow-3xl hover:bg-white/10 transition-all duration-500 hover:scale-[1.01]">
                      <div className="flex items-start space-x-4">
                        <Avatar className="h-12 w-12 ring-2 ring-white/20 shadow-lg">
                          <AvatarImage src={post.user.avatar_url || "/placeholder-user.jpg"} />
                          <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold">
                            {post.user.username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3 mb-3">
                            <span className="font-bold text-white text-lg">
                              {post.user.full_name || post.user.username}
                            </span>
                            <Badge
                              className={cn(
                                "text-xs text-white font-medium px-3 py-1 rounded-full shadow-lg",
                                getTierColor(post.user.tier),
                              )}
                            >
                              {post.user.tier}
                            </Badge>
                            <span className="text-white/50 text-sm">
                              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                            </span>
                          </div>

                          <p className="text-white/90 text-lg leading-relaxed mb-4 break-words">{post.content}</p>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <Button
                                variant="ghost"
                                size="sm"
                                className={cn(
                                  "rounded-xl px-4 py-2 transition-all duration-300 hover:scale-105",
                                  post.has_voted
                                    ? "text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20"
                                    : "text-white/70 hover:text-red-400 hover:bg-red-500/10",
                                )}
                                onClick={() => voteOnPost(post.id)}
                              >
                                <Heart
                                  className={cn(
                                    "h-4 w-4 mr-2 transition-all duration-300",
                                    post.has_voted && "fill-current scale-110",
                                  )}
                                />
                                {post.vote_count}
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                className={cn(
                                  "rounded-xl px-4 py-2 transition-all duration-300 hover:scale-105",
                                  activePost === post.id
                                    ? "text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20"
                                    : "text-white/70 hover:text-blue-400 hover:bg-blue-500/10",
                                )}
                                onClick={() => {
                                  if (activePost === post.id) {
                                    setActivePost(null)
                                  } else {
                                    setActivePost(post.id)
                                    loadComments(post.id)
                                  }
                                }}
                              >
                                <MessageCircle className="h-4 w-4 mr-2" />
                                {post.comment_count}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {activePost === post.id && (
                        <div className="mt-6 space-y-4 animate-fade-in">
                          {comments[post.id]?.map((comment, commentIndex) => (
                            <div
                              key={comment.id}
                              className="ml-8 backdrop-blur-sm bg-white/5 rounded-2xl border border-white/10 p-4 animate-slide-in-right"
                              style={{ animationDelay: `${commentIndex * 100}ms` }}
                            >
                              <div className="flex items-start space-x-3">
                                <Avatar className="h-8 w-8 ring-1 ring-white/20">
                                  <AvatarImage src={comment.user.avatar_url || "/placeholder-user.jpg"} />
                                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-semibold">
                                    {comment.user.username.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <span className="font-semibold text-white text-sm">{comment.user.username}</span>
                                    <span className="text-xs text-white/50">
                                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                    </span>
                                  </div>
                                  <p className="text-white/80 text-sm leading-relaxed">{comment.content}</p>
                                </div>
                              </div>
                            </div>
                          ))}

                          {isAuthenticated && (
                            <div className="ml-8 flex items-center space-x-3 p-4 backdrop-blur-sm bg-white/5 rounded-2xl border border-white/10">
                              <Avatar className="h-8 w-8 ring-1 ring-white/20">
                                <AvatarImage src={profile?.avatar_url || "/placeholder-user.jpg"} />
                                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-semibold">
                                  {profile?.username?.charAt(0).toUpperCase() || "U"}
                                </AvatarFallback>
                              </Avatar>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-white/70 hover:text-white hover:bg-white/10 rounded-xl"
                              >
                                <Paperclip className="h-5 w-5" />
                              </Button>
                              <div className="flex-1 relative">
                                <Input
                                  ref={inputRef}
                                  placeholder="Write a comment..."
                                  value={newComment}
                                  onChange={(e) => setNewComment(e.target.value)}
                                  className="bg-white/5 border-white/10 text-white pr-12 rounded-2xl h-12 text-lg focus:bg-white/10 transition-all duration-300"
                                  onKeyPress={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                      e.preventDefault()
                                      sendComment(post.id)
                                    }
                                  }}
                                />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white hover:bg-white/10 rounded-xl"
                                >
                                  <Smile className="h-5 w-5" />
                                </Button>
                              </div>
                              <Button
                                onClick={() => sendComment(post.id)}
                                disabled={!newComment.trim()}
                                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-2xl px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Send className="h-5 w-5" />
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <div className="p-6 backdrop-blur-xl bg-gradient-to-r from-white/10 to-white/5 border-t border-white/10">
            {isAuthenticated ? (
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center space-x-4 p-4 backdrop-blur-xl bg-white/10 rounded-3xl border border-white/20 shadow-2xl">
                  <Avatar className="h-10 w-10 ring-2 ring-white/20">
                    <AvatarImage src={profile?.avatar_url || "/placeholder-user.jpg"} />
                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold">
                      {profile?.username?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white/70 hover:text-white hover:bg-white/10 rounded-xl"
                  >
                    <Paperclip className="h-5 w-5" />
                  </Button>
                  <div className="flex-1 relative">
                    <Input
                      ref={inputRef}
                      placeholder="Share your thoughts..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="bg-white/5 border-white/10 text-white pr-12 rounded-2xl h-12 text-lg focus:bg-white/10 transition-all duration-300"
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault()
                          sendMessage()
                        }
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white hover:bg-white/10 rounded-xl"
                    >
                      <Smile className="h-5 w-5" />
                    </Button>
                  </div>
                  <Button
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-2xl px-8 py-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto text-center py-8">
                <div className="backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 p-8">
                  <p className="text-white/70 mb-4 text-lg">Join the conversation</p>
                  <Button
                    asChild
                    className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-2xl px-8 py-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  >
                    <a href="/login">Sign In</a>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </div>
    </div>
  )
}
