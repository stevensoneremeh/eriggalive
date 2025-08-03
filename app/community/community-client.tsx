"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Heart, MessageSquare, Share2, Send, Users } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"

interface Post {
  id: string
  content: string
  created_at: string
  updated_at: string
  author_id: string
  likes_count: number
  comments_count: number
  author: {
    id: string
    username: string
    full_name: string
    avatar_url: string
    tier: string
  }
  user_has_liked: boolean
}

interface Comment {
  id: string
  content: string
  created_at: string
  author_id: string
  post_id: string
  author: {
    id: string
    username: string
    full_name: string
    avatar_url: string
    tier: string
  }
}

const postVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.2,
    },
  },
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

export function CommunityClient() {
  const { user, profile } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [newPost, setNewPost] = useState("")
  const [posting, setPosting] = useState(false)
  const [selectedPost, setSelectedPost] = useState<string | null>(null)
  const [comments, setComments] = useState<{ [key: string]: Comment[] }>({})
  const [newComment, setNewComment] = useState("")
  const [commenting, setCommenting] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (!user || !profile) return

    const fetchPosts = async () => {
      try {
        setLoading(true)

        const { data, error } = await supabase
          .from("community_posts")
          .select(`
            *,
            author:users!community_posts_author_id_fkey (
              id,
              username,
              full_name,
              avatar_url,
              tier
            )
          `)
          .order("created_at", { ascending: false })
          .limit(20)

        if (error) throw error

        // Check which posts the user has liked
        const postIds = data?.map((post) => post.id) || []
        const { data: likes } = await supabase
          .from("community_post_likes")
          .select("post_id")
          .eq("user_id", profile.id)
          .in("post_id", postIds)

        const likedPostIds = new Set(likes?.map((like) => like.post_id) || [])

        const postsWithLikes =
          data?.map((post) => ({
            ...post,
            user_has_liked: likedPostIds.has(post.id),
          })) || []

        setPosts(postsWithLikes)
      } catch (error) {
        console.error("Error fetching posts:", error)
        toast.error("Failed to load posts")
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()

    // Set up real-time subscription for new posts
    const channel = supabase
      .channel("community-posts")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "community_posts",
        },
        (payload) => {
          // Fetch the full post with author data
          fetchPostWithAuthor(payload.new.id)
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, profile, supabase])

  const fetchPostWithAuthor = async (postId: string) => {
    try {
      const { data, error } = await supabase
        .from("community_posts")
        .select(`
          *,
          author:users!community_posts_author_id_fkey (
            id,
            username,
            full_name,
            avatar_url,
            tier
          )
        `)
        .eq("id", postId)
        .single()

      if (error) throw error

      const postWithLike = {
        ...data,
        user_has_liked: false,
      }

      setPosts((prev) => [postWithLike, ...prev])
    } catch (error) {
      console.error("Error fetching new post:", error)
    }
  }

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPost.trim() || !profile) return

    setPosting(true)
    try {
      const { error } = await supabase.from("community_posts").insert({
        content: newPost.trim(),
        author_id: profile.id,
      })

      if (error) throw error

      setNewPost("")
      toast.success("Post created successfully!")
    } catch (error) {
      console.error("Error creating post:", error)
      toast.error("Failed to create post")
    } finally {
      setPosting(false)
    }
  }

  const handleLikePost = async (postId: string) => {
    if (!profile) return

    const post = posts.find((p) => p.id === postId)
    if (!post) return

    try {
      if (post.user_has_liked) {
        // Unlike
        await supabase.from("community_post_likes").delete().eq("post_id", postId).eq("user_id", profile.id)

        setPosts((prev) =>
          prev.map((p) => (p.id === postId ? { ...p, user_has_liked: false, likes_count: p.likes_count - 1 } : p)),
        )
      } else {
        // Like
        await supabase.from("community_post_likes").insert({
          post_id: postId,
          user_id: profile.id,
        })

        setPosts((prev) =>
          prev.map((p) => (p.id === postId ? { ...p, user_has_liked: true, likes_count: p.likes_count + 1 } : p)),
        )
      }
    } catch (error) {
      console.error("Error toggling like:", error)
      toast.error("Failed to update like")
    }
  }

  const fetchComments = async (postId: string) => {
    try {
      const { data, error } = await supabase
        .from("community_comments")
        .select(`
          *,
          author:users!community_comments_author_id_fkey (
            id,
            username,
            full_name,
            avatar_url,
            tier
          )
        `)
        .eq("post_id", postId)
        .order("created_at", { ascending: true })

      if (error) throw error

      setComments((prev) => ({
        ...prev,
        [postId]: data || [],
      }))
    } catch (error) {
      console.error("Error fetching comments:", error)
    }
  }

  const handleShowComments = (postId: string) => {
    if (selectedPost === postId) {
      setSelectedPost(null)
    } else {
      setSelectedPost(postId)
      if (!comments[postId]) {
        fetchComments(postId)
      }
    }
  }

  const handleCreateComment = async (postId: string) => {
    if (!newComment.trim() || !profile) return

    setCommenting(true)
    try {
      const { error } = await supabase.from("community_comments").insert({
        content: newComment.trim(),
        post_id: postId,
        author_id: profile.id,
      })

      if (error) throw error

      setNewComment("")
      toast.success("Comment added!")

      // Refresh comments
      fetchComments(postId)

      // Update post comment count
      setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p)))
    } catch (error) {
      console.error("Error creating comment:", error)
      toast.error("Failed to add comment")
    } finally {
      setCommenting(false)
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "grassroot":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "pioneer":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
      case "elder":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "blood_brotherhood":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p className="text-muted-foreground">Please log in to access the community.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 pt-20 pb-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
          {/* Header */}
          <motion.div variants={postVariants} className="text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
              Community
            </h1>
            <p className="text-muted-foreground">Connect with fellow Erigga fans</p>
          </motion.div>

          {/* Create Post */}
          <motion.div variants={postVariants}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Share your thoughts</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreatePost} className="space-y-4">
                  <Textarea
                    placeholder="What's on your mind?"
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    className="min-h-[100px]"
                    disabled={posting}
                  />
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">{newPost.length}/500 characters</div>
                    <Button type="submit" disabled={!newPost.trim() || posting}>
                      {posting ? "Posting..." : "Post"}
                      <Send className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Posts Feed */}
          <div className="space-y-6">
            {loading ? (
              // Loading skeletons
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex space-x-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                        <div className="flex space-x-4 mt-4">
                          <Skeleton className="h-8 w-16" />
                          <Skeleton className="h-8 w-16" />
                          <Skeleton className="h-8 w-16" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <AnimatePresence>
                {posts.map((post) => (
                  <motion.div
                    key={post.id}
                    variants={postVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    layout
                  >
                    <Card className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex space-x-4">
                          <Avatar className="h-10 w-10">
                            <AvatarImage
                              src={post.author.avatar_url || "/placeholder-user.jpg"}
                              alt={post.author.username}
                            />
                            <AvatarFallback>
                              {post.author.full_name?.charAt(0) || post.author.username?.charAt(0) || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="font-semibold">{post.author.full_name || post.author.username}</h3>
                              <Badge className={`text-xs ${getTierColor(post.author.tier)}`}>
                                {post.author.tier?.replace("_", " ").toUpperCase()}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                              </span>
                            </div>
                            <p className="text-gray-800 dark:text-gray-200 mb-4 whitespace-pre-wrap">{post.content}</p>
                            <div className="flex items-center space-x-4">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleLikePost(post.id)}
                                className={post.user_has_liked ? "text-red-500" : ""}
                              >
                                <Heart className={`h-4 w-4 mr-1 ${post.user_has_liked ? "fill-current" : ""}`} />
                                {post.likes_count}
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleShowComments(post.id)}>
                                <MessageSquare className="h-4 w-4 mr-1" />
                                {post.comments_count}
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Share2 className="h-4 w-4 mr-1" />
                                Share
                              </Button>
                            </div>

                            {/* Comments Section */}
                            <AnimatePresence>
                              {selectedPost === post.id && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="mt-4 border-t pt-4"
                                >
                                  {/* Comments List */}
                                  <div className="space-y-3 mb-4">
                                    {comments[post.id]?.map((comment) => (
                                      <div key={comment.id} className="flex space-x-3">
                                        <Avatar className="h-8 w-8">
                                          <AvatarImage
                                            src={comment.author.avatar_url || "/placeholder-user.jpg"}
                                            alt={comment.author.username}
                                          />
                                          <AvatarFallback className="text-xs">
                                            {comment.author.full_name?.charAt(0) ||
                                              comment.author.username?.charAt(0) ||
                                              "U"}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 bg-muted/50 rounded-lg p-3">
                                          <div className="flex items-center space-x-2 mb-1">
                                            <span className="font-medium text-sm">
                                              {comment.author.full_name || comment.author.username}
                                            </span>
                                            <Badge className={`text-xs ${getTierColor(comment.author.tier)}`}>
                                              {comment.author.tier?.replace("_", " ").toUpperCase()}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground">
                                              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                            </span>
                                          </div>
                                          <p className="text-sm">{comment.content}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>

                                  {/* Add Comment */}
                                  <div className="flex space-x-3">
                                    <Avatar className="h-8 w-8">
                                      <AvatarImage
                                        src={profile.avatar_url || "/placeholder-user.jpg"}
                                        alt={profile.username}
                                      />
                                      <AvatarFallback className="text-xs">
                                        {profile.full_name?.charAt(0) || profile.username?.charAt(0) || "U"}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 flex space-x-2">
                                      <Textarea
                                        placeholder="Write a comment..."
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        className="min-h-[60px] text-sm"
                                        disabled={commenting}
                                      />
                                      <Button
                                        size="sm"
                                        onClick={() => handleCreateComment(post.id)}
                                        disabled={!newComment.trim() || commenting}
                                      >
                                        {commenting ? "..." : "Reply"}
                                      </Button>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>

          {posts.length === 0 && !loading && (
            <motion.div variants={postVariants} className="text-center py-12">
              <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No posts yet</h3>
              <p className="text-muted-foreground">Be the first to share something with the community!</p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
