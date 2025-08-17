"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Heart, MessageCircle, Send, Hash, ImageIcon, Smile, MoreVertical, CheckCheck } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"

interface User {
  id: string
  username: string
  full_name: string
  avatar_url?: string
  tier: string
}

interface Category {
  id: string
  name: string
  description: string
  icon: string
  color: string
  slug: string
  is_active: boolean
  display_order: number
}

interface Comment {
  id: string
  content: string
  user_id: string
  post_id: string
  parent_comment_id?: string
  like_count: number
  created_at: string
  updated_at: string
  is_deleted: boolean
  user?: User
  replies?: Comment[]
}

interface Post {
  id: string
  content: string
  user_id: string
  category_id: string
  hashtags?: string[]
  media_url?: string
  media_type?: string
  vote_count: number
  comment_count: number
  created_at: string
  updated_at: string
  is_published: boolean
  is_deleted: boolean
  user?: User
  category?: Category
  comments?: Comment[]
  user_has_voted?: boolean
}

export default function CommunityPage() {
  const { isAuthenticated, profile, isLoading } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const [newPostContent, setNewPostContent] = useState("")
  const [newPostHashtags, setNewPostHashtags] = useState("")
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set())
  const [newComments, setNewComments] = useState<Record<string, string>>({})

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("community_categories")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true })

      if (error) {
        console.error("Error loading categories:", error)
        return
      }

      setCategories(data || [])
    } catch (error) {
      console.error("Error loading categories:", error)
    }
  }

  const loadPosts = async () => {
    try {
      setLoading(true)

      let query = supabase
        .from("community_posts")
        .select(`
          *,
          user:users!community_posts_user_id_fkey(*),
          category:community_categories!community_posts_category_id_fkey(*)
        `)
        .eq("is_published", true)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false })
        .limit(50)

      if (selectedCategory !== "all") {
        const category = categories.find((cat) => cat.slug === selectedCategory)
        if (category) {
          query = query.eq("category_id", category.id)
        }
      }

      const { data: postsData, error } = await query

      if (error) {
        console.error("Error loading posts:", error)
        return
      }

      // Load comments for each post
      const postsWithComments = await Promise.all(
        (postsData || []).map(async (post) => {
          const { data: comments } = await supabase
            .from("community_comments")
            .select(`
              *,
              user:users!community_comments_user_id_fkey(*)
            `)
            .eq("post_id", post.id)
            .eq("is_deleted", false)
            .order("created_at", { ascending: true })

          // Check if user has voted on this post
          let user_has_voted = false
          if (profile) {
            const { data: vote } = await supabase
              .from("community_post_votes")
              .select("id")
              .eq("post_id", post.id)
              .eq("user_id", profile.id)
              .single()

            user_has_voted = !!vote
          }

          return {
            ...post,
            comments: comments || [],
            user_has_voted,
          }
        }),
      )

      setPosts(postsWithComments)
    } catch (error) {
      console.error("Error loading posts:", error)
    } finally {
      setLoading(false)
    }
  }

  const createPost = async () => {
    if (!isAuthenticated || !profile) {
      toast.error("Please sign in to post")
      return
    }

    if (!newPostContent.trim()) {
      toast.error("Please enter some content")
      return
    }

    try {
      const hashtags = newPostHashtags
        .split(" ")
        .filter((tag) => tag.startsWith("#"))
        .map((tag) => tag.slice(1))

      const categoryId =
        selectedCategory === "all" ? categories[0]?.id : categories.find((cat) => cat.slug === selectedCategory)?.id

      const { data, error } = await supabase
        .from("community_posts")
        .insert([
          {
            content: newPostContent.trim(),
            user_id: profile.id,
            category_id: categoryId,
            hashtags: hashtags.length > 0 ? hashtags : null,
            is_published: true,
            is_deleted: false,
            vote_count: 0,
            comment_count: 0,
          },
        ])
        .select()

      if (error) {
        console.error("Error creating post:", error)
        toast.error("Failed to create post")
        return
      }

      setNewPostContent("")
      setNewPostHashtags("")
      toast.success("Post created!")
      loadPosts() // Reload posts
    } catch (error) {
      console.error("Error creating post:", error)
      toast.error("Failed to create post")
    }
  }

  const toggleVote = async (postId: string) => {
    if (!isAuthenticated || !profile) {
      toast.error("Please sign in to vote")
      return
    }

    try {
      const post = posts.find((p) => p.id === postId)
      if (!post) return

      if (post.user_has_voted) {
        // Remove vote
        const { error } = await supabase
          .from("community_post_votes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", profile.id)

        if (error) throw error

        // Update local state
        setPosts((prev) =>
          prev.map((p) => (p.id === postId ? { ...p, vote_count: p.vote_count - 1, user_has_voted: false } : p)),
        )
      } else {
        // Add vote
        const { error } = await supabase.from("community_post_votes").insert([{ post_id: postId, user_id: profile.id }])

        if (error) throw error

        // Update local state
        setPosts((prev) =>
          prev.map((p) => (p.id === postId ? { ...p, vote_count: p.vote_count + 1, user_has_voted: true } : p)),
        )
      }
    } catch (error) {
      console.error("Error toggling vote:", error)
      toast.error("Failed to update vote")
    }
  }

  const addComment = async (postId: string) => {
    if (!isAuthenticated || !profile) {
      toast.error("Please sign in to comment")
      return
    }

    const content = newComments[postId]?.trim()
    if (!content) return

    try {
      const { error } = await supabase.from("community_comments").insert([
        {
          content,
          post_id: postId,
          user_id: profile.id,
          is_deleted: false,
          like_count: 0,
        },
      ])

      if (error) throw error

      // Update comment count
      await supabase
        .from("community_posts")
        .update({ comment_count: supabase.raw("comment_count + 1") })
        .eq("id", postId)

      setNewComments((prev) => ({ ...prev, [postId]: "" }))
      loadPosts() // Reload to get new comment
    } catch (error) {
      console.error("Error adding comment:", error)
      toast.error("Failed to add comment")
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case "blood_brotherhood":
      case "blood":
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

  const getTierDisplayName = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case "blood_brotherhood":
      case "blood":
        return "Blood"
      case "elder":
        return "Elder"
      case "pioneer":
        return "Pioneer"
      case "grassroot":
        return "Grassroot"
      default:
        return "Fan"
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } else {
      return formatDistanceToNow(date, { addSuffix: true })
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    loadCategories()
  }, [])

  useEffect(() => {
    if (categories.length > 0) {
      loadPosts()
    }
  }, [categories, selectedCategory])

  useEffect(() => {
    scrollToBottom()
  }, [posts])

  useEffect(() => {
    if (!isAuthenticated) return

    const postsSubscription = supabase
      .channel("community_posts")
      .on("postgres_changes", { event: "*", schema: "public", table: "community_posts" }, () => loadPosts())
      .subscribe()

    const commentsSubscription = supabase
      .channel("community_comments")
      .on("postgres_changes", { event: "*", schema: "public", table: "community_comments" }, () => loadPosts())
      .subscribe()

    return () => {
      postsSubscription.unsubscribe()
      commentsSubscription.unsubscribe()
    }
  }, [isAuthenticated])

  if (isLoading) {
    return (
      <div className="h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading community...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gray-100 flex">
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 bg-green-600 text-white">
          <h1 className="text-xl font-semibold">Erigga Community</h1>
          <p className="text-green-100 text-sm">Stay connected with the movement</p>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2">
            <Button
              variant={selectedCategory === "all" ? "default" : "ghost"}
              className={`w-full justify-start mb-1 ${
                selectedCategory === "all" ? "bg-green-100 text-green-800 hover:bg-green-200" : "hover:bg-gray-100"
              }`}
              onClick={() => setSelectedCategory("all")}
            >
              <Hash className="h-4 w-4 mr-2" />
              All Categories
            </Button>

            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.slug ? "default" : "ghost"}
                className={`w-full justify-start mb-1 ${
                  selectedCategory === category.slug
                    ? "bg-green-100 text-green-800 hover:bg-green-200"
                    : "hover:bg-gray-100"
                }`}
                onClick={() => setSelectedCategory(category.slug)}
              >
                <span className="mr-2">{category.icon}</span>
                {category.name}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>

      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-4 bg-green-600 text-white border-b border-green-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">
                {selectedCategory === "all"
                  ? "All Categories"
                  : categories.find((cat) => cat.slug === selectedCategory)?.name || "Community"}
              </h2>
              <p className="text-green-100 text-sm">
                {posts.length} messages • {isAuthenticated ? "Online" : "Offline"}
              </p>
            </div>
            <MoreVertical className="h-5 w-5 text-green-200" />
          </div>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4 bg-gray-50">
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500 mx-auto mb-2"></div>
                <p className="text-gray-500 text-sm">Loading messages...</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No posts here yet — be the first!</p>
              </div>
            ) : (
              posts.map((post) => (
                <div key={post.id} className="space-y-2">
                  <div className="flex items-start space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={post.user?.avatar_url || "/placeholder.svg"} />
                      <AvatarFallback className="bg-green-500 text-white text-xs">
                        {post.user?.username?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 max-w-lg">
                      <div className="bg-white rounded-lg shadow-sm p-3 border">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-sm text-gray-900">
                              {post.user?.full_name || post.user?.username}
                            </span>
                            <Badge className={`text-xs ${getTierColor(post.user?.tier || "")} text-white`}>
                              {getTierDisplayName(post.user?.tier || "")}
                            </Badge>
                          </div>
                          <span className="text-xs text-gray-500">{formatTime(post.created_at)}</span>
                        </div>

                        <p className="text-gray-800 text-sm whitespace-pre-wrap mb-2">{post.content}</p>

                        {post.hashtags && post.hashtags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {post.hashtags.map((tag, index) => (
                              <span key={index} className="text-blue-600 text-xs">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`h-6 px-2 text-xs ${
                                post.user_has_voted
                                  ? "text-red-600 hover:text-red-700"
                                  : "text-gray-500 hover:text-red-600"
                              }`}
                              onClick={() => toggleVote(post.id)}
                            >
                              <Heart className={`h-3 w-3 mr-1 ${post.user_has_voted ? "fill-current" : ""}`} />
                              {post.vote_count}
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs text-gray-500 hover:text-blue-600"
                              onClick={() => {
                                const newExpanded = new Set(expandedComments)
                                if (newExpanded.has(post.id)) {
                                  newExpanded.delete(post.id)
                                } else {
                                  newExpanded.add(post.id)
                                }
                                setExpandedComments(newExpanded)
                              }}
                            >
                              <MessageCircle className="h-3 w-3 mr-1" />
                              {post.comment_count}
                            </Button>
                          </div>

                          <div className="flex items-center">
                            <CheckCheck className="h-3 w-3 text-blue-500" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {expandedComments.has(post.id) && (
                    <div className="ml-11 space-y-2">
                      {post.comments?.map((comment) => (
                        <div key={comment.id} className="flex items-start space-x-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={comment.user?.avatar_url || "/placeholder.svg"} />
                            <AvatarFallback className="bg-gray-400 text-white text-xs">
                              {comment.user?.username?.charAt(0).toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>

                          <div className="bg-gray-100 rounded-lg p-2 max-w-md">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-medium text-xs text-gray-700">
                                {comment.user?.full_name || comment.user?.username}
                              </span>
                              <span className="text-xs text-gray-500">{formatTime(comment.created_at)}</span>
                            </div>
                            <p className="text-gray-800 text-xs">{comment.content}</p>
                          </div>
                        </div>
                      ))}

                      {/* Comment input */}
                      {isAuthenticated && (
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={profile?.avatar_url || "/placeholder.svg"} />
                            <AvatarFallback className="bg-green-500 text-white text-xs">
                              {profile?.username?.charAt(0).toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 flex items-center space-x-2">
                            <Input
                              placeholder="Reply..."
                              value={newComments[post.id] || ""}
                              onChange={(e) =>
                                setNewComments((prev) => ({
                                  ...prev,
                                  [post.id]: e.target.value,
                                }))
                              }
                              className="h-8 text-xs bg-white"
                              onKeyPress={(e) => {
                                if (e.key === "Enter") {
                                  addComment(post.id)
                                }
                              }}
                            />
                            <Button
                              size="sm"
                              className="h-8 px-3 bg-green-600 hover:bg-green-700"
                              onClick={() => addComment(post.id)}
                            >
                              <Send className="h-3 w-3" />
                            </Button>
                          </div>
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

        {isAuthenticated ? (
          <div className="p-4 bg-white border-t border-gray-200">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile?.avatar_url || "/placeholder.svg"} />
                  <AvatarFallback className="bg-green-500 text-white">
                    {profile?.username?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <Input
                  placeholder="Type a message..."
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  className="flex-1 bg-gray-50 border-gray-200"
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      createPost()
                    }
                  }}
                />
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={createPost}
                  disabled={!newPostContent.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center space-x-2 ml-10">
                <Input
                  placeholder="Add hashtags (e.g., #music #bars)"
                  value={newPostHashtags}
                  onChange={(e) => setNewPostHashtags(e.target.value)}
                  className="flex-1 h-8 text-xs bg-gray-50 border-gray-200"
                />
                <Button variant="ghost" size="sm" className="h-8 px-2">
                  <ImageIcon className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 px-2">
                  <Smile className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-white border-t border-gray-200 text-center">
            <p className="text-gray-600 mb-2">Sign in to join the conversation</p>
            <Button asChild className="bg-green-600 hover:bg-green-700">
              <a href="/login">Sign In</a>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
