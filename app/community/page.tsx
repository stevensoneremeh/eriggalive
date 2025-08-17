"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Heart, MessageCircle, Send, Smile, Paperclip, MoreVertical, Search, Menu, X } from "lucide-react"
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
    <div className="h-screen bg-[#0a0a0a] flex overflow-hidden">
      {/* Sidebar */}
      <div
        className={cn(
          "w-80 bg-[#1f2937] border-r border-gray-700 flex flex-col transition-transform duration-300",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        {/* Sidebar Header */}
        <div className="p-4 bg-[#25D366] text-white">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold">Community</h1>
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden text-white hover:bg-white/20"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <p className="text-sm text-green-100 mt-1">Connect with fans worldwide</p>
        </div>

        {/* Search */}
        <div className="p-3 bg-[#2f3349]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[#3c4043] border-gray-600 text-white placeholder-gray-400"
            />
          </div>
        </div>

        {/* Categories List */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant="ghost"
                className={cn(
                  "w-full justify-start p-3 mb-1 text-left hover:bg-[#3c4043]",
                  selectedCategory === category.id ? "bg-[#25D366] text-white hover:bg-[#25D366]" : "text-gray-300",
                )}
                onClick={() => {
                  setSelectedCategory(category.id)
                  setSidebarOpen(false)
                }}
              >
                <div className="flex items-center space-x-3 w-full">
                  <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center text-xl">
                    {category.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{category.name}</div>
                    <div className="text-sm opacity-70 truncate">
                      {posts.filter((p) => p.category.id === category.id).length} messages
                    </div>
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </ScrollArea>

        {/* User Profile */}
        {isAuthenticated && profile && (
          <div className="p-4 bg-[#2f3349] border-t border-gray-700">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={profile.avatar_url || "/placeholder-user.jpg"} />
                <AvatarFallback className="bg-[#25D366] text-white">
                  {profile.username?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-white truncate">{profile.full_name || profile.username}</div>
                <Badge className={cn("text-xs text-white", getTierColor(profile.tier || "grassroot"))}>
                  {profile.tier || "grassroot"}
                </Badge>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-[#0f172a]">
        {/* Chat Header */}
        <div className="p-4 bg-[#1f2937] border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" className="md:hidden text-white" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center text-white text-lg">
              {categories.find((c) => c.id === selectedCategory)?.icon || "💬"}
            </div>
            <div>
              <h2 className="font-semibold text-white">
                {categories.find((c) => c.id === selectedCategory)?.name || "General"}
              </h2>
              <p className="text-sm text-gray-400">
                {filteredPosts.length} messages • {categories.length} members online
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="text-gray-400">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#25D366] mx-auto mb-4"></div>
                <p className="text-gray-400">Loading messages...</p>
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center text-2xl mx-auto mb-4">
                  💬
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">No messages yet</h3>
                <p className="text-gray-400">Be the first to start the conversation!</p>
              </div>
            ) : (
              filteredPosts.map((post) => (
                <div key={post.id} className="group">
                  {/* Message Bubble */}
                  <div
                    className={cn(
                      "flex items-start space-x-3 p-4 rounded-lg transition-colors",
                      post.user.id === profile?.id ? "bg-[#25D366] ml-12" : "bg-[#1f2937] mr-12",
                    )}
                  >
                    {post.user.id !== profile?.id && (
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage src={post.user.avatar_url || "/placeholder-user.jpg"} />
                        <AvatarFallback className="bg-gray-600 text-white text-sm">
                          {post.user.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    )}

                    <div className="flex-1 min-w-0">
                      {post.user.id !== profile?.id && (
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-white text-sm">
                            {post.user.full_name || post.user.username}
                          </span>
                          <Badge className={cn("text-xs text-white", getTierColor(post.user.tier))}>
                            {post.user.tier}
                          </Badge>
                        </div>
                      )}

                      <p
                        className={cn(
                          "text-sm leading-relaxed break-words",
                          post.user.id === profile?.id ? "text-white" : "text-gray-100",
                        )}
                      >
                        {post.content}
                      </p>

                      <div className="flex items-center justify-between mt-2">
                        <span
                          className={cn("text-xs", post.user.id === profile?.id ? "text-green-100" : "text-gray-400")}
                        >
                          {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                        </span>

                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                              "h-6 px-2 text-xs",
                              post.has_voted ? "text-red-400 hover:text-red-300" : "text-gray-400 hover:text-red-400",
                            )}
                            onClick={() => voteOnPost(post.id)}
                          >
                            <Heart className={cn("h-3 w-3 mr-1", post.has_voted && "fill-current")} />
                            {post.vote_count}
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs text-gray-400 hover:text-blue-400"
                            onClick={() => {
                              if (activePost === post.id) {
                                setActivePost(null)
                              } else {
                                setActivePost(post.id)
                                loadComments(post.id)
                              }
                            }}
                          >
                            <MessageCircle className="h-3 w-3 mr-1" />
                            {post.comment_count}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Comments Section */}
                  {activePost === post.id && (
                    <div className="ml-8 mt-2 space-y-2">
                      {comments[post.id]?.map((comment) => (
                        <div key={comment.id} className="flex items-start space-x-2 p-2 bg-[#2d3748] rounded-lg">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={comment.user.avatar_url || "/placeholder-user.jpg"} />
                            <AvatarFallback className="bg-gray-600 text-white text-xs">
                              {comment.user.username.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-medium text-white text-xs">{comment.user.username}</span>
                              <span className="text-xs text-gray-400">
                                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                              </span>
                            </div>
                            <p className="text-sm text-gray-100">{comment.content}</p>
                          </div>
                        </div>
                      ))}

                      {/* Comment Input */}
                      {isAuthenticated && (
                        <div className="flex items-center space-x-2 p-2">
                          <Input
                            placeholder="Add a comment..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            className="flex-1 bg-[#2d3748] border-gray-600 text-white text-sm"
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
                            className="bg-[#25D366] hover:bg-[#20b358] text-white"
                          >
                            <Send className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="p-4 bg-[#1f2937] border-t border-gray-700">
          {isAuthenticated ? (
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                <Paperclip className="h-5 w-5" />
              </Button>
              <div className="flex-1 relative">
                <Input
                  ref={inputRef}
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="bg-[#2d3748] border-gray-600 text-white pr-12"
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
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <Smile className="h-4 w-4" />
                </Button>
              </div>
              <Button
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                className="bg-[#25D366] hover:bg-[#20b358] text-white"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-400 mb-3">Sign in to join the conversation</p>
              <Button asChild className="bg-[#25D366] hover:bg-[#20b358] text-white">
                <a href="/login">Sign In</a>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  )
}
