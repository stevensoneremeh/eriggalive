"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Heart, MessageCircle, Share2, Play, Pause, Coins } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/components/ui/use-toast"

interface Post {
  id: number
  user: {
    id: string
    username: string
    full_name: string
    avatar_url?: string
    tier: string
    coins: number
  }
  content: string
  media_url?: string
  media_type?: "image" | "audio" | "video"
  likes_count: number
  comments_count: number
  created_at: string
  is_liked: boolean
}

interface SocialFeedProps {
  searchQuery: string
  filterType: string
}

export function SocialFeed({ searchQuery, filterType }: SocialFeedProps) {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [playingId, setPlayingId] = useState<number | null>(null)
  const { profile, isAuthenticated } = useAuth()
  const { toast } = useToast()

  // Mock data for preview
  useEffect(() => {
    const mockPosts: Post[] = [
      {
        id: 1,
        user: {
          id: "1",
          username: "erigga_fan_1",
          full_name: "Sarah Johnson",
          avatar_url: "/placeholder-user.jpg",
          tier: "Pioneer",
          coins: 1250,
        },
        content: "Just listened to Erigga's latest track and I'm blown away! The wordplay is incredible 🔥 #EriggaLive",
        media_type: "image",
        media_url: "/placeholder.jpg",
        likes_count: 45,
        comments_count: 12,
        created_at: "2024-01-15T10:30:00Z",
        is_liked: false,
      },
      {
        id: 2,
        user: {
          id: "2",
          username: "bars_king",
          full_name: "Michael Chen",
          avatar_url: "/placeholder-user.jpg",
          tier: "Elder",
          coins: 2800,
        },
        content: "Dropping some bars inspired by the king himself! What y'all think? 🎤",
        media_type: "audio",
        media_url: "/placeholder-audio.mp3",
        likes_count: 78,
        comments_count: 23,
        created_at: "2024-01-15T09:15:00Z",
        is_liked: true,
      },
      {
        id: 3,
        user: {
          id: "3",
          username: "erigga_stan",
          full_name: "Amara Okafor",
          avatar_url: "/placeholder-user.jpg",
          tier: "Blood",
          coins: 5600,
        },
        content: "Been following Erigga since day one. His journey is truly inspiring! From the streets to the top 💪",
        likes_count: 156,
        comments_count: 34,
        created_at: "2024-01-15T08:45:00Z",
        is_liked: false,
      },
    ]

    // Simulate loading
    setTimeout(() => {
      setPosts(mockPosts)
      setLoading(false)
    }, 1000)
  }, [searchQuery, filterType])

  const handleLike = async (postId: number) => {
    if (!isAuthenticated) {
      toast({
        title: "Sign in required",
        description: "Please sign in to like posts",
        variant: "destructive",
      })
      return
    }

    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? {
              ...post,
              is_liked: !post.is_liked,
              likes_count: post.is_liked ? post.likes_count - 1 : post.likes_count + 1,
            }
          : post,
      ),
    )

    toast({
      title: "Success",
      description: "Post liked successfully!",
    })
  }

  const handlePlay = (postId: number, audioUrl: string) => {
    if (playingId === postId) {
      setPlayingId(null)
    } else {
      setPlayingId(postId)
      // In a real app, you'd implement actual audio playback here
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
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src={post.user.avatar_url || "/placeholder.svg"} alt={post.user.username} />
                <AvatarFallback>{post.user.full_name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold truncate">{post.user.full_name}</p>
                  <Badge className={`${getTierColor(post.user.tier)} text-white text-xs`}>{post.user.tier}</Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>@{post.user.username}</span>
                  <span>•</span>
                  <span>{new Date(post.created_at).toLocaleDateString()}</span>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Coins className="h-3 w-3 text-orange-500" />
                    <span>{post.user.coins.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="mb-4">
              <p className="text-foreground leading-relaxed">{post.content}</p>
            </div>

            {/* Media */}
            {post.media_url && (
              <div className="mb-4 rounded-lg overflow-hidden">
                {post.media_type === "image" && (
                  <img
                    src={post.media_url || "/placeholder.svg"}
                    alt="Post media"
                    className="w-full h-64 object-cover"
                  />
                )}
                {post.media_type === "audio" && (
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handlePlay(post.id, post.media_url!)}
                        className="rounded-full"
                      >
                        {playingId === post.id ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                      </Button>
                      <div className="flex-1">
                        <div className="h-2 bg-background rounded-full">
                          <div className="h-2 bg-gradient-to-r from-orange-500 to-lime-500 rounded-full w-1/3"></div>
                        </div>
                      </div>
                      <span className="text-sm text-muted-foreground">0:45 / 2:30</span>
                    </div>
                  </div>
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
                  className={`gap-2 ${post.is_liked ? "text-red-500" : "text-muted-foreground"}`}
                >
                  <Heart className={`h-4 w-4 ${post.is_liked ? "fill-current" : ""}`} />
                  {post.likes_count}
                </Button>
                <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                  <MessageCircle className="h-4 w-4" />
                  {post.comments_count}
                </Button>
                <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
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
