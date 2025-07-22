"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { MessageCircle, Share, Bookmark, MoreHorizontal, ChevronUp, ChevronDown } from "lucide-react"
import { subscribeToChannel, publishEvent, ABLY_CHANNELS } from "@/lib/ably"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface CommunityPost {
  id: number
  content: string
  media_url?: string
  media_type?: string
  vote_count: number
  comment_count: number
  created_at: string
  has_voted?: boolean
  user: {
    id: number
    username: string
    full_name: string
    avatar_url: string | null
    tier: string
  }
  category?: {
    id: number
    name: string
    slug: string
    color?: string
    icon?: string
  }
}

interface RealtimeCommunityFeedProps {
  initialPosts: CommunityPost[]
}

export function RealtimeCommunityFeed({ initialPosts }: RealtimeCommunityFeedProps) {
  const { profile, isAuthenticated } = useAuth()
  const [posts, setPosts] = useState<CommunityPost[]>(initialPosts)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) return

    // Subscribe to community feed updates
    const unsubscribe = subscribeToChannel(ABLY_CHANNELS.COMMUNITY_FEED, "post:created", (message) => {
      const newPost = message.data.post
      setPosts((prev) => [newPost, ...prev])
      toast.success("New post added!")
    })

    setIsConnected(true)

    return () => {
      unsubscribe()
      setIsConnected(false)
    }
  }, [isAuthenticated])

  const handleVote = async (postId: number) => {
    if (!isAuthenticated || !profile) {
      toast.error("Please sign in to vote")
      return
    }

    try {
      const response = await fetch("/api/community/posts/vote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ postId }),
      })

      const result = await response.json()

      if (result.success) {
        setPosts((prev) =>
          prev.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  has_voted: result.voted,
                  vote_count: post.vote_count + (result.voted ? 1 : -1),
                }
              : post,
          ),
        )

        toast.success(result.message)

        // Publish real-time vote update
        await publishEvent(ABLY_CHANNELS.POST_VOTES(postId), "vote:updated", {
          postId,
          voted: result.voted,
          userId: profile.id,
        })
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      console.error("Vote error:", error)
      toast.error("Failed to vote")
    }
  }

  const handleBookmark = async (postId: number) => {
    if (!isAuthenticated) {
      toast.error("Please sign in to bookmark posts")
      return
    }

    try {
      const response = await fetch(`/api/community/posts/${postId}/bookmark`, {
        method: "POST",
      })

      const result = await response.json()

      if (result.success) {
        toast.success(result.message)
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      console.error("Bookmark error:", error)
      toast.error("Failed to bookmark post")
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case "blood":
        return "bg-red-500 text-white"
      case "elder":
        return "bg-purple-500 text-white"
      case "pioneer":
        return "bg-blue-500 text-white"
      case "grassroot":
        return "bg-green-500 text-white"
      default:
        return "bg-gray-500 text-white"
    }
  }

  if (posts.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
          <p className="text-muted-foreground">Be the first to start a conversation in the community!</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {isConnected && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          Live updates enabled
        </div>
      )}

      {posts.map((post) => (
        <Card key={post.id} className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={post.user.avatar_url || "/placeholder-user.jpg"} />
                  <AvatarFallback>{post.user.username.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{post.user.username}</span>
                    <Badge className={cn("text-xs", getTierColor(post.user.tier))}>{post.user.tier}</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                    {post.category && (
                      <>
                        <span>•</span>
                        <Badge variant="outline" className="text-xs">
                          {post.category.name}
                        </Badge>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            <div className="space-y-4">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>

              {post.media_url && (
                <div className="rounded-lg overflow-hidden">
                  {post.media_type === "image" && (
                    <img
                      src={post.media_url || "/placeholder.svg"}
                      alt="Post media"
                      className="w-full h-auto max-h-96 object-cover"
                    />
                  )}
                  {post.media_type === "video" && (
                    <video controls className="w-full h-auto max-h-96">
                      <source src={post.media_url} type="video/mp4" />
                    </video>
                  )}
                  {post.media_type === "audio" && <audio controls className="w-full" src={post.media_url} />}
                </div>
              )}

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleVote(post.id)}
                    className={cn("flex items-center gap-2", post.has_voted && "text-primary")}
                  >
                    {post.has_voted ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                    {post.vote_count}
                  </Button>

                  <Button variant="ghost" size="sm" className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    {post.comment_count}
                  </Button>

                  <Button variant="ghost" size="sm" onClick={() => handleBookmark(post.id)}>
                    <Bookmark className="h-4 w-4" />
                  </Button>
                </div>

                <Button variant="ghost" size="sm">
                  <Share className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
