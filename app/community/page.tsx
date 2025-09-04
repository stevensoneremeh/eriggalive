"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Heart, MessageCircle, Smile, MoreVertical, Search, Menu, X, Zap, Send, ImageIcon, Mic } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"
import { UserTierBadge } from "@/components/user-tier-badge"
import { motion, AnimatePresence } from "framer-motion"

const ENHANCED_COMMUNITY_UI = true

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
  const [communityNavOpen, setCommunityNavOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedMedia, setSelectedMedia] = useState<File[]>([])
  const [mediaPreview, setMediaPreview] = useState<string[]>([])
  const [isClient, setIsClient] = useState(false)

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient) return

    document.body.classList.add("community-page")

    const communityNavEvent = new CustomEvent("communityPageActive", {
      detail: {
        categories,
        selectedCategory,
        isMobile: window.innerWidth < 768,
        enhancedUI: ENHANCED_COMMUNITY_UI,
      },
    })
    window.dispatchEvent(communityNavEvent)

    return () => {
      document.body.classList.remove("community-page")
      const communityNavEvent = new CustomEvent("communityPageInactive")
      window.dispatchEvent(communityNavEvent)
    }
  }, [categories, selectedCategory, isClient])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

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
      const fallbackCategories = [
        { id: 1, name: "General", slug: "general", icon: "💬", color: "#25D366", is_active: true },
        { id: 2, name: "Music", slug: "music", icon: "🎵", color: "#128C7E", is_active: true },
        { id: 3, name: "Events", slug: "events", icon: "📅", color: "#075E54", is_active: true },
      ]
      setCategories(fallbackCategories)
      setSelectedCategory(1)
    }
  }, [selectedCategory, supabase])

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

    const urlRegex =
      /(https?:\/\/[^\s]+|www\.[^\s]+|[^\s]+\.(com|org|net|edu|gov|io|co|uk|de|fr|jp|cn|in|br|au|ca|mx|es|it|ru|kr|nl|se|no|dk|fi|pl|tr|za|ng|ke|gh|tz|ug|rw|et|ma|eg|dz|ly|tn|sd|ao|mz|zw|bw|na|sz|ls|mw|zm|cd|cf|cm|ga|gq|st|td|ne|ml|bf|ci|sn|gm|gw|sl|lr|gh|tg|bj|ng|ne|td|cm|cf|cd|cg|ga|gq|st|ao|na|bw|sz|ls))/gi

    if (urlRegex.test(unifiedInput)) {
      toast.error("Links and URLs are not allowed in posts. Please share your thoughts without external links.")
      return
    }

    const trimmedContent = unifiedInput.trim()
    if (trimmedContent.length > 2000) {
      toast.error("Message is too long. Please keep it under 2000 characters.")
      return
    }

    try {
      if (activePost) {
        const { data, error } = await supabase
          .from("community_comments")
          .insert({
            content: trimmedContent,
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

        toast.success("Reply sent!")
      } else {
        if (!selectedCategory) {
          toast.error("Please select a category")
          return
        }

        console.log("[v0] Creating post with category:", selectedCategory, "content:", trimmedContent)

        const formData = new FormData()
        formData.append("content", trimmedContent)
        formData.append("categoryId", selectedCategory.toString())

        const response = await fetch("/api/community/posts", {
          method: "POST",
          body: formData,
        })

        const result = await response.json()
        console.log("[v0] API Response:", result)

        if (!response.ok) {
          console.error("[v0] API Error:", result)
          throw new Error(result.error || `HTTP ${response.status}: Failed to create post`)
        }

        if (result.success && result.post) {
          const newPost: Post = {
            id: result.post.id,
            content: result.post.content,
            created_at: result.post.created_at,
            vote_count: result.post.vote_count || 0,
            comment_count: result.post.comment_count || 0,
            media_url: result.post.media_url,
            media_type: result.post.media_type,
            user: result.post.user || {
              id: profile.id,
              username: profile.username || "Unknown",
              full_name: profile.full_name || profile.username || "Unknown User",
              avatar_url: profile.avatar_url,
              tier: profile.tier || "FREE",
            },
            category: result.post.category || {
              id: selectedCategory,
              name: categories.find((c) => c.id === selectedCategory)?.name || "General",
              slug: categories.find((c) => c.id === selectedCategory)?.slug || "general",
            },
            has_voted: false,
          }

          console.log("[v0] Adding new post to state:", newPost)
          setPosts((prev) => [...prev, newPost])
          setTimeout(scrollToBottom, 100)
          toast.success("Message posted!")
        } else {
          throw new Error("Invalid response format from server")
        }
      }

      setUnifiedInput("")
      setSelectedMedia([])
      setMediaPreview([])
    } catch (error) {
      console.error("[v0] Error submitting:", error)
      toast.error(error instanceof Error ? error.message : "Failed to send message. Please try again.")
    }
  }

  const handleMediaSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return

    const validFiles = files.filter((file) => {
      const isValidType =
        file.type.startsWith("image/") || file.type.startsWith("video/") || file.type.startsWith("audio/")
      const isValidSize = file.size <= 10 * 1024 * 1024

      if (!isValidType) {
        toast.error(`${file.name} is not a supported media type`)
        return false
      }
      if (!isValidSize) {
        toast.error(`${file.name} is too large (max 10MB)`)
        return false
      }
      return true
    })

    if (validFiles.length === 0) return

    setSelectedMedia(validFiles)

    const previews = validFiles.map((file) => URL.createObjectURL(file))
    setMediaPreview(previews)
  }

  const removeMedia = (index: number) => {
    const newMedia = selectedMedia.filter((_, i) => i !== index)
    const newPreviews = mediaPreview.filter((_, i) => i !== index)

    URL.revokeObjectURL(mediaPreview[index])

    setSelectedMedia(newMedia)
    setMediaPreview(newPreviews)
  }

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

  const filteredPosts = posts.filter(
    (post) =>
      searchQuery === "" ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.user.username.toLowerCase().includes(searchQuery.toLowerCase()),
  )

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
      <div className="flex h-screen overflow-hidden bg-white dark:bg-gray-950">
        <motion.div
          initial={{ x: 0 }}
          className={cn(
            "w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col",
            "hidden md:flex relative z-auto h-full shadow-none max-h-screen overflow-hidden",
          )}
        >
          <div className="p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center shadow-sm">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900 dark:text-white">Community</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Stay connected</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 rounded-full focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          <ScrollArea className="flex-1 px-2">
            <div className="space-y-1">
              {categories.map((category) => (
                <motion.div
                  key={category.id}
                  whileHover={{ backgroundColor: "rgba(34, 197, 94, 0.05)" }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "flex items-center space-x-3 p-3 rounded-xl cursor-pointer transition-all duration-200",
                    selectedCategory === category.id
                      ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                      : "hover:bg-gray-50 dark:hover:bg-gray-800",
                  )}
                  onClick={() => {
                    setSelectedCategory(category.id)
                    setActivePost(null)
                  }}
                >
                  <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xl shadow-sm">
                    {category.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 dark:text-white truncate">{category.name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {posts.filter((p) => p.category.id === category.id).length} messages
                    </div>
                  </div>
                  {selectedCategory === category.id && (
                    <div className="w-2 h-2 rounded-full bg-green-500 shadow-sm"></div>
                  )}
                </motion.div>
              ))}
            </div>
          </ScrollArea>

          {isAuthenticated && profile && (
            <div className="p-3 border-t border-gray-200 dark:border-gray-800">
              <div className="flex items-center space-x-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                <Avatar className="h-10 w-10 ring-2 ring-green-500/20">
                  <AvatarImage src={profile.avatar_url || "/placeholder-user.jpg"} />
                  <AvatarFallback className="bg-green-500 text-white font-semibold">
                    {profile.username?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 dark:text-white text-sm truncate">{profile.username}</div>
                  <UserTierBadge tier={profile.tier} size="sm" />
                </div>
                <Button variant="ghost" size="sm" className="hover:bg-gray-200 dark:hover:bg-gray-700">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </motion.div>

        <div className="flex-1 flex flex-col bg-white dark:bg-gray-950 min-w-0 w-full">
          <div className="md:hidden fixed top-20 left-4 z-50">
            <Button
              onClick={() => setCommunityNavOpen(!communityNavOpen)}
              className="h-12 w-12 rounded-full bg-green-500 hover:bg-green-600 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
            >
              <motion.div animate={{ rotate: communityNavOpen ? 45 : 0 }} transition={{ duration: 0.2 }}>
                <Menu className="h-5 w-5 text-white" />
              </motion.div>
            </Button>
          </div>

          <AnimatePresence>
            {communityNavOpen && isClient && window.innerWidth < 768 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="md:hidden fixed top-16 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-lg overflow-hidden"
              >
                <div className="p-4 max-h-80 overflow-y-auto">
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <motion.div
                        key={category.id}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                          "flex items-center space-x-3 p-3 rounded-xl cursor-pointer transition-all duration-200",
                          selectedCategory === category.id
                            ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                            : "hover:bg-gray-50 dark:hover:bg-gray-800",
                        )}
                        onClick={() => {
                          setSelectedCategory(category.id)
                          setCommunityNavOpen(false)
                          setActivePost(null)
                        }}
                      >
                        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-lg">
                          {category.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 dark:text-white truncate">{category.name}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                            {posts.filter((p) => p.category.id === category.id).length} messages
                          </div>
                        </div>
                        {selectedCategory === category.id && <div className="w-2 h-2 rounded-full bg-green-500"></div>}
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="p-2 sm:p-3 md:p-4 bg-white/98 dark:bg-gray-950/98 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 sticky top-0 z-20 shadow-sm">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-2 md:space-x-3 flex-1 min-w-0">
                <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full bg-green-500 flex items-center justify-center text-white text-sm md:text-lg flex-shrink-0">
                  {categories.find((c) => c.id === selectedCategory)?.icon || "💬"}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-white truncate">
                    {categories.find((c) => c.id === selectedCategory)?.name || "General"}
                  </h2>
                  <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 truncate">
                    {activePost ? "Reply to message" : `${filteredPosts.length} messages`}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-1 flex-shrink-0">
                {activePost && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActivePost(null)}
                    className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 text-xs md:text-sm px-2 md:px-3 hidden sm:flex"
                  >
                    Back to feed
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="hover:bg-gray-100 dark:hover:bg-gray-800 h-7 w-7 md:h-9 md:w-9 p-0"
                >
                  <Search className="h-3 w-3 md:h-4 md:w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="hover:bg-gray-100 dark:hover:bg-gray-800 h-7 w-7 md:h-9 md:w-9 p-0"
                >
                  <MoreVertical className="h-3 w-3 md:h-4 md:w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto pb-20 sm:pb-24 md:pb-32 pt-0 md:pt-0">
            <AnimatePresence>
              {filteredPosts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    "border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-900/50 transition-colors duration-200 p-2 sm:p-3 md:p-4",
                    activePost === post.id &&
                      "bg-green-50/50 dark:bg-green-900/10 border-green-200 dark:border-green-800",
                  )}
                >
                  <div className="flex space-x-2 md:space-x-3">
                    <Avatar className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 flex-shrink-0 ring-2 ring-gray-200 dark:ring-gray-700">
                      <AvatarImage src={post.user.avatar_url || "/placeholder-user.jpg"} />
                      <AvatarFallback className="bg-green-500 text-white font-semibold text-xs sm:text-sm">
                        {post.user.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-1 md:space-x-2 mb-1 md:mb-2 flex-wrap">
                        <span className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm md:text-base truncate">
                          {post.user.full_name || post.user.username}
                        </span>
                        <UserTierBadge tier={post.user.tier} size="sm" />
                        <span className="text-gray-500 dark:text-gray-400 text-xs truncate">@{post.user.username}</span>
                        <span className="text-gray-500 dark:text-gray-400 text-xs">·</span>
                        <span className="text-gray-500 dark:text-gray-400 text-xs">
                          {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                        </span>
                      </div>

                      <p className="text-gray-900 dark:text-white leading-relaxed break-words mb-2 md:mb-3 text-xs sm:text-sm md:text-[15px]">
                        {post.content}
                      </p>

                      <div className="flex items-center space-x-3 sm:space-x-4 md:space-x-6 max-w-md">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "h-6 sm:h-7 md:h-8 px-1 sm:px-2 md:px-3 rounded-full transition-all duration-200 group",
                            post.has_voted
                              ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                              : "text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20",
                          )}
                          onClick={() => voteOnPost(post.id)}
                        >
                          <Heart
                            className={cn(
                              "h-3 w-3 md:h-4 md:w-4 mr-0.5 sm:mr-1 transition-all",
                              post.has_voted && "fill-current scale-110",
                            )}
                          />
                          <span className="text-xs md:text-sm font-medium">{post.vote_count}</span>
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "h-6 sm:h-7 md:h-8 px-1 sm:px-2 md:px-3 rounded-full transition-all duration-200 group",
                            activePost === post.id
                              ? "text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20"
                              : "text-gray-500 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20",
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
                          <MessageCircle className="h-3 w-3 md:h-4 md:w-4 mr-0.5 sm:mr-1 transition-all group-hover:scale-110" />
                          <span className="text-xs md:text-sm font-medium">{post.comment_count}</span>
                        </Button>
                      </div>

                      <AnimatePresence>
                        {activePost === post.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4 space-y-3 border-l-2 border-green-200 dark:border-green-800 pl-4"
                          >
                            {comments[post.id]?.map((comment) => (
                              <motion.div
                                key={comment.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex space-x-3"
                              >
                                <Avatar className="h-8 w-8 flex-shrink-0">
                                  <AvatarImage src={comment.user.avatar_url || "/placeholder-user.jpg"} />
                                  <AvatarFallback className="bg-gray-500 text-white text-xs">
                                    {comment.user.username.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <span className="font-semibold text-gray-900 dark:text-white text-sm">
                                      {comment.user.username}
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                    </span>
                                  </div>
                                  <p className="text-gray-900 dark:text-white text-sm leading-relaxed">
                                    {comment.content}
                                  </p>
                                </div>
                              </motion.div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>

          <div className="fixed bottom-0 left-0 right-0 md:left-80 border-t border-gray-200 dark:border-gray-800 bg-white/98 dark:bg-gray-950/98 backdrop-blur-md p-2 sm:p-3 md:p-4 z-30 shadow-lg">
            {mediaPreview.length > 0 && (
              <div className="mb-2 md:mb-3 flex space-x-2 overflow-x-auto">
                {mediaPreview.map((preview, index) => (
                  <div key={index} className="relative flex-shrink-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                      {selectedMedia[index].type.startsWith("image/") ? (
                        <img src={preview || "/placeholder.svg"} alt="Preview" className="w-full h-full object-cover" />
                      ) : selectedMedia[index].type.startsWith("video/") ? (
                        <video src={preview} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Mic className="h-3 w-3 sm:h-4 sm:w-4 md:h-6 md:w-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute -top-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 p-0 rounded-full shadow-sm"
                      onClick={() => removeMedia(index)}
                    >
                      <X className="h-2 w-2 md:h-3 md:w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {isAuthenticated ? (
              <div className="flex items-end space-x-2 md:space-x-3 max-w-4xl mx-auto">
                <Avatar className="h-7 w-7 sm:h-8 sm:w-8 md:h-10 md:w-10 flex-shrink-0 ring-2 ring-green-500/20">
                  <AvatarImage src={profile?.avatar_url || "/placeholder-user.jpg"} />
                  <AvatarFallback className="bg-green-500 text-white font-semibold text-xs md:text-sm">
                    {profile?.username?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 relative">
                  <Input
                    ref={inputRef}
                    placeholder={activePost ? "Reply to this message..." : "What's on your mind?"}
                    value={unifiedInput}
                    onChange={(e) => setUnifiedInput(e.target.value)}
                    className="pr-16 sm:pr-20 md:pr-32 rounded-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm md:text-[16px] min-h-[36px] sm:min-h-[40px] md:min-h-[44px]"
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleUnifiedSubmit()
                      }
                    }}
                  />
                  <div className="absolute right-1 md:right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-0.5 md:space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 p-0 rounded-full hover:bg-green-50 dark:hover:bg-green-900/20"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <ImageIcon className="h-3 w-3 md:h-4 md:w-4 text-green-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 p-0 rounded-full hover:bg-green-50 dark:hover:bg-green-900/20"
                    >
                      <Smile className="h-3 w-3 md:h-4 md:w-4 text-green-500" />
                    </Button>
                  </div>
                </div>
                <Button
                  onClick={handleUnifiedSubmit}
                  disabled={!unifiedInput.trim() && selectedMedia.length === 0}
                  className="h-7 w-7 sm:h-8 sm:w-8 md:h-10 md:w-10 p-0 rounded-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 shadow-sm transition-all duration-200 hover:scale-105"
                >
                  <Send className="h-3 w-3 md:h-4 md:w-4" />
                </Button>
              </div>
            ) : (
              <div className="text-center">
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 md:p-6 max-w-md mx-auto shadow-sm">
                  <p className="text-gray-700 dark:text-gray-300 mb-3 md:mb-4 font-medium text-sm md:text-base">
                    Join the conversation
                  </p>
                  <Button
                    asChild
                    className="bg-green-500 hover:bg-green-600 rounded-full px-6 md:px-8 shadow-sm text-sm"
                  >
                    <a href="/login">Sign In</a>
                  </Button>
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*,audio/*"
              onChange={handleMediaSelect}
              className="hidden"
            />
          </div>
        </div>

        {communityNavOpen && (
          <div
            className="fixed inset-0 bg-black/20 z-30 md:hidden backdrop-blur-sm"
            onClick={() => setCommunityNavOpen(false)}
          />
        )}
      </div>
    </div>
  )
}
