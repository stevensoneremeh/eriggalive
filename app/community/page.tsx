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
  const [isScrollingDown, setIsScrollingDown] = useState(false)
  const [lastScrollY, setLastScrollY] = useState(0)

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    const handleScroll = () => {
      if (typeof window === "undefined") return

      const currentScrollY = scrollContainerRef.current?.scrollTop || 0
      const scrollDifference = currentScrollY - lastScrollY

      // Only hide nav on mobile screens
      if (window.innerWidth < 768) {
        if (scrollDifference > 10 && currentScrollY > 100) {
          setIsScrollingDown(true)
        } else if (scrollDifference < -10) {
          setIsScrollingDown(false)
        }
      } else {
        setIsScrollingDown(false)
      }

      setLastScrollY(currentScrollY)
    }

    const scrollContainer = scrollContainerRef.current
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", handleScroll, { passive: true })
      return () => scrollContainer.removeEventListener("scroll", handleScroll)
    }
  }, [lastScrollY])

  useEffect(() => {
    // Communicate scroll state to main navigation
    document.documentElement.style.setProperty("--main-nav-hidden", isScrollingDown ? "1" : "0")

    // Add CSS custom property for main nav hiding
    if (isScrollingDown) {
      document.body.classList.add("community-scrolling-down")
    } else {
      document.body.classList.remove("community-scrolling-down")
    }

    return () => {
      document.body.classList.remove("community-scrolling-down")
      document.documentElement.style.removeProperty("--main-nav-hidden")
    }
  }, [isScrollingDown])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;utf8,%3Csvg%20width=%2260%22%20height=%2260%22%20viewBox=%220%200%2060%2060%22%20xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg%20fill=%22none%22%20fillRule=%22evenodd%22%3E%3Cg%20fill=%22%23ffffff%22%20fillOpacity=%220.02%22%3E%3Ccircle%20cx=%2230%22%20cy=%2230%22%20r=%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
      <div className="relative flex h-screen overflow-hidden">
        {/* Sidebar */}
        <div
          className={cn(
            "w-full sm:w-80 md:w-80 lg:w-80 xl:w-96 backdrop-blur-xl bg-white/5 border-r border-white/10 flex flex-col transition-all duration-500 ease-out shadow-2xl",
            "fixed md:relative z-50 md:z-auto h-full",
            sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          )}
        >
          <div className="p-4 sm:p-6 backdrop-blur-xl bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center shadow-lg">
                  <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold text-white">Community Hub</h1>
                  <p className="text-xs sm:text-sm text-white/70">Connect & Share</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden text-white hover:bg-white/10 rounded-xl p-2 min-h-[44px] min-w-[44px]"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="p-3 sm:p-4">
            <div className="relative">
              <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-white/50 h-4 w-4" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 sm:pl-12 bg-white/5 backdrop-blur-sm border-white/10 text-white placeholder-white/50 rounded-xl h-11 sm:h-12 text-base sm:text-lg focus:bg-white/10 transition-all duration-300"
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg min-h-[36px] min-w-[36px]"
              >
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1 px-3 sm:px-4">
            <div className="space-y-2">
              {categories.map((category, index) => (
                <div
                  key={category.id}
                  className={cn(
                    "group relative overflow-hidden rounded-2xl transition-all duration-300 hover:scale-[1.02] cursor-pointer touch-manipulation",
                    "min-h-[60px] sm:min-h-[68px]",
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
                  <div className="p-3 sm:p-4">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <div
                        className={cn(
                          "w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-lg sm:text-xl shadow-lg transition-all duration-300",
                          selectedCategory === category.id
                            ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                            : "bg-white/10 text-white/80 group-hover:bg-white/20",
                        )}
                      >
                        {category.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-white truncate text-base sm:text-lg">{category.name}</div>
                        <div className="text-xs sm:text-sm text-white/60 truncate">
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
            <div className="p-3 sm:p-4 backdrop-blur-xl bg-white/5 border-t border-white/10">
              <div className="flex items-center space-x-3 sm:space-x-4 md:space-x-6 p-3 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 shadow-2xl">
                <Avatar className="h-8 w-8 sm:h-10 sm:w-10 ring-2 ring-white/20 flex-shrink-0">
                  <AvatarImage src={profile.avatar_url || "/placeholder-user.jpg"} />
                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold text-xs sm:text-sm">
                    {profile.username?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white/70 hover:text-white hover:bg-white/10 rounded-xl p-2 min-h-[44px] min-w-[44px] flex-shrink-0 touch-manipulation"
                >
                  <Paperclip className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
                <div className="flex-1 relative min-w-0">
                  <Input
                    ref={inputRef}
                    placeholder="Write a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="bg-white/5 border-white/10 text-white pr-10 sm:pr-12 rounded-xl sm:rounded-2xl h-10 sm:h-12 text-sm sm:text-lg focus:bg-white/10 transition-all duration-300"
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        sendComment(posts.find((p) => p.id === activePost)?.id || 0)
                      }
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white hover:bg-white/10 rounded-xl p-1 min-h-[32px] min-w-[32px]"
                  >
                    <Smile className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  onClick={() => sendComment(posts.find((p) => p.id === activePost)?.id || 0)}
                  disabled={!newComment.trim()}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl sm:rounded-2xl px-4 sm:px-6 py-2 sm:py-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed min-h-[40px] flex-shrink-0 touch-manipulation"
                >
                  <Send className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col backdrop-blur-xl bg-white/5 min-w-0 h-screen pb-0 md:pb-0">
          <div className="sticky top-0 z-20 p-2 sm:p-3 md:p-4 lg:p-6 backdrop-blur-xl bg-gradient-to-r from-white/10 to-white/5 border-b border-white/10 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4 min-w-0 flex-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="md:hidden text-white hover:bg-white/10 rounded-xl p-2 min-h-[44px] min-w-[44px] flex-shrink-0 touch-manipulation"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                </Button>
                <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm sm:text-lg md:text-xl lg:text-2xl shadow-lg flex-shrink-0">
                  {categories.find((c) => c.id === selectedCategory)?.icon || "💬"}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm sm:text-base md:text-lg lg:text-2xl font-bold text-white truncate">
                    {categories.find((c) => c.id === selectedCategory)?.name || "General"}
                  </h2>
                  <p className="text-white/60 text-xs sm:text-sm truncate">
                    {filteredPosts.length} posts • {categories.length} active members
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white/70 hover:text-white hover:bg-white/10 rounded-xl p-2 min-h-[44px] min-w-[44px] touch-manipulation"
                >
                  <Search className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white/70 hover:text-white hover:bg-white/10 rounded-xl p-2 min-h-[44px] min-w-[44px] touch-manipulation"
                >
                  <MoreVertical className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </div>
            </div>
          </div>

          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto pb-20 md:pb-4">
            <div className="p-2 sm:p-3 md:p-4 lg:p-6">
              <div className="max-w-4xl mx-auto space-y-3 sm:space-y-4 md:space-y-6">
                {filteredPosts.map((post, index) => (
                  <div
                    key={post.id}
                    className="group animate-fade-in-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="backdrop-blur-xl bg-white/5 rounded-2xl sm:rounded-3xl border border-white/10 p-4 sm:p-6 shadow-2xl hover:shadow-3xl hover:bg-white/10 transition-all duration-500 hover:scale-[1.01]">
                      <div className="flex items-start space-x-3 sm:space-x-4">
                        <Avatar className="h-10 w-10 sm:h-12 sm:w-12 ring-2 ring-white/20 shadow-lg flex-shrink-0">
                          <AvatarImage src={post.user.avatar_url || "/placeholder-user.jpg"} />
                          <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold">
                            {post.user.username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 sm:space-x-3 mb-2 sm:mb-3 flex-wrap">
                            <span className="font-bold text-white text-base sm:text-lg truncate">
                              {post.user.full_name || post.user.username}
                            </span>
                            <Badge
                              className={cn(
                                "text-xs text-white font-medium px-2 sm:px-3 py-1 rounded-full shadow-lg flex-shrink-0",
                                getTierColor(post.user.tier),
                              )}
                            >
                              {post.user.tier}
                            </Badge>
                            <span className="text-white/50 text-xs sm:text-sm flex-shrink-0">
                              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                            </span>
                          </div>

                          <p className="text-white/90 text-base sm:text-lg leading-relaxed mb-3 sm:mb-4 break-words">
                            {post.content}
                          </p>

                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center space-x-2 sm:space-x-4">
                              <Button
                                variant="ghost"
                                size="sm"
                                className={cn(
                                  "rounded-xl px-3 sm:px-4 py-2 transition-all duration-300 hover:scale-105 min-h-[40px] touch-manipulation",
                                  post.has_voted
                                    ? "text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20"
                                    : "text-white/70 hover:text-red-400 hover:bg-red-500/10",
                                )}
                                onClick={() => voteOnPost(post.id)}
                              >
                                <Heart
                                  className={cn(
                                    "h-4 w-4 mr-1 sm:mr-2 transition-all duration-300",
                                    post.has_voted && "fill-current scale-110",
                                  )}
                                />
                                <span className="text-sm sm:text-base">{post.vote_count}</span>
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                className={cn(
                                  "rounded-xl px-3 sm:px-4 py-2 transition-all duration-300 hover:scale-105 min-h-[40px] touch-manipulation",
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
                                <MessageCircle className="h-4 w-4 mr-1 sm:mr-2" />
                                <span className="text-sm sm:text-base">{post.comment_count}</span>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {activePost === post.id && (
                        <div className="mt-4 sm:mt-6 space-y-3 sm:space-y-4 animate-fade-in">
                          {comments[post.id]?.map((comment, commentIndex) => (
                            <div
                              key={comment.id}
                              className="ml-4 sm:ml-8 backdrop-blur-sm bg-white/5 rounded-xl sm:rounded-2xl border border-white/10 p-3 sm:p-4 animate-slide-in-right"
                              style={{ animationDelay: `${commentIndex * 100}ms` }}
                            >
                              <div className="flex items-start space-x-2 sm:space-x-3">
                                <Avatar className="h-6 w-6 sm:h-8 sm:w-8 ring-1 ring-white/20 flex-shrink-0">
                                  <AvatarImage src={comment.user.avatar_url || "/placeholder-user.jpg"} />
                                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-semibold">
                                    {comment.user.username.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center space-x-2 mb-1 sm:mb-2 flex-wrap">
                                    <span className="font-semibold text-white text-xs sm:text-sm truncate">
                                      {comment.user.username}
                                    </span>
                                    <span className="text-xs text-white/50 flex-shrink-0">
                                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                    </span>
                                  </div>
                                  <p className="text-white/80 text-xs sm:text-sm leading-relaxed break-words">
                                    {comment.content}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}

                          {isAuthenticated && (
                            <div className="ml-4 sm:ml-8 flex items-center space-x-2 sm:space-x-3 p-3 sm:p-4 backdrop-blur-sm bg-white/5 rounded-xl sm:rounded-2xl border border-white/10">
                              <Avatar className="h-6 w-6 sm:h-8 sm:w-8 ring-1 ring-white/20 flex-shrink-0">
                                <AvatarImage src={profile?.avatar_url || "/placeholder-user.jpg"} />
                                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-semibold">
                                  {profile?.username?.charAt(0).toUpperCase() || "U"}
                                </AvatarFallback>
                              </Avatar>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-white/70 hover:text-white hover:bg-white/10 rounded-xl p-2 min-h-[36px] min-w-[36px] flex-shrink-0"
                              >
                                <Paperclip className="h-4 w-4" />
                              </Button>
                              <div className="flex-1 relative min-w-0">
                                <Input
                                  ref={inputRef}
                                  placeholder="Write a comment..."
                                  value={newComment}
                                  onChange={(e) => setNewComment(e.target.value)}
                                  className="bg-white/5 border-white/10 text-white pr-10 sm:pr-12 rounded-xl sm:rounded-2xl h-10 sm:h-12 text-sm sm:text-lg focus:bg-white/10 transition-all duration-300"
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
                                  className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white hover:bg-white/10 rounded-xl p-1 min-h-[32px] min-w-[32px]"
                                >
                                  <Smile className="h-4 w-4" />
                                </Button>
                              </div>
                              <Button
                                onClick={() => sendComment(post.id)}
                                disabled={!newComment.trim()}
                                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl sm:rounded-2xl px-4 sm:px-6 py-2 sm:py-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed min-h-[40px] flex-shrink-0"
                              >
                                <Send className="h-4 w-4 sm:h-5 sm:w-5" />
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>
          </div>

          <div className="fixed md:relative bottom-0 left-0 right-0 md:bottom-auto md:left-auto md:right-auto backdrop-blur-xl bg-gradient-to-r from-white/10 to-white/5 border-t border-white/10 z-30">
            {isAuthenticated ? (
              <div className="p-3 sm:p-3 md:p-4 safe-area-inset-bottom">
                <div className="max-w-4xl mx-auto">
                  <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4 p-3 sm:p-3 md:p-4 backdrop-blur-xl bg-white/10 rounded-2xl sm:rounded-2xl md:rounded-3xl border border-white/20 shadow-2xl">
                    <Avatar className="h-8 w-8 sm:h-10 sm:w-10 ring-2 ring-white/20 flex-shrink-0">
                      <AvatarImage src={profile?.avatar_url || "/placeholder-user.jpg"} />
                      <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold text-xs sm:text-sm">
                        {profile?.username?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white/70 hover:text-white hover:bg-white/10 rounded-xl p-2 min-h-[44px] min-w-[44px] flex-shrink-0 touch-manipulation"
                    >
                      <Paperclip className="h-4 w-4 sm:h-5 sm:w-5" />
                    </Button>
                    <div className="flex-1 relative min-w-0">
                      <Input
                        ref={inputRef}
                        placeholder="Share your thoughts..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="bg-white/5 border-white/10 text-white pr-12 sm:pr-12 rounded-xl sm:rounded-2xl h-12 sm:h-12 text-base sm:text-base md:text-lg focus:bg-white/10 transition-all duration-300 touch-manipulation"
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
                        className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white hover:bg-white/10 rounded-xl p-1 min-h-[36px] min-w-[36px] touch-manipulation"
                      >
                        <Smile className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button
                      onClick={sendMessage}
                      disabled={!newMessage.trim()}
                      className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl sm:rounded-2xl px-4 sm:px-6 md:px-8 py-3 sm:py-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] flex-shrink-0 touch-manipulation"
                    >
                      <Send className="h-4 w-4 sm:h-5 sm:w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 sm:p-4 md:p-6 safe-area-inset-bottom">
                <div className="max-w-4xl mx-auto text-center">
                  <div className="backdrop-blur-xl bg-white/5 rounded-2xl sm:rounded-3xl border border-white/10 p-4 sm:p-6 md:p-8">
                    <p className="text-white/70 mb-3 sm:mb-4 text-sm sm:text-base md:text-lg">Join the conversation</p>
                    <Button
                      asChild
                      className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl sm:rounded-2xl px-6 sm:px-6 md:px-8 py-3 sm:py-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 min-h-[48px] touch-manipulation"
                    >
                      <a href="/login">Sign In</a>
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden touch-manipulation"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </div>
    </div>
  )
}
