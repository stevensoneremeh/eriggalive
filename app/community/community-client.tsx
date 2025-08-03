"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { MessageCircle, Heart, Share2, Plus, TrendingUp, Crown, Send, MoreHorizontal } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"
import type { Session, User } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

type Profile = Database["public"]["Tables"]["users"]["Row"]

interface Post {
  id: number
  content: string
  created_at: string
  updated_at: string
  user_id: number
  category_id: number
  vote_count: number
  comment_count: number
  user: {
    id: number
    username: string
    full_name: string | null
    avatar_url: string | null
    tier: string
  }
  user_has_voted: boolean
}

interface Comment {
  id: number
  content: string
  created_at: string
  user_id: number
  post_id: number
  user: {
    id: number
    username: string
    full_name: string | null
    avatar_url: string | null
    tier: string
  }
}

interface CommunityClientProps {
  initialAuthData: {
    session: Session
    user: User
    profile: Profile | null
  }
}

export function CommunityClient({ initialAuthData }: CommunityClientProps) {
  const { profile } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [newPostContent, setNewPostContent] = useState("")
  const [isCreatingPost, setIsCreatingPost] = useState(false)
  const [selectedPost, setSelectedPost] = useState<number | null>(null)
  const [comments, setComments] = useState<{ [key: number]: Comment[] }>({})
  const [newComment, setNewComment] = useState<{ [key: number]: string }>({})
  const supabase = createClient()

  const currentProfile = profile || initialAuthData.profile

  useEffect(() => {
    if (currentProfile) {
      fetchPosts()
      setupRealtimeSubscription()
    }
  }, [currentProfile])

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel("community-listener")
      .on("postgres_changes", { event: "*", schema: "public", table: "community_posts" }, (payload) => {
        if (payload.eventType === "INSERT") {
          fetchPostWithUser(payload.new.id).then((newPost) => {
            if (newPost) {
              setPosts((prev) => [newPost, ...prev])
              toast.success("New post added!")
            }
          })
        } else if (payload.eventType === "UPDATE") {
          setPosts((prev) => prev.map((post) => (post.id === payload.new.id ? { ...post, ...payload.new } : post)))
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const fetchPostWithUser = async (postId: number) => {
    try {
      const { data, error } = await supabase
        .from("community_posts")
        .select(`
          *,
          user:users!community_posts_user_id_fkey (
            id,
            username,
            full_name,
            avatar_url,
            tier
          ),
          community_votes!left (
            user_id
          )
        `)
        .eq("id", postId)
        .single()

      if (error) throw error

      return {
        ...data,
        user_has_voted: data.community_votes?.some((vote: any) => vote.user_id === currentProfile?.id) || false,
      }
    } catch (error) {
      console.error("Error fetching post:", error)
      return null
    }
  }

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from("community_posts")
        .select(`
          *,
          user:users!community_posts_user_id_fkey (
            id,
            username,
            full_name,
            avatar_url,
            tier
          ),
          community_votes!left (
            user_id
          )
        `)
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(20)

      if (error) throw error

      const postsWithVotes =
        data?.map((post) => ({
          ...post,
          user_has_voted: post.community_votes?.some((vote: any) => vote.user_id === currentProfile?.id) || false,
        })) || []

      setPosts(postsWithVotes)
    } catch (error) {
      console.error("Error fetching posts:", error)
      toast.error("Failed to load community posts")
    } finally {
      setLoading(false)
    }
  }

  const fetchComments = async (postId: number) => {
    try {
      const { data, error } = await supabase
        .from("community_comments")
        .select(`
          *,
          user:users!community_comments_user_id_fkey (
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
    if (!newPostContent.trim() || !currentProfile) return

    setIsCreatingPost(true)
    try {
      const { data, error } = await supabase
        .from("community_posts")
        .insert({
          content: newPostContent.trim(),
          user_id: currentProfile.id,
          category_id: 1,
          is_published: true,
        })
        .select(`
          *,
          user:users!community_posts_user_id_fkey (
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
        user_has_voted: false,
      }

      setPosts((prev) => [newPost, ...prev])
      setNewPostContent("")
      toast.success("Your post has been created!")
    } catch (error) {
      console.error("Error creating post:", error)
      toast.error("Failed to create post")
    } finally {
      setIsCreatingPost(false)
    }
  }

  const toggleVote = async (postId: number) => {
    if (!currentProfile) return

    const post = posts.find((p) => p.id === postId)
    if (!post) return

    try {
      if (post.user_has_voted) {
        const { error } = await supabase
          .from("community_votes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", currentProfile.id)

        if (error) throw error

        setPosts((prev) =>
          prev.map((p) => (p.id === postId ? { ...p, vote_count: p.vote_count - 1, user_has_voted: false } : p)),
        )
      } else {
        const { error } = await supabase.from("community_votes").insert({
          post_id: postId,
          user_id: currentProfile.id,
          vote_type: "up",
        })

        if (error) throw error

        setPosts((prev) =>
          prev.map((p) => (p.id === postId ? { ...p, vote_count: p.vote_count + 1, user_has_voted: true } : p)),
        )
      }
    } catch (error) {
      console.error("Error toggling vote:", error)
      toast.error("Failed to update vote")
    }
  }

  const addComment = async (postId: number) => {
    const commentContent = newComment[postId]
    if (!commentContent?.trim() || !currentProfile) return

    try {
      const { data, error } = await supabase
        .from("community_comments")
        .insert({
          content: commentContent.trim(),
          post_id: postId,
          user_id: currentProfile.id,
        })
        .select(`
          *,
          user:users!community_comments_user_id_fkey (
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

      setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, comment_count: p.comment_count + 1 } : p)))

      toast.success("Comment added!")
    } catch (error) {
      console.error("Error adding comment:", error)
      toast.error("Failed to add comment")
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

  if (!currentProfile) {
    return <CommunitySkeleton />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Community</h1>
          <p className="text-gray-600 dark:text-gray-300">Connect with fellow Erigga fans and share your thoughts</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-6">
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
                    <AvatarImage src={currentProfile?.avatar_url || "/placeholder-user.jpg"} />
                    <AvatarFallback>
                      {currentProfile?.full_name?.charAt(0) || currentProfile?.username?.charAt(0) || "U"}
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

            <div className="space-y-6">
              {loading ? (
                <PostsSkeleton />
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
                      <div className="flex items-start space-x-3 mb-4">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={post.user.avatar_url || "/placeholder-user.jpg"} />
                          <AvatarFallback>
                            {post.user.full_name?.charAt(0) || post.user.username?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                              {post.user.full_name || post.user.username}
                            </h4>
                            <Badge className={`text-xs ${getTierColor(post.user.tier)}`}>
                              <Crown className="w-3 h-3 mr-1" />
                              {post.user.tier?.replace("_", " ").toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            @{post.user.username} •{" "}
                            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                          </p>
                        </div>
                        {post.user_id === currentProfile?.id && (
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        )}
                      </div>

                      <div className="mb-4">
                        <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{post.content}</p>
                      </div>

                      <div className="flex items-center space-x-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleVote(post.id)}
                          className={`flex items-center space-x-2 ${
                            post.user_has_voted ? "text-red-500" : "text-gray-500"
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${post.user_has_voted ? "fill-current" : ""}`} />
                          <span>{post.vote_count}</span>
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
                          <span>{post.comment_count}</span>
                        </Button>
                        <Button variant="ghost" size="sm" className="flex items-center space-x-2 text-gray-500">
                          <Share2 className="w-4 h-4" />
                          <span>Share</span>
                        </Button>
                      </div>

                      {selectedPost === post.id && (
                        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex space-x-3 mb-4">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={currentProfile?.avatar_url || "/placeholder-user.jpg"} />
                              <AvatarFallback>
                                {currentProfile?.full_name?.charAt(0) || currentProfile?.username?.charAt(0) || "U"}
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

                          <div className="space-y-4">
                            {comments[post.id]?.map((comment) => (
                              <div key={comment.id} className="flex space-x-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={comment.user.avatar_url || "/placeholder-user.jpg"} />
                                  <AvatarFallback>
                                    {comment.user.full_name?.charAt(0) || comment.user.username?.charAt(0) || "U"}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                                    <div className="flex items-center space-x-2 mb-1">
                                      <span className="font-semibold text-sm text-gray-900 dark:text-white">
                                        {comment.user.full_name || comment.user.username}
                                      </span>
                                      <Badge className={`text-xs ${getTierColor(comment.user.tier)}`}>
                                        {comment.user.tier?.replace("_", " ").toUpperCase()}
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

          <div className="space-y-6">
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
  )
}

function CommunitySkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-8">
          <Skeleton className="h-9 w-48 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex space-x-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <Skeleton className="flex-1 h-24" />
                </div>
                <div className="flex justify-end">
                  <Skeleton className="h-9 w-16" />
                </div>
              </CardContent>
            </Card>

            <PostsSkeleton />
          </div>

          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent className="space-y-4">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div key={j} className="flex justify-between items-center">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-8" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function PostsSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="flex items-start space-x-3 mb-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-8 w-8" />
            </div>

            <div className="mb-4">
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </div>

            <div className="flex items-center space-x-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-16" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
