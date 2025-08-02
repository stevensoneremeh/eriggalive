"use client"

import { AuthGuard } from "@/components/auth-guard"
import { useAuth } from "@/contexts/auth-context"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, Heart, Share2, Plus, TrendingUp, Crown, Send, MoreHorizontal } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"

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

export default function CommunityPage() {
  const { user, profile } = useAuth()
  const { toast } = useToast()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [newPostContent, setNewPostContent] = useState("")
  const [isCreatingPost, setIsCreatingPost] = useState(false)
  const [selectedPost, setSelectedPost] = useState<string | null>(null)
  const [comments, setComments] = useState<{ [key: string]: Comment[] }>({})
  const [newComment, setNewComment] = useState<{ [key: string]: string }>({})

  const fetchPosts = async () => {
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
          ),
          post_likes!left (
            user_id
          )
        `)
        .order("created_at", { ascending: false })

      if (error) throw error

      const postsWithLikes =
        data?.map((post) => ({
          ...post,
          likes_count: post.post_likes?.length || 0,
          user_has_liked: post.post_likes?.some((like: any) => like.user_id === profile?.id) || false,
          comments_count: 0, // We'll fetch this separately if needed
        })) || []

      setPosts(postsWithLikes)
    } catch (error) {
      console.error("Error fetching posts:", error)
      toast({
        title: "Error",
        description: "Failed to load community posts",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchComments = async (postId: string) => {
    try {
      const { data, error } = await supabase
        .from("post_comments")
        .select(`
          *,
          author:users!post_comments_author_id_fkey (
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

  const createPost = async () => {
    if (!newPostContent.trim() || !profile) return

    setIsCreatingPost(true)
    try {
      const { data, error } = await supabase
        .from("community_posts")
        .insert({
          content: newPostContent.trim(),
          author_id: profile.id,
        })
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
        .single()

      if (error) throw error

      const newPost = {
        ...data,
        likes_count: 0,
        comments_count: 0,
        user_has_liked: false,
      }

      setPosts((prev) => [newPost, ...prev])
      setNewPostContent("")
      toast({
        title: "Success",
        description: "Your post has been created!",
      })
    } catch (error) {
      console.error("Error creating post:", error)
      toast({
        title: "Error",
        description: "Failed to create post",
        variant: "destructive",
      })
    } finally {
      setIsCreatingPost(false)
    }
  }

  const toggleLike = async (postId: string) => {
    if (!profile) return

    const post = posts.find((p) => p.id === postId)
    if (!post) return

    try {
      if (post.user_has_liked) {
        // Unlike
        const { error } = await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", profile.id)

        if (error) throw error

        setPosts((prev) =>
          prev.map((p) => (p.id === postId ? { ...p, likes_count: p.likes_count - 1, user_has_liked: false } : p)),
        )
      } else {
        // Like
        const { error } = await supabase.from("post_likes").insert({
          post_id: postId,
          user_id: profile.id,
        })

        if (error) throw error

        setPosts((prev) =>
          prev.map((p) => (p.id === postId ? { ...p, likes_count: p.likes_count + 1, user_has_liked: true } : p)),
        )
      }
    } catch (error) {
      console.error("Error toggling like:", error)
      toast({
        title: "Error",
        description: "Failed to update like",
        variant: "destructive",
      })
    }
  }

  const addComment = async (postId: string) => {
    const commentContent = newComment[postId]
    if (!commentContent?.trim() || !profile) return

    try {
      const { data, error } = await supabase
        .from("post_comments")
        .insert({
          content: commentContent.trim(),
          post_id: postId,
          author_id: profile.id,
        })
        .select(`
          *,
          author:users!post_comments_author_id_fkey (
            id,
            username,
            full_name,
            avatar_url,
            tier
          )
        `)
        .single()

      if (error) throw error

      setComments((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), data],
      }))

      setNewComment((prev) => ({
        ...prev,
        [postId]: "",
      }))

      // Update comments count
      setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p)))

      toast({
        title: "Success",
        description: "Comment added!",
      })
    } catch (error) {
      console.error("Error adding comment:", error)
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      })
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

  useEffect(() => {
    fetchPosts()
  }, [profile])

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Community</h1>
            <p className="text-gray-600 dark:text-gray-300">Connect with fellow Erigga fans and share your thoughts</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3 space-y-6">
              {/* Create Post */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Plus className="w-5 h-5 mr-2" />
                    Share Your Thoughts
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={profile?.avatar_url || "/placeholder-user.jpg"} />
                      <AvatarFallback>
                        {profile?.full_name?.charAt(0) || profile?.username?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <Textarea
                        placeholder="What's on your mind?"
                        value={newPostContent}
                        onChange={(e) => setNewPostContent(e.target.value)}
                        className="min-h-[100px] resize-none"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={createPost} disabled={!newPostContent.trim() || isCreatingPost}>
                      {isCreatingPost ? "Posting..." : "Post"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Posts Feed */}
              <div className="space-y-6">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                    <p className="text-gray-600 dark:text-gray-300 mt-2">Loading posts...</p>
                  </div>
                ) : posts.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No posts yet</h3>
                      <p className="text-gray-600 dark:text-gray-300">
                        Be the first to share something with the community!
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  posts.map((post) => (
                    <Card key={post.id}>
                      <CardContent className="p-6">
                        {/* Post Header */}
                        <div className="flex items-start space-x-3 mb-4">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={post.author.avatar_url || "/placeholder-user.jpg"} />
                            <AvatarFallback>
                              {post.author.full_name?.charAt(0) || post.author.username?.charAt(0) || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-semibold text-gray-900 dark:text-white">
                                {post.author.full_name || post.author.username}
                              </h4>
                              <Badge className={`text-xs ${getTierColor(post.author.tier)}`}>
                                <Crown className="w-3 h-3 mr-1" />
                                {post.author.tier?.replace("_", " ").toUpperCase()}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              @{post.author.username} •{" "}
                              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                            </p>
                          </div>
                          {post.author_id === profile?.id && (
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          )}
                        </div>

                        {/* Post Content */}
                        <div className="mb-4">
                          <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{post.content}</p>
                        </div>

                        {/* Post Actions */}
                        <div className="flex items-center space-x-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleLike(post.id)}
                            className={`flex items-center space-x-2 ${
                              post.user_has_liked ? "text-red-500" : "text-gray-500"
                            }`}
                          >
                            <Heart className={`w-4 h-4 ${post.user_has_liked ? "fill-current" : ""}`} />
                            <span>{post.likes_count}</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (selectedPost === post.id) {
                                setSelectedPost(null)
                              } else {
                                setSelectedPost(post.id)
                                if (!comments[post.id]) {
                                  fetchComments(post.id)
                                }
                              }
                            }}
                            className="flex items-center space-x-2 text-gray-500"
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span>{post.comments_count}</span>
                          </Button>
                          <Button variant="ghost" size="sm" className="flex items-center space-x-2 text-gray-500">
                            <Share2 className="w-4 h-4" />
                            <span>Share</span>
                          </Button>
                        </div>

                        {/* Comments Section */}
                        {selectedPost === post.id && (
                          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                            {/* Add Comment */}
                            <div className="flex space-x-3 mb-4">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={profile?.avatar_url || "/placeholder-user.jpg"} />
                                <AvatarFallback>
                                  {profile?.full_name?.charAt(0) || profile?.username?.charAt(0) || "U"}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 flex space-x-2">
                                <Input
                                  placeholder="Write a comment..."
                                  value={newComment[post.id] || ""}
                                  onChange={(e) =>
                                    setNewComment((prev) => ({
                                      ...prev,
                                      [post.id]: e.target.value,
                                    }))
                                  }
                                  onKeyPress={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                      e.preventDefault()
                                      addComment(post.id)
                                    }
                                  }}
                                />
                                <Button
                                  size="sm"
                                  onClick={() => addComment(post.id)}
                                  disabled={!newComment[post.id]?.trim()}
                                >
                                  <Send className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>

                            {/* Comments List */}
                            <div className="space-y-4">
                              {comments[post.id]?.map((comment) => (
                                <div key={comment.id} className="flex space-x-3">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={comment.author.avatar_url || "/placeholder-user.jpg"} />
                                    <AvatarFallback>
                                      {comment.author.full_name?.charAt(0) || comment.author.username?.charAt(0) || "U"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                                      <div className="flex items-center space-x-2 mb-1">
                                        <span className="font-semibold text-sm text-gray-900 dark:text-white">
                                          {comment.author.full_name || comment.author.username}
                                        </span>
                                        <Badge className={`text-xs ${getTierColor(comment.author.tier)}`}>
                                          {comment.author.tier?.replace("_", " ").toUpperCase()}
                                        </Badge>
                                      </div>
                                      <p className="text-gray-900 dark:text-white text-sm">{comment.content}</p>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Community Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    Community Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Members</span>
                    <span className="font-semibold">1,234</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Posts Today</span>
                    <span className="font-semibold">{posts.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Active Now</span>
                    <span className="font-semibold">89</span>
                  </div>
                </CardContent>
              </Card>

              {/* Trending Topics */}
              <Card>
                <CardHeader>
                  <CardTitle>Trending Topics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">#EriggaLive</span>
                    <span className="text-xs text-gray-500">234 posts</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">#NewMusic</span>
                    <span className="text-xs text-gray-500">156 posts</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">#Community</span>
                    <span className="text-xs text-gray-500">89 posts</span>
                  </div>
                </CardContent>
              </Card>

              {/* Top Contributors */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Contributors</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>JD</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium">John Doe</p>
                      <p className="text-xs text-gray-500">45 posts</p>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-800">
                      <Crown className="w-3 h-3 mr-1" />
                      Elder
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
