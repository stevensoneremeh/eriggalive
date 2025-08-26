"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Heart, MessageCircle, Smile, Paperclip, MoreVertical, Search, Menu, X, Filter, Zap } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"
import { UserTierBadge } from "@/components/user-tier-badge"

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
    <div className="min-h-screen bg-background">
      <div className="flex h-screen overflow-hidden">
        <div
          className={cn(
            "w-full sm:w-80 md:w-80 lg:w-80 xl:w-96 bg-card border-r border-border flex flex-col transition-all duration-300",
            "fixed md:relative z-50 md:z-auto h-full",
            sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          )}
        >
          <div className="p-4 sm:p-6 bg-card border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary flex items-center justify-center">
                  <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold text-foreground">Community</h1>
                  <p className="text-xs sm:text-sm text-muted-foreground">Connect & Share</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden rounded-full p-2 min-h-[44px] min-w-[44px]"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="p-3 sm:p-4">
            <div className="relative">
              <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 sm:pl-12 bg-background border-border rounded-full h-11 sm:h-12 text-base sm:text-lg focus:ring-2 focus:ring-primary/20"
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full min-h-[36px] min-w-[36px]"
              >
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1 px-3 sm:px-4">
            <div className="space-y-1">
              {categories.map((category, index) => (
                <div
                  key={category.id}
                  className={cn(
                    "group relative overflow-hidden rounded-full transition-all duration-200 hover:bg-accent cursor-pointer",
                    "min-h-[56px] sm:min-h-[60px]",
                    selectedCategory === category.id ? "bg-primary/10 border border-primary/20" : "hover:bg-accent",
                  )}
                  onClick={() => {
                    setSelectedCategory(category.id)
                    setSidebarOpen(false)
                  }}
                >
                  <div className="p-3 sm:p-4">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <div
                        className={cn(
                          "w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-lg sm:text-xl",
                          selectedCategory === category.id
                            ? "bg-primary text-primary-foreground"
                            : "bg-accent text-accent-foreground",
                        )}
                      >
                        {category.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-foreground truncate text-base sm:text-lg">
                          {category.name}
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground truncate">
                          {posts.filter((p) => p.category.id === category.id).length} messages
                        </div>
                      </div>
                      {selectedCategory === category.id && <div className="w-2 h-2 rounded-full bg-primary"></div>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {isAuthenticated && profile && (
            <div className="p-3 sm:p-4 border-t border-border">
              <div className="flex items-center space-x-3 sm:space-x-4 p-3 rounded-full bg-accent/50">
                <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
                  <AvatarImage src={profile.avatar_url || "/placeholder-user.jpg"} />
                  <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-xs sm:text-sm">
                    {profile.username?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-foreground text-sm truncate">{profile.username}</div>
                  <UserTierBadge tier={profile.tier} size="sm" />
                </div>
                <Button variant="ghost" size="sm" className="rounded-full p-2 min-h-[36px] min-w-[36px]">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col bg-background min-w-0 h-screen">
          <div className="sticky top-0 z-20 p-4 bg-background/80 backdrop-blur-md border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="md:hidden rounded-full p-2 min-h-[44px] min-w-[44px]"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                </Button>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-lg sm:text-xl flex-shrink-0">
                  {categories.find((c) => c.id === selectedCategory)?.icon || "💬"}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg sm:text-xl font-bold text-foreground truncate">
                    {categories.find((c) => c.id === selectedCategory)?.name || "General"}
                  </h2>
                  <p className="text-muted-foreground text-sm truncate">{filteredPosts.length} posts</p>
                </div>
              </div>
              <div className="flex items-center space-x-1 flex-shrink-0">
                <Button variant="ghost" size="sm" className="rounded-full p-2 min-h-[44px] min-w-[44px]">
                  <Search className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
                <Button variant="ghost" size="sm" className="rounded-full p-2 min-h-[44px] min-w-[44px]">
                  <MoreVertical className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </div>
            </div>
          </div>

          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
            <div className="max-w-2xl mx-auto">
              {filteredPosts.map((post, index) => (
                <div
                  key={post.id}
                  className="border-b border-border hover:bg-accent/30 transition-colors duration-200 cursor-pointer"
                >
                  <div className="p-4 sm:p-6">
                    <div className="flex space-x-3">
                      <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
                        <AvatarImage src={post.user.avatar_url || "/placeholder-user.jpg"} />
                        <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                          {post.user.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1 flex-wrap">
                          <span className="font-bold text-foreground text-base">
                            {post.user.full_name || post.user.username}
                          </span>
                          <UserTierBadge tier={post.user.tier} size="sm" />
                          <span className="text-muted-foreground text-sm">
                            · {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                          </span>
                        </div>

                        <p className="text-foreground text-base leading-relaxed mb-3 break-words">{post.content}</p>

                        <div className="flex items-center justify-between max-w-md">
                          <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                              "rounded-full px-3 py-2 h-9 transition-colors",
                              post.has_voted
                                ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                                : "text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950",
                            )}
                            onClick={() => voteOnPost(post.id)}
                          >
                            <Heart className={cn("h-4 w-4 mr-2", post.has_voted && "fill-current")} />
                            <span className="text-sm">{post.vote_count}</span>
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                              "rounded-full px-3 py-2 h-9 transition-colors",
                              activePost === post.id
                                ? "text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950"
                                : "text-muted-foreground hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950",
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
                            <span className="text-sm">{post.comment_count}</span>
                          </Button>
                        </div>
                      </div>
                    </div>

                    {activePost === post.id && (
                      <div className="mt-4 space-y-3 border-t border-border pt-4">
                        {comments[post.id]?.map((comment) => (
                          <div key={comment.id} className="flex space-x-3">
                            <Avatar className="h-8 w-8 flex-shrink-0">
                              <AvatarImage src={comment.user.avatar_url || "/placeholder-user.jpg"} />
                              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                                {comment.user.username.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="font-semibold text-foreground text-sm">{comment.user.username}</span>
                                <span className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                </span>
                              </div>
                              <p className="text-foreground text-sm leading-relaxed break-words">{comment.content}</p>
                            </div>
                          </div>
                        ))}

                        {isAuthenticated && (
                          <div className="flex space-x-3 pt-3">
                            <Avatar className="h-8 w-8 flex-shrink-0">
                              <AvatarImage src={profile?.avatar_url || "/placeholder-user.jpg"} />
                              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                                {profile?.username?.charAt(0).toUpperCase() || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 flex space-x-2">
                              <Input
                                placeholder="Tweet your reply"
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                className="flex-1 rounded-full border-border focus:ring-2 focus:ring-primary/20"
                                onKeyPress={(e) => {
                                  if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault()
                                    sendComment(post.id)
                                  }
                                }}
                              />
                              <Button
                                onClick={() => sendComment(post.id)}
                                disabled={!newComment.trim()}
                                size="sm"
                                className="rounded-full px-4"
                              >
                                Reply
                              </Button>
                            </div>
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

          <div className="border-t border-border bg-background">
            {isAuthenticated ? (
              <div className="p-4">
                <div className="max-w-2xl mx-auto">
                  <div className="flex space-x-3">
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarImage src={profile?.avatar_url || "/placeholder-user.jpg"} />
                      <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                        {profile?.username?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-3">
                      <Input
                        ref={inputRef}
                        placeholder="What's happening?"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="text-lg border-none bg-transparent focus:ring-0 p-0 h-auto min-h-[48px] resize-none"
                        onKeyPress={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault()
                            sendMessage()
                          }
                        }}
                      />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm" className="rounded-full p-2">
                            <Paperclip className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="rounded-full p-2">
                            <Smile className="h-4 w-4" />
                          </Button>
                        </div>
                        <Button onClick={sendMessage} disabled={!newMessage.trim()} className="rounded-full px-6">
                          Post
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4">
                <div className="max-w-2xl mx-auto text-center">
                  <div className="bg-card rounded-2xl border border-border p-6">
                    <p className="text-muted-foreground mb-4">Join the conversation</p>
                    <Button asChild className="rounded-full px-8">
                      <a href="/login">Sign In</a>
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/20 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
        )}
      </div>
    </div>
  )
}
