"use client"

import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useAbly } from "@/contexts/ably-context"
import { createClient } from "@/lib/supabase/client"
import { Heart, MessageCircle, Share2, Bookmark, Send, Users, TrendingUp } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useToast } from "@/hooks/use-toast"

interface CommunityPost {
  id: string
  user_id: string
  title: string | null
  content: string
  media_url: string | null
  upvotes: number
  downvotes: number
  comments_count: number
  created_at: string
  user: {
    id: string
    username: string
    full_name: string | null
    avatar_url: string | null
    tier: string
  }
  has_voted?: boolean
}

export default function CommunityPage() {
  const { user, profile, isAuthenticated, isLoading } = useAuth()
  const { client: ablyClient, isConnected } = useAbly()
  const router = useRouter()
  const { toast } = useToast()
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [newPostContent, setNewPostContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadingPosts, setLoadingPosts] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login")
      return
    }
  }, [isAuthenticated, isLoading, router])

  useEffect(() => {
    if (isAuthenticated) {
      fetchPosts()
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (ablyClient && isConnected) {
      const channel = ablyClient.channels.get("community-posts")

      channel.subscribe("new-post", (message) => {
        const newPost = message.data as CommunityPost
        setPosts((prev) => [newPost, ...prev])
      })

      channel.subscribe("post-voted", (message) => {
        const { postId, upvotes, downvotes } = message.data
        setPosts((prev) => prev.map((post) => (post.id === postId ? { ...post, upvotes, downvotes } : post)))
      })

      return () => {
        channel.unsubscribe()
      }
    }
  }, [ablyClient, isConnected])

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from("community_posts")
        .select(`
          *,
          user:users(id, username, full_name, avatar_url, tier)
        `)
        .eq("is_published", true)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false })
        .limit(20)

      if (error) {
        console.error("Error fetching posts:", error)
        toast({
          title: "Error",
          description: "Failed to load posts",
          variant: "destructive",
        })
        return
      }

      setPosts(data || [])
    } catch (error) {
      console.error("Error fetching posts:", error)
    } finally {
      setLoadingPosts(false)
    }
  }

  const createPost = async () => {
    if (!newPostContent.trim() || !profile) return

    setIsSubmitting(true)
    try {
      const { data, error } = await supabase
        .from("community_posts")
        .insert({
          user_id: profile.id,
          content: newPostContent.trim(),
        })
        .select(`
          *,
          user:users(id, username, full_name, avatar_url, tier)
        `)
        .single()

      if (error) {
        console.error("Error creating post:", error)
        toast({
          title: "Error",
          description: "Failed to create post",
          variant: "destructive",
        })
        return
      }

      // Publish to Ably
      if (ablyClient && isConnected) {
        const channel = ablyClient.channels.get("community-posts")
        await channel.publish("new-post", data)
      }

      setNewPostContent("")
      toast({
        title: "Success",
        description: "Post created successfully!",
      })
    } catch (error) {
      console.error("Error creating post:", error)
      toast({
        title: "Error",
        description: "Failed to create post",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const votePost = async (postId: string, voteType: "upvote" | "downvote") => {
    if (!profile) return

    try {
      // Check if user already voted
      const { data: existingVote } = await supabase
        .from("community_post_votes")
        .select("vote_type")
        .eq("post_id", postId)
        .eq("user_id", profile.id)
        .single()

      if (existingVote) {
        if (existingVote.vote_type === voteType) {
          // Remove vote
          await supabase.from("community_post_votes").delete().eq("post_id", postId).eq("user_id", profile.id)
        } else {
          // Update vote
          await supabase
            .from("community_post_votes")
            .update({ vote_type: voteType })
            .eq("post_id", postId)
            .eq("user_id", profile.id)
        }
      } else {
        // Create new vote
        await supabase.from("community_post_votes").insert({
          post_id: postId,
          user_id: profile.id,
          vote_type: voteType,
        })
      }

      // Get updated vote counts
      const { data: updatedPost } = await supabase
        .from("community_posts")
        .select("upvotes, downvotes")
        .eq("id", postId)
        .single()

      if (updatedPost && ablyClient && isConnected) {
        const channel = ablyClient.channels.get("community-posts")
        await channel.publish("post-voted", {
          postId,
          upvotes: updatedPost.upvotes,
          downvotes: updatedPost.downvotes,
        })
      }
    } catch (error) {
      console.error("Error voting on post:", error)
      toast({
        title: "Error",
        description: "Failed to vote on post",
        variant: "destructive",
      })
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case "blood_brotherhood":
      case "blood":
        return "bg-red-500"
      case "elder":
        return "bg-purple-500"
      case "pioneer":
        return "bg-blue-500"
      case "grassroot":
        return "bg-green-500"
      case "admin":
        return "bg-gray-800"
      default:
        return "bg-gray-500"
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading community...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            Erigga Community
          </h1>
          <p className="text-muted-foreground text-lg">Connect, share, and engage with fellow fans</p>
          <div className="flex justify-center gap-8 mt-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              {posts.length} Posts
            </span>
            <span className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Real-time Updates
            </span>
            {isConnected && (
              <span className="flex items-center gap-2 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Live
              </span>
            )}
          </div>
        </div>

        <div className="max-w-2xl mx-auto space-y-6">
          {/* Create Post */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Share with the community</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={profile?.avatar_url || "/placeholder-user.jpg"} />
                  <AvatarFallback>{profile?.username?.charAt(0).toUpperCase()}</AvatarFallback>
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
              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">{newPostContent.length}/500 characters</div>
                <Button
                  onClick={createPost}
                  disabled={!newPostContent.trim() || isSubmitting}
                  className="bg-gradient-to-r from-blue-600 to-purple-600"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Posting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Post
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Posts Feed */}
          {loadingPosts ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading posts...</p>
            </div>
          ) : posts.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
                <p className="text-muted-foreground">Be the first to share something with the community!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {posts.map((post) => (
                <Card key={post.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={post.user.avatar_url || "/placeholder-user.jpg"} />
                        <AvatarFallback>{post.user.username.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-semibold">{post.user.full_name || post.user.username}</span>
                          <span className="text-muted-foreground">@{post.user.username}</span>
                          <Badge className={`text-xs px-2 py-0.5 ${getTierColor(post.user.tier)} text-white`}>
                            {post.user.tier}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                          </span>
                        </div>

                        {post.title && <h3 className="font-semibold text-lg mb-2">{post.title}</h3>}

                        <p className="text-foreground mb-4 whitespace-pre-wrap">{post.content}</p>

                        {post.media_url && (
                          <div className="mb-4">
                            <img
                              src={post.media_url || "/placeholder.svg"}
                              alt="Post media"
                              className="rounded-lg max-w-full h-auto"
                            />
                          </div>
                        )}

                        <div className="flex items-center space-x-6 text-muted-foreground">
                          <button
                            onClick={() => votePost(post.id, "upvote")}
                            className="flex items-center space-x-2 hover:text-red-500 transition-colors"
                          >
                            <Heart className="h-4 w-4" />
                            <span>{post.upvotes}</span>
                          </button>

                          <button className="flex items-center space-x-2 hover:text-blue-500 transition-colors">
                            <MessageCircle className="h-4 w-4" />
                            <span>{post.comments_count}</span>
                          </button>

                          <button className="flex items-center space-x-2 hover:text-green-500 transition-colors">
                            <Share2 className="h-4 w-4" />
                            <span>Share</span>
                          </button>

                          <button className="flex items-center space-x-2 hover:text-yellow-500 transition-colors">
                            <Bookmark className="h-4 w-4" />
                            <span>Save</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
