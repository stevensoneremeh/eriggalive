"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Heart, MessageCircle, Share2, MoreHorizontal } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { useContentManager, type Post } from "@/lib/content-manager"
import { AudioPlayer } from "@/components/community/audio-player"
import { formatDistanceToNow } from "date-fns"

interface SocialFeedProps {
  searchQuery: string
  filterType: string
}

export function SocialFeed({ searchQuery, filterType }: SocialFeedProps) {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set())

  const { profile, isAuthenticated } = useAuth()
  const { toast } = useToast()
  const contentManager = useContentManager()

  useEffect(() => {
    fetchPosts()
  }, [searchQuery, filterType])

  const fetchPosts = async () => {
    setLoading(true)
    try {
      const {
        success,
        posts: fetchedPosts,
        error,
      } = await contentManager.getPosts({
        type: filterType === "recent" ? undefined : "post",
        limit: 20,
        searchQuery: searchQuery || undefined,
      })

      if (success && fetchedPosts) {
        setPosts(fetchedPosts)
      } else {
        toast({
          title: "Error",
          description: error || "Failed to load posts",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching posts:", error)
      toast({
        title: "Error",
        description: "Failed to load posts",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async (postId: number) => {
    if (!isAuthenticated || !profile) {
      toast({
        title: "Sign in required",
        description: "Please sign in to like posts",
        variant: "destructive",
      })
      return
    }

    try {
      const { success, error } = await contentManager.likePost(postId, profile.id)

      if (success) {
        const isLiked = likedPosts.has(postId)

        // Update local state
        setPosts((prev) =>
          prev.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  like_count: isLiked ? post.like_count - 1 : post.like_count + 1,
                }
              : post,
          ),
        )

        // Update liked posts set
        setLikedPosts((prev) => {
          const newSet = new Set(prev)
          if (isLiked) {
            newSet.delete(postId)
          } else {
            newSet.add(postId)
          }
          return newSet
        })

        toast({
          title: "Success",
          description: isLiked ? "Post unliked" : "Post liked!",
        })
      } else {
        throw new Error(error)
      }
    } catch (error) {
      console.error("Like error:", error)
      toast({
        title: "Error",
        description: "Failed to like post",
        variant: "destructive",
      })
    }
  }

  const handleShare = async (post: Post) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${post.users?.full_name}'s post`,
          text: post.content,
          url: `${window.location.origin}/community/post/${post.id}`,
        })
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(`${window.location.origin}/community/post/${post.id}`)
        toast({
          title: "Link copied",
          description: "Post link copied to clipboard",
        })
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to copy link",
          variant: "destructive",
        })
      }
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case "blood":
        return "bg-red-500"
      case "elder":
        return "bg-purple-500"
      case "pioneer":
        return "bg-blue-500"
      case "mod":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-muted"></div>
              <div className="flex-1">
                <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/6"></div>
              </div>
            </div>
            <div className="space-y-2 mb-4">
              <div className="h-4 bg-muted rounded w-full"></div>
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </div>
            <div className="h-32 bg-muted rounded mb-4"></div>
            <div className="flex items-center gap-4">
              <div className="h-8 bg-muted rounded w-16"></div>
              <div className="h-8 bg-muted rounded w-16"></div>
              <div className="h-8 bg-muted rounded w-16"></div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
          <div className="p-6">
            {/* User Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={post.users?.avatar_url || "/placeholder.svg"} alt={post.users?.username} />
                  <AvatarFallback>{post.users?.full_name?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold truncate">{post.users?.full_name}</p>
                    <Badge className={`${getTierColor(post.users?.tier || "grassroot")} text-white text-xs`}>
                      {post.users?.tier || "Grassroot"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>@{post.users?.username}</span>
                    <span>•</span>
                    <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="mb-4">
              <p className="text-foreground leading-relaxed whitespace-pre-wrap">{post.content}</p>
            </div>

            {/* Hashtags */}
            {post.hashtags && post.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {post.hashtags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="text-xs bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 cursor-pointer"
                  >
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Media */}
            {post.media_urls && post.media_urls.length > 0 && (
              <div className="mb-4 rounded-lg overflow-hidden">
                {post.media_types?.includes("image") && (
                  <img
                    src={post.media_urls[post.media_types.indexOf("image")] || "/placeholder.svg"}
                    alt="Post media"
                    className="w-full h-64 object-cover"
                  />
                )}
                {post.media_types?.includes("audio") && (
                  <AudioPlayer
                    src={post.media_urls[post.media_types.indexOf("audio")]}
                    title={`${post.users?.full_name}'s audio`}
                    artist={post.users?.username}
                  />
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleLike(post.id)}
                  className={`gap-2 ${likedPosts.has(post.id) ? "text-red-500" : "text-muted-foreground"}`}
                >
                  <Heart className={`h-4 w-4 ${likedPosts.has(post.id) ? "fill-current" : ""}`} />
                  {post.like_count}
                </Button>
                <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                  <MessageCircle className="h-4 w-4" />
                  {post.comment_count}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-muted-foreground"
                  onClick={() => handleShare(post)}
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
              </div>
            </div>
          </div>
        </Card>
      ))}

      {posts.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No posts found. Be the first to share something!</p>
        </div>
      )}
    </div>
  )
}
