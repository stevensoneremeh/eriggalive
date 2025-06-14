"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { MoreHorizontal } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useAuth } from "@/contexts/auth-context"
import { MediaPlayer } from "@/components/community/media-player"
import { PostActions } from "@/components/community/post-actions"
import { UserTierBadge } from "@/components/user-tier-badge"

interface SocialFeedProps {
  searchQuery: string
  filterType: string
}

interface Post {
  id: string
  user: {
    id: string
    username: string
    fullName: string
    avatar: string
    tier: string
    isVerified: boolean
  }
  content: string
  mediaType?: "image" | "audio" | "video"
  mediaUrl?: string
  thumbnailUrl?: string
  createdAt: string
  likes: number
  comments: number
  shares: number
  isLiked: boolean
  isBookmarked: boolean
  tags: string[]
}

export function SocialFeed({ searchQuery, filterType }: SocialFeedProps) {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const { isAuthenticated } = useAuth()

  // Mock data for preview
  const mockPosts: Post[] = [
    {
      id: "1",
      user: {
        id: "user1",
        username: "erigga_fan_1",
        fullName: "Chidi Okafor",
        avatar: "/placeholder.svg?height=40&width=40",
        tier: "pioneer",
        isVerified: true,
      },
      content:
        "Just dropped some fire bars inspired by Erigga's latest track! 🔥 The way he flows on this beat is incredible. Who else is feeling this energy? #EriggaVibes #PaperBoi",
      mediaType: "audio",
      mediaUrl: "/placeholder-audio.mp3",
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      likes: 124,
      comments: 23,
      shares: 8,
      isLiked: false,
      isBookmarked: false,
      tags: ["EriggaVibes", "PaperBoi", "NewMusic"],
    },
    {
      id: "2",
      user: {
        id: "user2",
        username: "warri_princess",
        fullName: "Blessing Efe",
        avatar: "/placeholder.svg?height=40&width=40",
        tier: "elder",
        isVerified: false,
      },
      content:
        "Throwback to when I met Erigga at the Warri concert! Still can't believe it happened. The energy was unmatched! 🎤✨",
      mediaType: "image",
      mediaUrl: "/placeholder.svg?height=400&width=600",
      thumbnailUrl: "/placeholder.svg?height=200&width=300",
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      likes: 89,
      comments: 15,
      shares: 12,
      isLiked: true,
      isBookmarked: true,
      tags: ["Concert", "Warri", "Memories"],
    },
    {
      id: "3",
      user: {
        id: "user3",
        username: "lyric_master",
        fullName: "Emeka Johnson",
        avatar: "/placeholder.svg?height=40&width=40",
        tier: "blood_brotherhood",
        isVerified: true,
      },
      content:
        "Breaking down the wordplay in 'Industry Night' - Erigga's pen game is on another level! The metaphors, the flow, everything is perfect. This is why he's the king! 👑",
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      likes: 156,
      comments: 34,
      shares: 19,
      isLiked: false,
      isBookmarked: false,
      tags: ["IndustryNight", "Lyrics", "Analysis"],
    },
  ]

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true)
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setPosts(mockPosts)
      setLoading(false)
    }

    fetchPosts()
  }, [searchQuery, filterType])

  const handleLike = (postId: string) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? {
              ...post,
              isLiked: !post.isLiked,
              likes: post.isLiked ? post.likes - 1 : post.likes + 1,
            }
          : post,
      ),
    )
  }

  const handleBookmark = (postId: string) => {
    setPosts((prev) => prev.map((post) => (post.id === postId ? { ...post, isBookmarked: !post.isBookmarked } : post)))
  }

  const handleShare = (postId: string) => {
    // Implement share functionality
    navigator.share?.({
      title: "Check out this post from Erigga Community",
      url: `${window.location.origin}/community/post/${postId}`,
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-48 w-full rounded-md" />
            </CardContent>
            <CardFooter>
              <div className="flex gap-4">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <Card
          key={post.id}
          className="overflow-hidden hover:shadow-lg transition-all duration-200 border-l-4 border-l-transparent hover:border-l-orange-500"
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 ring-2 ring-orange-500/20">
                  <AvatarImage src={post.user.avatar || "/placeholder.svg"} alt={post.user.username} />
                  <AvatarFallback className="bg-gradient-to-r from-orange-500 to-lime-500 text-white">
                    {post.user.fullName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold truncate">{post.user.fullName}</p>
                    {post.user.isVerified && (
                      <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 text-xs">
                        ✓
                      </Badge>
                    )}
                    <UserTierBadge tier={post.user.tier} size="sm" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    @{post.user.username} • {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <p className="whitespace-pre-wrap leading-relaxed">{post.content}</p>
            </div>

            {/* Tags */}
            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="text-xs bg-orange-500/10 text-orange-600 hover:bg-orange-500/20"
                  >
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Media Content */}
            {post.mediaType && post.mediaUrl && (
              <div className="rounded-lg overflow-hidden">
                <MediaPlayer
                  type={post.mediaType}
                  url={post.mediaUrl}
                  thumbnail={post.thumbnailUrl}
                  title={`${post.user.fullName}'s ${post.mediaType}`}
                />
              </div>
            )}
          </CardContent>

          <CardFooter className="pt-3 border-t bg-muted/20">
            <PostActions
              post={post}
              onLike={() => handleLike(post.id)}
              onBookmark={() => handleBookmark(post.id)}
              onShare={() => handleShare(post.id)}
              isAuthenticated={isAuthenticated}
            />
          </CardFooter>
        </Card>
      ))}

      {/* Load More Button */}
      {hasMore && (
        <div className="text-center py-6">
          <Button
            variant="outline"
            size="lg"
            onClick={() => setPage((prev) => prev + 1)}
            className="bg-gradient-to-r from-orange-500/10 to-lime-500/10 hover:from-orange-500/20 hover:to-lime-500/20 border-orange-500/30"
          >
            Load More Posts
          </Button>
        </div>
      )}
    </div>
  )
}
