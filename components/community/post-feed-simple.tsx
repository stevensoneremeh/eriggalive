"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Heart, MessageCircle, Share2, MoreHorizontal } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/components/ui/use-toast"

interface Post {
  id: number
  content: string
  media_url?: string
  media_type?: string
  vote_count: number
  created_at: string
  user: {
    id: number
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
  has_voted?: boolean
}

interface PostFeedSimpleProps {
  refreshTrigger?: number
}

export function PostFeedSimple({ refreshTrigger }: PostFeedSimpleProps) {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const { toast } = useToast()

  const loadPosts = async () => {
    try {
      const response = await fetch("/api/community/posts")
      const result = await response.json()

      if (result.success) {
        setPosts(result.posts)
      } else {
        console.error("Failed to load posts:", result.error)
      }
    } catch (error) {
      console.error("Error loading posts:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPosts()
  }, [refreshTrigger])

  const handleVote = async (postId: number, postCreatorId: number) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to vote on posts.",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/community/posts/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, postCreatorId }),
      })

      const result = await response.json()

      if (result.success) {
        // Update the post optimistically
        setPosts((prevPosts) =>
          prevPosts.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  vote_count: result.voted ? post.vote_count + 1 : post.vote_count - 1,
                  has_voted: result.voted,
                }
              : post,
          ),
        )

        toast({
          title: result.voted ? "Vote Added!" : "Vote Removed",
          description: result.voted ? "You voted on this post." : "Your vote was removed.",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to vote.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Vote error:", error)
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return "Just now"
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    return `${Math.floor(diffInSeconds / 86400)}d ago`
  }

  const getTierColor = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case "blood":
        return "bg-red-500"
      case "elder":
        return "bg-purple-500"
      case "pioneer":
        return "bg-blue-500"
      case "grassroot":
        return "bg-green-500"
      case "mod":
        return "bg-orange-500"
      case "admin":
        return "bg-gray-900"
      default:
        return "bg-gray-500"
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4">Latest in the Community</h2>
        </div>
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="h-12 w-12 bg-muted rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/4" />
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Latest in the Community</h2>
        <p className="text-muted-foreground">Join the conversation and share your thoughts</p>
      </div>

      {posts.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground text-lg">No posts yet. Be the first to share something!</p>
          </CardContent>
        </Card>
      ) : (
        posts.map((post) => (
          <Card key={post.id} className="shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={post.user.avatar_url || "/placeholder-user.jpg"} alt={post.user.username} />
                  <AvatarFallback>{post.user.username?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="font-semibold text-sm">{post.user.full_name || post.user.username}</h3>
                    <Badge className={`text-xs ${getTierColor(post.user.tier)} text-white`}>{post.user.tier}</Badge>
                    <Badge variant="outline" className="text-xs">
                      {post.category.name}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{formatTimeAgo(post.created_at)}</span>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
                  </div>

                  {/* Media Display */}
                  {post.media_url && (
                    <div className="mb-4 rounded-lg overflow-hidden border">
                      {post.media_type === "image" && (
                        <img
                          src={post.media_url || "/placeholder.svg"}
                          alt="Post media"
                          className="w-full h-auto max-h-96 object-contain"
                        />
                      )}
                      {post.media_type === "video" && (
                        <video src={post.media_url} controls className="w-full h-auto max-h-96" />
                      )}
                      {post.media_type === "audio" && (
                        <div className="p-4 bg-muted/50">
                          <audio src={post.media_url} controls className="w-full" />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center space-x-4 pt-2 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleVote(post.id, post.user.id)}
                      className={`flex items-center space-x-1 ${post.has_voted ? "text-red-500" : ""}`}
                    >
                      <Heart className={`h-4 w-4 ${post.has_voted ? "fill-current" : ""}`} />
                      <span>{post.vote_count}</span>
                    </Button>

                    <Button variant="ghost" size="sm" className="flex items-center space-x-1">
                      <MessageCircle className="h-4 w-4" />
                      <span>Comment</span>
                    </Button>

                    <Button variant="ghost" size="sm" className="flex items-center space-x-1">
                      <Share2 className="h-4 w-4" />
                      <span>Share</span>
                    </Button>

                    <Button variant="ghost" size="sm" className="ml-auto">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
