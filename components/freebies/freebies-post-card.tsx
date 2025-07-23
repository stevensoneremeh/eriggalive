"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { ThumbsUp, ThumbsDown, Heart, MessageCircle, Star, Zap, Crown, Flame } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"

interface FreebiesPostCardProps {
  post: {
    id: string
    title: string
    content: string
    image_url?: string
    author_id: string
    upvotes: number
    downvotes: number
    likes: number
    comment_count: number
    created_at: string
    profiles: {
      username: string
      display_name?: string
      avatar_url?: string
      subscription_tier?: string
    }
  }
  currentUserId?: string
}

const tierIcons = {
  Grassroot: Star,
  Pioneer: Zap,
  Elder: Crown,
  Blood: Flame,
}

const tierColors = {
  Grassroot: "text-green-500",
  Pioneer: "text-blue-500",
  Elder: "text-purple-500",
  Blood: "text-red-500",
}

export function FreebiesPostCard({ post, currentUserId }: FreebiesPostCardProps) {
  const [userVote, setUserVote] = useState<"up" | "down" | null>(null)
  const [userLiked, setUserLiked] = useState(false)
  const [localUpvotes, setLocalUpvotes] = useState(post.upvotes)
  const [localDownvotes, setLocalDownvotes] = useState(post.downvotes)
  const [localLikes, setLocalLikes] = useState(post.likes)
  const [isLoading, setIsLoading] = useState(false)

  const { toast } = useToast()
  const supabase = createClient()

  const TierIcon = tierIcons[post.profiles.subscription_tier as keyof typeof tierIcons] || Star
  const tierColor = tierColors[post.profiles.subscription_tier as keyof typeof tierColors] || "text-gray-500"

  // Fetch user's current vote and like status
  useEffect(() => {
    if (!currentUserId) return

    const fetchUserInteractions = async () => {
      try {
        // Check if user has voted
        const { data: voteData } = await supabase
          .from("freebies_votes")
          .select("vote_type")
          .eq("user_id", currentUserId)
          .eq("post_id", post.id)
          .single()

        if (voteData) {
          setUserVote(voteData.vote_type as "up" | "down")
        }

        // Check if user has liked
        const { data: likeData } = await supabase
          .from("freebies_likes")
          .select("id")
          .eq("user_id", currentUserId)
          .eq("post_id", post.id)
          .single()

        if (likeData) {
          setUserLiked(true)
        }
      } catch (error) {
        // Ignore errors - user hasn't voted/liked
      }
    }

    fetchUserInteractions()
  }, [currentUserId, post.id, supabase])

  const handleVote = async (type: "up" | "down") => {
    if (!currentUserId || isLoading) return

    setIsLoading(true)
    try {
      if (userVote === type) {
        // Remove vote
        await supabase.from("freebies_votes").delete().eq("user_id", currentUserId).eq("post_id", post.id)

        setUserVote(null)
        if (type === "up") {
          setLocalUpvotes((prev) => prev - 1)
        } else {
          setLocalDownvotes((prev) => prev - 1)
        }
      } else {
        // Add or change vote
        await supabase.from("freebies_votes").upsert({ user_id: currentUserId, post_id: post.id, vote_type: type })

        // Update local state
        if (userVote === "up" && type === "down") {
          setLocalUpvotes((prev) => prev - 1)
          setLocalDownvotes((prev) => prev + 1)
        } else if (userVote === "down" && type === "up") {
          setLocalDownvotes((prev) => prev - 1)
          setLocalUpvotes((prev) => prev + 1)
        } else if (!userVote) {
          if (type === "up") {
            setLocalUpvotes((prev) => prev + 1)
          } else {
            setLocalDownvotes((prev) => prev + 1)
          }
        }

        setUserVote(type)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update vote. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleLike = async () => {
    if (!currentUserId || isLoading) return

    setIsLoading(true)
    try {
      if (userLiked) {
        // Remove like
        await supabase.from("freebies_likes").delete().eq("user_id", currentUserId).eq("post_id", post.id)

        setUserLiked(false)
        setLocalLikes((prev) => prev - 1)
      } else {
        // Add like
        await supabase.from("freebies_likes").insert({ user_id: currentUserId, post_id: post.id })

        setUserLiked(true)
        setLocalLikes((prev) => prev + 1)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update like. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="bg-background/50 border-muted hover:bg-background/70 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.profiles.avatar_url || "/placeholder.svg"} />
              <AvatarFallback>
                {(post.profiles.display_name || post.profiles.username).charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <div className="flex items-center space-x-2">
                <span className="font-semibold">{post.profiles.display_name || post.profiles.username}</span>
                <Badge variant="outline" className={cn("text-xs", tierColor)}>
                  <TierIcon className="h-3 w-3 mr-1" />
                  {post.profiles.subscription_tier || "Grassroot"}
                </Badge>
                <span className="text-muted-foreground">•</span>
                <span className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">{post.title}</h3>
            <p className="text-muted-foreground">{post.content}</p>
          </div>

          {post.image_url && (
            <div className="rounded-lg overflow-hidden">
              <img
                src={post.image_url || "/placeholder.svg"}
                alt={post.title}
                className="w-full h-auto max-h-96 object-cover"
              />
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-muted">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleVote("up")}
                  disabled={!currentUserId || isLoading}
                  className={cn("h-8 px-2", userVote === "up" && "text-green-600 bg-green-600/10")}
                >
                  <ThumbsUp className="h-4 w-4 mr-1" />
                  <span className="text-sm">{localUpvotes}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleVote("down")}
                  disabled={!currentUserId || isLoading}
                  className={cn("h-8 px-2", userVote === "down" && "text-red-600 bg-red-600/10")}
                >
                  <ThumbsDown className="h-4 w-4 mr-1" />
                  <span className="text-sm">{localDownvotes}</span>
                </Button>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                disabled={!currentUserId || isLoading}
                className={cn("h-8 px-2", userLiked && "text-pink-600 bg-pink-600/10")}
              >
                <Heart className={cn("h-4 w-4 mr-1", userLiked && "fill-current")} />
                <span className="text-sm">{localLikes}</span>
              </Button>

              <Button variant="ghost" size="sm" className="h-8 px-2">
                <MessageCircle className="h-4 w-4 mr-1" />
                <span className="text-sm">{post.comment_count}</span>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
