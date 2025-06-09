"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Heart,
  MessageCircle,
  Share2,
  Crown,
  Star,
  Shield,
  Mic,
  Trophy,
  Users,
  Send,
  ImageIcon,
  MoreHorizontal,
  Reply,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { createClient } from "@/lib/supabase/client"
import type { Post, User, Comment } from "@/types/database"

const tierIcons = {
  street_rep: Star,
  warri_elite: Crown,
  erigma_circle: Shield,
}

const tierColors = {
  street_rep: "text-gray-400",
  warri_elite: "text-orange-500",
  erigma_circle: "text-gold-400",
}

interface PostWithUser extends Post {
  user: User
  user_has_liked: boolean
}

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState("feed")
  const [newPost, setNewPost] = useState("")
  const [posts, setPosts] = useState<PostWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPost, setSelectedPost] = useState<PostWithUser | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [postType, setPostType] = useState<"general" | "bars" | "story" | "event">("general")
  const { user, profile } = useAuth()
  const supabase = createClient()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (user) {
      fetchPosts()

      // Set up real-time subscription for posts
      const postsSubscription = supabase
        .channel("posts_channel")
        .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, (payload) => {
          console.log("Post change received!", payload)
          fetchPosts() // Refresh posts when changes occur
        })
        .subscribe()

      return () => {
        supabase.removeChannel(postsSubscription)
      }
    }
  }, [user])

  useEffect(() => {
    if (selectedPost) {
      fetchComments(selectedPost.id)

      // Set up real-time subscription for comments
      const commentsSubscription = supabase
        .channel(`comments_${selectedPost.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "comments",
            filter: `post_id=eq.${selectedPost.id}`,
          },
          (payload) => {
            console.log("Comment change received!", payload)
            fetchComments(selectedPost.id)
          },
        )
        .subscribe()

      return () => {
        supabase.removeChannel(commentsSubscription)
      }
    }
  }, [selectedPost])

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from("posts")
        .select(`
          *,
          user:users(*)
        `)
        .order("created_at", { ascending: false })

      if (error) throw error

      // Check which posts the current user has liked
      const postsWithLikes = await Promise.all(
        (data || []).map(async (post) => {
          const { data: likeData } = await supabase
            .from("post_likes")
            .select("id")
            .eq("post_id", post.id)
            .eq("user_id", profile?.id)
            .single()

          return {
            ...post,
            user_has_liked: !!likeData,
          }
        }),
      )

      setPosts(postsWithLikes)
    } catch (error) {
      console.error("Error fetching posts:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchComments = async (postId: number) => {
    try {
      const { data, error } = await supabase
        .from("comments")
        .select(`
          *,
          user:users(*)
        `)
        .eq("post_id", postId)
        .order("created_at", { ascending: true })

      if (error) throw error
      setComments(data || [])
    } catch (error) {
      console.error("Error fetching comments:", error)
    }
  }

  const createPost = async () => {
    if (!newPost.trim() || !profile) return

    try {
      const { data, error } = await supabase
        .from("posts")
        .insert({
          user_id: profile.id,
          content: newPost,
          type: postType,
          like_count: 0,
          comment_count: 0,
          is_featured: false,
        })
        .select()

      if (error) throw error

      setNewPost("")
      setPostType("general")
      fetchPosts() // Refresh posts
    } catch (error) {
      console.error("Error creating post:", error)
    }
  }

  const toggleLike = async (postId: number) => {
    if (!profile) return

    try {
      const post = posts.find((p) => p.id === postId)
      if (!post) return

      if (post.user_has_liked) {
        // Unlike
        await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", profile.id)

        // Update like count
        await supabase
          .from("posts")
          .update({ like_count: Math.max(0, post.like_count - 1) })
          .eq("id", postId)
      } else {
        // Like
        await supabase.from("post_likes").insert({
          post_id: postId,
          user_id: profile.id,
        })

        // Update like count
        await supabase
          .from("posts")
          .update({ like_count: post.like_count + 1 })
          .eq("id", postId)
      }

      // Update local state immediately for better UX
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                user_has_liked: !p.user_has_liked,
                like_count: p.user_has_liked ? p.like_count - 1 : p.like_count + 1,
              }
            : p,
        ),
      )
    } catch (error) {
      console.error("Error toggling like:", error)
    }
  }

  const addComment = async () => {
    if (!newComment.trim() || !profile || !selectedPost) return

    try {
      const { data, error } = await supabase
        .from("comments")
        .insert({
          post_id: selectedPost.id,
          user_id: profile.id,
          content: newComment,
        })
        .select()

      if (error) throw error

      setNewComment("")

      // Update comment count in posts
      await supabase
        .from("posts")
        .update({ comment_count: selectedPost.comment_count + 1 })
        .eq("id", selectedPost.id)

      setPosts((prev) => prev.map((p) => (p.id === selectedPost.id ? { ...p, comment_count: p.comment_count + 1 } : p)))
    } catch (error) {
      console.error("Error adding comment:", error)
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    return `${Math.floor(diffInSeconds / 86400)}d ago`
  }

  const getPostTypeColor = (type: string) => {
    switch (type) {
      case "bars":
        return "text-orange-500 border-orange-500"
      case "story":
        return "text-gold-400 border-gold-400"
      case "event":
        return "text-green-500 border-green-500"
      default:
        return "text-blue-500 border-blue-500"
    }
  }

  const getPostTypeIcon = (type: string) => {
    switch (type) {
      case "bars":
        return Mic
      case "story":
        return Users
      case "event":
        return Trophy
      default:
        return MessageCircle
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen py-8 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="font-street text-4xl md:text-6xl text-gradient mb-4">THE COMMUNITY</h1>
          <p className="text-muted-foreground mb-8">Sign in to join the conversation</p>
          <Button asChild className="bg-orange-500 hover:bg-orange-600 text-black">
            <a href="/login">Sign In</a>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="font-street text-4xl md:text-6xl text-gradient mb-4">THE COMMUNITY</h1>
          <p className="text-muted-foreground">Where real fans connect, share, and celebrate the culture</p>
        </div>

        {/* Post Creation */}
        <Card className="mb-8 bg-card/50 border-orange-500/20">
          <CardContent className="p-6">
            <div className="flex gap-4">
              <Avatar className="h-10 w-10 border-2 border-orange-500">
                <AvatarImage src={profile?.avatar_url || "/placeholder.svg"} />
                <AvatarFallback>{profile?.username?.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-4">
                <Textarea
                  placeholder="Drop your bars, share your story, or start a discussion..."
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  className="min-h-[100px] bg-background/50 border-orange-500/20"
                />
                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    <Badge
                      variant={postType === "general" ? "default" : "outline"}
                      className={`cursor-pointer ${postType === "general" ? "bg-blue-500" : "border-blue-500 text-blue-500"}`}
                      onClick={() => setPostType("general")}
                    >
                      <MessageCircle className="h-3 w-3 mr-1" />
                      General
                    </Badge>
                    <Badge
                      variant={postType === "bars" ? "default" : "outline"}
                      className={`cursor-pointer ${postType === "bars" ? "bg-orange-500" : "border-orange-500 text-orange-500"}`}
                      onClick={() => setPostType("bars")}
                    >
                      <Mic className="h-3 w-3 mr-1" />
                      Bars
                    </Badge>
                    <Badge
                      variant={postType === "story" ? "default" : "outline"}
                      className={`cursor-pointer ${postType === "story" ? "bg-gold-400" : "border-gold-400 text-gold-400"}`}
                      onClick={() => setPostType("story")}
                    >
                      <Users className="h-3 w-3 mr-1" />
                      Story
                    </Badge>
                    <Badge
                      variant={postType === "event" ? "default" : "outline"}
                      className={`cursor-pointer ${postType === "event" ? "bg-green-500" : "border-green-500 text-green-500"}`}
                      onClick={() => setPostType("event")}
                    >
                      <Trophy className="h-3 w-3 mr-1" />
                      Event
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <ImageIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      className="bg-orange-500 hover:bg-orange-600 text-black"
                      onClick={createPost}
                      disabled={!newPost.trim()}
                    >
                      <Send className="h-4 w-4 mr-1" />
                      Post
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Community Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-card/50 border border-orange-500/20">
            <TabsTrigger value="feed" className="data-[state=active]:bg-orange-500 data-[state=active]:text-black">
              Real Talk
            </TabsTrigger>
            <TabsTrigger value="bars" className="data-[state=active]:bg-orange-500 data-[state=active]:text-black">
              Bars & Battles
            </TabsTrigger>
            <TabsTrigger value="events" className="data-[state=active]:bg-orange-500 data-[state=active]:text-black">
              Event Gist
            </TabsTrigger>
            <TabsTrigger value="premium" className="data-[state=active]:bg-gold-400 data-[state=active]:text-black">
              Premium Lounge
            </TabsTrigger>
          </TabsList>

          <TabsContent value="feed" className="space-y-6 mt-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                <p className="text-muted-foreground mt-2">Loading posts...</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No posts yet. Be the first to share something!</p>
              </div>
            ) : (
              posts.map((post) => {
                const TierIcon = tierIcons[post.user.tier]
                const tierColor = tierColors[post.user.tier]
                const PostTypeIcon = getPostTypeIcon(post.type)

                return (
                  <Card
                    key={post.id}
                    className="bg-card/50 border-orange-500/20 hover:border-orange-500/40 transition-all"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Avatar className="h-10 w-10 border-2 border-orange-500">
                              <AvatarImage src={post.user.avatar_url || "/placeholder.svg"} />
                              <AvatarFallback>{post.user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-orange-500 flex items-center justify-center">
                              <TierIcon className={`h-2.5 w-2.5 ${tierColor}`} />
                            </div>
                          </div>
                          <div>
                            <p className="font-semibold">{post.user.username}</p>
                            <p className="text-xs text-muted-foreground">
                              {post.user.tier.replace("_", " ")} • Level {post.user.level} •{" "}
                              {formatTimeAgo(post.created_at)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={getPostTypeColor(post.type)}>
                            <PostTypeIcon className="h-3 w-3 mr-1" />
                            {post.type}
                          </Badge>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-4 whitespace-pre-wrap">{post.content}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`${post.user_has_liked ? "text-red-500" : "text-muted-foreground"} hover:text-red-500`}
                            onClick={() => toggleLike(post.id)}
                          >
                            <Heart className={`h-4 w-4 mr-1 ${post.user_has_liked ? "fill-red-500" : ""}`} />
                            {post.like_count}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-orange-500"
                            onClick={() => setSelectedPost(post)}
                          >
                            <MessageCircle className="h-4 w-4 mr-1" />
                            {post.comment_count}
                          </Button>
                          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-orange-500">
                            <Share2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-orange-500">
                          <Reply className="h-4 w-4 mr-1" />
                          Reply
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </TabsContent>

          <TabsContent value="bars" className="space-y-6 mt-6">
            <Card className="bg-card/50 border-orange-500/20">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-gold-400" />
                  <h3 className="font-bold text-gold-400">Weekly Bars Battle</h3>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Drop your best 16 bars. Winner gets exclusive merch and shoutout from Erigga!
                </p>
                <Button className="bg-orange-500 hover:bg-orange-600 text-black">Join Battle</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events" className="space-y-6 mt-6">
            <Card className="bg-card/50 border-orange-500/20">
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground">
                  Event discussions and meetup planning coming soon...
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="premium" className="space-y-6 mt-6">
            <Card className="bg-gradient-to-br from-gold-400/20 to-orange-500/20 border-gold-400/40">
              <CardContent className="p-6 text-center">
                <Crown className="h-12 w-12 text-gold-400 mx-auto mb-4" />
                <h3 className="font-bold text-xl mb-2">Premium Lounge</h3>
                <p className="text-muted-foreground mb-4">Exclusive access for Warri Elite and Erigma Circle members</p>
                <Button className="bg-gold-400 hover:bg-gold-500 text-black">Upgrade to Access</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Comments Modal */}
        {selectedPost && (
          <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
            <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>Comments</DialogTitle>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto space-y-4">
                {/* Original Post */}
                <Card className="bg-background/50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={selectedPost.user.avatar_url || "/placeholder.svg"} />
                        <AvatarFallback>{selectedPost.user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-sm">{selectedPost.user.username}</p>
                        <p className="text-xs text-muted-foreground">{formatTimeAgo(selectedPost.created_at)}</p>
                      </div>
                    </div>
                    <p className="text-sm">{selectedPost.content}</p>
                  </CardContent>
                </Card>

                {/* Comments */}
                <div className="space-y-3">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3 p-3 bg-background/30 rounded-lg">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={comment.user?.avatar_url || "/placeholder.svg"} />
                        <AvatarFallback>{comment.user?.username?.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-sm">{comment.user?.username}</p>
                          <p className="text-xs text-muted-foreground">{formatTimeAgo(comment.created_at)}</p>
                        </div>
                        <p className="text-sm">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div ref={messagesEndRef} />
              </div>

              {/* Comment Input */}
              <div className="flex gap-2 pt-4 border-t">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile?.avatar_url || "/placeholder.svg"} />
                  <AvatarFallback>{profile?.username?.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 flex gap-2">
                  <Input
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addComment()}
                    className="flex-1"
                  />
                  <Button
                    size="sm"
                    onClick={addComment}
                    disabled={!newComment.trim()}
                    className="bg-orange-500 hover:bg-orange-600 text-black"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  )
}
