"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Heart, MessageCircle, Smile, Paperclip, MoreVertical, Search, Menu, X, Zap, Send } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"
import { UserTierBadge } from "@/components/user-tier-badge"
import { motion, AnimatePresence } from "framer-motion"

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
  const [unifiedInput, setUnifiedInput] = useState("")
  const [activePost, setActivePost] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Add community-specific styling to body when on community page
    document.body.classList.add("community-page")

    // Communicate to main navigation that we're on community page
    const communityNavEvent = new CustomEvent("communityPageActive", {
      detail: { categories, selectedCategory },
    })
    window.dispatchEvent(communityNavEvent)

    return () => {
      document.body.classList.remove("community-page")
      const communityNavEvent = new CustomEvent("communityPageInactive")
      window.dispatchEvent(communityNavEvent)
    }
  }, [categories, selectedCategory])

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
          tier: "FREE",
        },
        category: post.category || {
          id: selectedCategory,
          name: "General",
          slug: "general",
        },
        has_voted: false,
      }))

      setPosts(transformedPosts)
      setTimeout(scrollToBottom, 100)
    } catch (error) {
      console.error("Error loading posts:", error)
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
            tier: "FREE",
          },
          has_liked: false,
        }))

        setComments((prev) => ({ ...prev, [postId]: transformedComments }))
      } catch (error) {
        console.error("Error loading comments:", error)
      }
    },
    [supabase],
  )

  const handleUnifiedSubmit = async () => {
    if (!unifiedInput.trim() || !isAuthenticated || !profile) {
      if (!isAuthenticated) {
        toast.error("Please sign in to participate")
      }
      return
    }

    try {
      if (activePost) {
        // Comment mode - add comment to active post
        const { data, error } = await supabase
          .from("community_comments")
          .insert({
            content: unifiedInput.trim(),
            user_id: profile.id,
            post_id: activePost,
            is_deleted: false,
          })
          .select(`
            *,
            user:users!community_comments_user_id_fkey(id, username, full_name, avatar_url, tier)
          `)
          .single()

        if (error) throw error

        const newComment = {
          id: data.id,
          content: data.content,
          created_at: data.created_at,
          like_count: 0,
          user: data.user,
          has_liked: false,
        }

        setComments((prev) => ({
          ...prev,
          [activePost]: [...(prev[activePost] || []), newComment],
        }))

        setPosts((prev) =>
          prev.map((post) => (post.id === activePost ? { ...post, comment_count: post.comment_count + 1 } : post)),
        )

        toast.success("Comment added!")
      } else {
        // Post mode - create new post
        if (!selectedCategory) return

        const { data, error } = await supabase
          .from("community_posts")
          .insert({
            content: unifiedInput.trim(),
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
        setTimeout(scrollToBottom, 100)
        toast.success("Message sent!")
      }

      setUnifiedInput("")
    } catch (error) {
      console.error("Error submitting:", error)
      toast.error("Failed to send")
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
        await supabase.from("community_post_votes").delete().eq("post_id", postId).eq("user_id", profile.id)
      } else {
        await supabase.from("community_post_votes").insert({
          post_id: postId,
          user_id: profile.id,
        })
      }

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
          loadPosts()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(postsSubscription)
    }
  }, [selectedCategory, supabase, loadPosts])

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
        {/* Sidebar - WhatsApp style */}
        <motion.div
          initial={{ x: -300 }}
          animate={{ x: sidebarOpen || window.innerWidth >= 768 ? 0 : -300 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className={cn(
            "w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col",
            "fixed md:relative z-50 md:z-auto h-full shadow-lg md:shadow-none",
          )}
        >
          {/* Header */}
          <div className="p-4 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Community</h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Stay connected</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setSidebarOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600 rounded-full"
              />
            </div>
          </div>

          {/* Categories - WhatsApp chat list style */}
          <ScrollArea className="flex-1 px-2">
            <div className="space-y-1">
              {categories.map((category) => (
                <motion.div
                  key={category.id}
                  whileHover={{ backgroundColor: "rgba(0,0,0,0.05)" }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors",
                    selectedCategory === category.id
                      ? "bg-green-100 dark:bg-green-900/20 border-l-4 border-green-500"
                      : "hover:bg-gray-100 dark:hover:bg-gray-700",
                  )}
                  onClick={() => {
                    setSelectedCategory(category.id)
                    setSidebarOpen(false)
                    setActivePost(null) // Reset to post mode when switching categories
                  }}
                >
                  <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-xl">
                    {category.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 dark:text-white truncate">{category.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {posts.filter((p) => p.category.id === category.id).length} messages
                    </div>
                  </div>
                  {selectedCategory === category.id && <div className="w-2 h-2 rounded-full bg-green-500"></div>}
                </motion.div>
              ))}
            </div>
          </ScrollArea>

          {/* User Profile */}
          {isAuthenticated && profile && (
            <div className="p-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3 p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={profile.avatar_url || "/placeholder-user.jpg"} />
                  <AvatarFallback className="bg-green-500 text-white font-semibold">
                    {profile.username?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 dark:text-white text-sm truncate">{profile.username}</div>
                  <UserTierBadge tier={profile.tier} size="sm" />
                </div>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </motion.div>

        {/* Main Chat Area - X/Twitter inspired */}
        <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 min-w-0">
          {/* Header */}
          <div className="p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setSidebarOpen(true)}>
                  <Menu className="h-5 w-5" />
                </Button>
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white text-lg">
                  {categories.find((c) => c.id === selectedCategory)?.icon || "💬"}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {categories.find((c) => c.id === selectedCategory)?.name || "General"}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {activePost ? "Reply to message" : `${filteredPosts.length} messages`}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {activePost && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActivePost(null)}
                    className="text-blue-500 hover:text-blue-600"
                  >
                    Back to feed
                  </Button>
                )}
                <Button variant="ghost" size="sm">
                  <Search className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Messages Area - BBM/WhatsApp style bubbles */}
          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            <AnimatePresence>
              {filteredPosts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    "flex space-x-3 group",
                    activePost === post.id && "bg-blue-50 dark:bg-blue-900/10 -mx-4 px-4 py-2 rounded-lg",
                  )}
                >
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarImage src={post.user.avatar_url || "/placeholder-user.jpg"} />
                    <AvatarFallback className="bg-green-500 text-white font-semibold">
                      {post.user.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    {/* Message bubble - WhatsApp style */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-tl-md shadow-sm border border-gray-200 dark:border-gray-700 p-3 max-w-2xl">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-semibold text-gray-900 dark:text-white text-sm">
                          {post.user.full_name || post.user.username}
                        </span>
                        <UserTierBadge tier={post.user.tier} size="sm" />
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                        </span>
                      </div>

                      <p className="text-gray-900 dark:text-white text-sm leading-relaxed break-words mb-3">
                        {post.content}
                      </p>

                      {/* Actions - X/Twitter style */}
                      <div className="flex items-center space-x-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "h-8 px-3 rounded-full transition-colors",
                            post.has_voted
                              ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                              : "text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20",
                          )}
                          onClick={() => voteOnPost(post.id)}
                        >
                          <Heart className={cn("h-4 w-4 mr-1", post.has_voted && "fill-current")} />
                          <span className="text-xs">{post.vote_count}</span>
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "h-8 px-3 rounded-full transition-colors",
                            activePost === post.id
                              ? "text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                              : "text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20",
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
                          <MessageCircle className="h-4 w-4 mr-1" />
                          <span className="text-xs">{post.comment_count}</span>
                        </Button>
                      </div>
                    </div>

                    {/* Comments - Threaded style */}
                    <AnimatePresence>
                      {activePost === post.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-3 ml-4 space-y-3 border-l-2 border-gray-200 dark:border-gray-700 pl-4"
                        >
                          {comments[post.id]?.map((comment) => (
                            <motion.div
                              key={comment.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="flex space-x-2"
                            >
                              <Avatar className="h-6 w-6 flex-shrink-0">
                                <AvatarImage src={comment.user.avatar_url || "/placeholder-user.jpg"} />
                                <AvatarFallback className="bg-gray-500 text-white text-xs">
                                  {comment.user.username.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="bg-gray-100 dark:bg-gray-800 rounded-xl rounded-tl-sm p-2 max-w-md">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="font-medium text-gray-900 dark:text-white text-xs">
                                    {comment.user.username}
                                  </span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                  </span>
                                </div>
                                <p className="text-gray-900 dark:text-white text-xs leading-relaxed">
                                  {comment.content}
                                </p>
                              </div>
                            </motion.div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
            {isAuthenticated ? (
              <div className="flex items-end space-x-3 max-w-4xl mx-auto">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src={profile?.avatar_url || "/placeholder-user.jpg"} />
                  <AvatarFallback className="bg-green-500 text-white font-semibold text-xs">
                    {profile?.username?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 relative">
                  <Input
                    ref={inputRef}
                    placeholder={activePost ? "Reply to this message..." : "Type a message..."}
                    value={unifiedInput}
                    onChange={(e) => setUnifiedInput(e.target.value)}
                    className="pr-20 rounded-full border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleUnifiedSubmit()
                      }
                    }}
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full">
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full">
                      <Smile className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <Button
                  onClick={handleUnifiedSubmit}
                  disabled={!unifiedInput.trim()}
                  className="h-10 w-10 p-0 rounded-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="text-center">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 max-w-md mx-auto">
                  <p className="text-gray-600 dark:text-gray-400 mb-4">Join the conversation</p>
                  <Button asChild className="bg-green-500 hover:bg-green-600 rounded-full px-8">
                    <a href="/login">Sign In</a>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/20 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
        )}
      </div>
    </div>
  )
}
