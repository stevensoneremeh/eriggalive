"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Heart, MessageCircle, Send, Smile, Paperclip, MoreVertical, Search, Filter } from "lucide-react"
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
      {/* Container */}
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                  <MessageCircle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Community Hub</h1>
                  <p className="text-slate-400">Connect, share, and engage with fellow fans</p>
                </div>
              </div>
              
              {isAuthenticated && profile && (
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <Input
                      placeholder="Search posts..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-64 bg-white/10 border-white/20 text-white text-sm placeholder-slate-400 backdrop-blur-sm"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-3 px-4 py-2 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile.avatar_url || "/placeholder-user.jpg"} />
                      <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs">
                        {profile.username?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden md:block">
                      <div className="text-sm font-medium text-white">{profile.full_name || profile.username}</div>
                      <Badge className={cn("text-xs text-white px-2 py-0.5 rounded-full", getTierColor(profile.tier || "grassroot"))}>
                        {profile.tier || "grassroot"}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Categories List */}
          <div className="lg:col-span-1">
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl sticky top-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-white">Categories</h2>
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-3">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    className={cn(
                      "w-full p-4 rounded-xl transition-all duration-300 group",
                      selectedCategory === category.id
                        ? "bg-gradient-to-r from-blue-500/20 to-purple-600/20 border border-blue-500/30 shadow-lg"
                        : "bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20"
                    )}
                    onClick={() => {
                      setSelectedCategory(category.id)
                      setSidebarOpen(false)
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-all duration-300",
                        selectedCategory === category.id
                          ? "bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg"
                          : "bg-white/10 group-hover:bg-white/20"
                      )}>
                        {category.icon}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium text-white">{category.name}</div>
                        <div className="text-sm text-slate-400">
                          {posts.filter((p) => p.category.id === category.id).length} posts
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {/* Post Creation Card */}
            {isAuthenticated && (
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl mb-6">
                <div className="flex items-start space-x-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={profile?.avatar_url || "/placeholder-user.jpg"} />
                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                      {profile?.username?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="relative">
                      <Input
                        ref={inputRef}
                        placeholder="Share your thoughts with the community..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="bg-white/10 border-white/20 text-white placeholder-slate-400 backdrop-blur-sm pr-12 py-3"
                        onKeyPress={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault()
                            sendMessage()
                          }
                        }}
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white p-1">
                          <Paperclip className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white p-1">
                          <Smile className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="text-sm text-slate-400">
                        Posting to {categories.find((c) => c.id === selectedCategory)?.name || "General"}
                      </div>
                      <Button
                        onClick={sendMessage}
                        disabled={!newMessage.trim()}
                        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-2 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Post
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Posts Feed */}
            <div className="space-y-6">
              {loading ? (
                <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-12 shadow-2xl text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-500 border-t-transparent mx-auto mb-4"></div>
                  <p className="text-slate-400">Loading posts...</p>
                </div>
              ) : filteredPosts.length === 0 ? (
                <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-12 shadow-2xl text-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-600/20 flex items-center justify-center text-3xl mx-auto mb-6">
                    💬
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">No posts yet</h3>
                  <p className="text-slate-400">Be the first to start the conversation in this category!</p>
                </div>
              ) : (
                filteredPosts.map((post) => (
                  <div key={post.id} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl shadow-2xl overflow-hidden hover:bg-white/10 transition-all duration-300 group">
                    {/* Post Card */}
                    <div className="p-6">
                      <div className="flex items-start space-x-4">
                        <Avatar className="h-12 w-12 ring-2 ring-white/20">
                          <AvatarImage src={post.user.avatar_url || "/placeholder-user.jpg"} />
                          <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                            {post.user.username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3 mb-3">
                            <span className="font-semibold text-white">
                              {post.user.full_name || post.user.username}
                            </span>
                            <Badge className={cn("text-xs text-white px-2 py-1 rounded-full", getTierColor(post.user.tier))}>
                              {post.user.tier}
                            </Badge>
                            <span className="text-sm text-slate-400">
                              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                            </span>
                          </div>
                          
                          <div className="prose prose-invert max-w-none">
                            <p className="text-slate-100 leading-relaxed mb-4">{post.content}</p>
                          </div>
                          
                          {/* Media */}
                          {post.media_url && (
                            <div className="mb-4 rounded-xl overflow-hidden bg-white/5">
                              {post.media_type?.startsWith('image/') ? (
                                <img 
                                  src={post.media_url || "/placeholder.svg"} 
                                  alt="Post media" 
                                  className="w-full h-auto max-h-96 object-cover"
                                />
                              ) : (
                                <div className="p-4 text-center text-slate-400">
                                  Media content
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Actions */}
                          <div className="flex items-center justify-between pt-4 border-t border-white/10">
                            <div className="flex items-center space-x-4">
                              <Button
                                variant="ghost"
                                size="sm"
                                className={cn(
                                  "text-slate-400 hover:text-red-400 transition-all duration-300 px-3 py-2 rounded-lg",
                                  post.has_voted && "text-red-400 bg-red-500/10"
                                )}
                                onClick={() => voteOnPost(post.id)}
                              >
                                <Heart className={cn("h-4 w-4 mr-2 transition-all duration-300", post.has_voted && "fill-current scale-110")} />
                                {post.vote_count}
                              </Button>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                className={cn(
                                  "text-slate-400 hover:text-blue-400 transition-all duration-300 px-3 py-2 rounded-lg",
                                  activePost === post.id && "text-blue-400 bg-blue-500/10"
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
                                {post.comment_count} Comments
                              </Button>
                            </div>
                            
                            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    
                    {/* Comments Section */}
                    {activePost === post.id && (
                      <div className="border-t border-white/10 bg-white/5">
                        <div className="p-6 space-y-4">
                          {comments[post.id]?.map((comment) => (
                            <div key={comment.id} className="flex items-start space-x-3 p-4 bg-white/5 rounded-xl border border-white/10">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={comment.user.avatar_url || "/placeholder-user.jpg"} />
                                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs">
                                  {comment.user.username.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <span className="font-medium text-white text-sm">{comment.user.username}</span>
                                  <Badge className={cn("text-xs text-white px-2 py-0.5 rounded-full", getTierColor(comment.user.tier))}>
                                    {comment.user.tier}
                                  </Badge>
                                  <span className="text-xs text-slate-400">
                                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                  </span>
                                </div>
                                <p className="text-sm text-slate-100 leading-relaxed">{comment.content}</p>
                              </div>
                            </div>
                          ))}
                          
                          {/* Comment Input */}
                          {isAuthenticated && (
                            <div className="flex items-start space-x-3 pt-4">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={profile?.avatar_url || "/placeholder-user.jpg"} />
                                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs">
                                  {profile?.username?.charAt(0).toUpperCase() || "U"}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 flex items-center space-x-2">
                                <Input
                                  placeholder="Write a comment..."
                                  value={newComment}
                                  onChange={(e) => setNewComment(e.target.value)}
                                  className="flex-1 bg-white/10 border-white/20 text-white text-sm placeholder-slate-400"
                                  onKeyPress={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                      e.preventDefault()
                                      sendComment(post.id)
                                    }
                                  }}
                                />
                                <Button
                                  size="sm"
                                  onClick={() => sendComment(post.id)}
                                  disabled={!newComment.trim()}
                                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg transition-all duration-300"
                                >
                                  <Send className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )\
}
