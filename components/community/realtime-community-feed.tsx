"use client"

import { useState, useEffect } from "react"
import { useAbly } from "@/contexts/ably-context"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { MessageCircle, Share2, Bookmark, ChevronUp, ChevronDown, Wifi, WifiOff } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { toast } from "@/hooks/use-toast"

interface Post {
  id: number
  title: string
  content: string
  created_at: string
  media_urls?: string[]
  media_type?: string
  vote_count: number
  user_voted?: string | null
  user_bookmarked?: boolean
  author: {
    id: string
    username: string
    full_name?: string
    avatar_url?: string
    tier?: string
  }
  category?: {
    id: number
    name: string
    slug: string
    color?: string
  }
}

interface RealtimeCommunityFeedProps {
  initialPosts: Post[]
  categoryId?: number
}

export function RealtimeCommunityFeed({ initialPosts, categoryId }: RealtimeCommunityFeedProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()
  const { isConnected, subscribeToFeed, subscribeToPostVotes } = useAbly()

  // Subscribe to real-time feed updates
  useEffect(() => {
    const unsubscribe = subscribeToFeed((data: any) => {
      const { post, categoryId: eventCategoryId } = data

      // Only add posts that match the current category filter
      if (categoryId && eventCategoryId && categoryId !== eventCategoryId) {
        return
      }

      setPosts((prevPosts) => {
        // Check if post already exists
        const exists = prevPosts.some((p) => p.id === post.id)
        if (exists) return prevPosts

        // Add new post to the beginning
        return [post, ...prevPosts]
      })

      // Show toast notification for new posts (except from current user)
      if (user && post.author.id !== user.id) {
        toast({
          title: "New post",
          description: `${post.author.username} posted: ${post.title}`,
        })
      }
    })

    return unsubscribe
  }, [subscribeToFeed, categoryId, user])

  // Subscribe to vote updates for all visible posts
  useEffect(() => {
    const unsubscribes: (() => void)[] = []

    posts.forEach((post) => {
      const unsubscribe = subscribeToPostVotes(post.id, (data: any) => {
        const { postId, voteCount, voted, userId } = data

        setPosts((prevPosts) =>
          prevPosts.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  vote_count: voteCount,
                  user_voted: user && Number.parseInt(user.id) === userId ? (voted ? "up" : null) : p.user_voted,
                }
              : p,
          ),
        )
      })
      unsubscribes.push(unsubscribe)
    })

    return () => {
      unsubscribes.forEach((unsub) => unsub())
    }
  }, [posts, subscribeToPostVotes, user])

  const handleVote = async (postId: number, voteType: "up" | "down") => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to vote on posts.",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/community/posts/vote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postId,
          voteType,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to vote")
      }

      const data = await response.json()

      // Update local state immediately for better UX
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId
            ? {
                ...post,
                vote_count: data.voteCount,
                user_voted: data.voted ? voteType : null,
              }
            : post,
        ),
      )
    } catch (error) {
      console.error("Error voting:", error)
      toast({
        title: "Error",
        description: "Failed to vote on post. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleBookmark = async (postId: number) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to bookmark posts.",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch(`/api/community/posts/${postId}/bookmark`, {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to bookmark")
      }

      const data = await response.json()

      setPosts((prevPosts) =>
        prevPosts.map((post) => (post.id === postId ? { ...post, user_bookmarked: data.bookmarked } : post)),
      )

      toast({
        title: data.bookmarked ? "Bookmarked" : "Removed bookmark",
        description: data.bookmarked ? "Post saved to your bookmarks" : "Post removed from bookmarks",
      })
    } catch (error) {
      console.error("Error bookmarking:", error)
      toast({
        title: "Error",
        description: "Failed to bookmark post. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isConnected ? (
            <>
              <Wifi className="h-4 w-4 text-green-500" />
              <span className="text-sm text-green-500">Live updates active</span>
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4 text-yellow-500" />
              <span className="text-sm text-yellow-500">Offline mode</span>
            </>
          )}
        </div>
      </div>

      {/* Posts */}
      {posts.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No posts yet. Be the first to share something!</p>
          </CardContent>
        </Card>
      ) : (
        posts.map((post) => (
          <Card key={post.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={post.author.avatar_url || "/placeholder.svg"} />
                    <AvatarFallback>{post.author.username?.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{post.author.full_name || post.author.username}</p>
                      {post.author.tier && (
                        <Badge variant="secondary" className="text-xs">
                          {post.author.tier}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      @{post.author.username} • {formatDistanceToNow(new Date(post.created_at))} ago
                    </p>
                  </div>
                </div>
                {post.category && (
                  <Badge variant="outline" style={{ borderColor: post.category.color }}>
                    {post.category.name}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2">{post.title}</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{post.content}</p>
                </div>

                {/* Media */}
                {post.media_urls && post.media_urls.length > 0 && (
                  <div className="grid gap-2">
                    {post.media_urls.map((url, index) => (
                      <div key={index} className="rounded-lg overflow-hidden">
                        {post.media_type === "image" ? (
                          <img
                            src={url || "/placeholder.svg"}
                            alt={`Media ${index + 1}`}
                            className="w-full h-auto max-h-96 object-cover"
                          />
                        ) : post.media_type === "video" ? (
                          <video src={url} controls className="w-full h-auto max-h-96" />
                        ) : (
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline"
                          >
                            View attachment
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <Separator />

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Vote buttons */}
                    <div className="flex items-center gap-1">
                      <Button
                        variant={post.user_voted === "up" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => handleVote(post.id, "up")}
                        className="h-8 px-2"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <span className="text-sm font-medium min-w-[2rem] text-center">{post.vote_count}</span>
                      <Button
                        variant={post.user_voted === "down" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => handleVote(post.id, "down")}
                        className="h-8 px-2"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>

                    <Button variant="ghost" size="sm">
                      <MessageCircle className="h-4 w-4 mr-1" />
                      Comment
                    </Button>

                    <Button variant="ghost" size="sm">
                      <Share2 className="h-4 w-4 mr-1" />
                      Share
                    </Button>
                  </div>

                  <Button variant="ghost" size="sm" onClick={() => handleBookmark(post.id)}>
                    <Bookmark className={`h-4 w-4 ${post.user_bookmarked ? "fill-current" : ""}`} />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
