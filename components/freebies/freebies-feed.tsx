"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  TrendingUp,
  Clock,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Users,
  Star,
  Crown,
  Zap,
  Flame,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"

interface FreebiesPost {
  id: string
  title: string
  content: string
  upvotes: number
  downvotes: number
  created_at: string
  user: {
    id: string
    username: string
    full_name: string | null
    avatar_url: string | null
    tier: string
  }
  user_vote?: "up" | "down" | null
}

interface FreebiesFeedProps {
  initialPosts: FreebiesPost[]
  currentUserId?: string
}

const TIER_ICONS = {
  grassroot: Star,
  pioneer: Zap,
  elder: Crown,
  blood_brotherhood: Flame,
}

const TIER_COLORS = {
  grassroot: "text-green-500",
  pioneer: "text-blue-500",
  elder: "text-purple-500",
  blood_brotherhood: "text-red-500",
}

export function FreebiesFeed({ initialPosts, currentUserId }: FreebiesFeedProps) {
  const [posts, setPosts] = useState<FreebiesPost[]>(initialPosts)
  const [loading, setLoading] = useState(false)
  const [sortBy, setSortBy] = useState<"latest" | "popular">("latest")

  const { user, profile } = useAuth()
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    // Set up real-time subscription for new posts
    const channel = supabase
      .channel("freebies_posts")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "freebies_posts",
        },
        (payload) => {
          console.log("New freebies post received:", payload)
          loadPosts() // Reload posts when new one is added
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  const loadPosts = async () => {
    try {
      setLoading(true)
      const orderBy = sortBy === "latest" ? "created_at" : "upvotes"

      const { data, error } = await supabase
        .from("freebies_posts")
        .select(`
          *,
          user:users!freebies_posts_user_id_fkey(
            id,
            username,
            full_name,
            avatar_url,
            tier
          )
        `)
        .order(orderBy, { ascending: false })
        .limit(20)

      if (error) throw error

      // Get vote status for each post if user is logged in
      let postsWithVoteStatus = data || []

      if (profile) {
        postsWithVoteStatus = await Promise.all(
          (data || []).map(async (post) => {
            const { data: voteData } = await supabase
              .from("freebies_post_votes")
              .select("vote_type")
              .eq("post_id", post.id)
              .eq("user_id", profile.id)
              .single()

            return {
              ...post,
              user_vote: voteData?.vote_type || null,
            }
          }),
        )
      }

      setPosts(postsWithVoteStatus)
    } catch (error) {
      console.error("Error loading posts:", error)
      toast({
        title: "Error",
        description: "Failed to load posts",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPosts()
  }, [sortBy])

  const handleVote = async (postId: string, voteType: "up" | "down") => {
    if (!profile) {
      toast({
        title: "Sign in required",
        description: "Please sign in to vote on posts",
        variant: "destructive",
      })
      return
    }

    try {
      const { data: existingVote } = await supabase
        .from("freebies_post_votes")
        .select("vote_type")
        .eq("post_id", postId)
        .eq("user_id", profile.id)
        .single()

      if (existingVote?.vote_type === voteType) {
        // Remove vote if clicking the same vote type
        await supabase.from("freebies_post_votes").delete().eq("post_id", postId).eq("user_id", profile.id)

        // Update local state
        setPosts(
          posts.map((post) => {
            if (post.id === postId) {
              return {
                ...post,
                upvotes: voteType === "up" ? post.upvotes - 1 : post.upvotes,
                downvotes: voteType === "down" ? post.downvotes - 1 : post.downvotes,
                user_vote: null,
              }
            }
            return post
          }),
        )

        toast({ title: "Vote removed" })
      } else {
        // Add or update vote
        await supabase.from("freebies_post_votes").upsert({
          post_id: postId,
          user_id: profile.id,
          vote_type: voteType,
        })

        // Update local state
        setPosts(
          posts.map((post) => {
            if (post.id === postId) {
              const upvoteChange = voteType === "up" ? 1 : existingVote?.vote_type === "up" ? -1 : 0
              const downvoteChange = voteType === "down" ? 1 : existingVote?.vote_type === "down" ? -1 : 0

              return {
                ...post,
                upvotes: post.upvotes + upvoteChange,
                downvotes: post.downvotes + downvoteChange,
                user_vote: voteType,
              }
            }
            return post
          }),
        )

        toast({ title: `${voteType === "up" ? "Upvoted" : "Downvoted"}!` })
      }
    } catch (error) {
      console.error("Error voting:", error)
      toast({
        title: "Error",
        description: "Failed to vote on post",
        variant: "destructive",
      })
    }
  }

  const getTierIcon = (tier: string) => {
    const Icon = TIER_ICONS[tier as keyof typeof TIER_ICONS] || Star
    return Icon
  }

  const getTierColor = (tier: string) => {
    return TIER_COLORS[tier as keyof typeof TIER_COLORS] || "text-gray-500"
  }

  if (loading && posts.length === 0) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="border-0 shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-16 w-full" />
              <div className="flex gap-4">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Sort Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={sortBy === "latest" ? "default" : "outline"}
            size="sm"
            onClick={() => setSortBy("latest")}
            className="flex items-center gap-2"
          >
            <Clock className="h-4 w-4" />
            Latest
          </Button>
          <Button
            variant={sortBy === "popular" ? "default" : "outline"}
            size="sm"
            onClick={() => setSortBy("popular")}
            className="flex items-center gap-2"
          >
            <TrendingUp className="h-4 w-4" />
            Popular
          </Button>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>{posts.length} posts</span>
        </div>
      </div>

      {/* Posts Feed */}
      <div className="space-y-6">
        {posts.map((post) => {
          const TierIcon = getTierIcon(post.user.tier)
          const tierColor = getTierColor(post.user.tier)
          const netScore = post.upvotes - post.downvotes

          return (
            <Card
              key={post.id}
              className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 hover:shadow-xl transition-all duration-300"
            >
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 ring-2 ring-white dark:ring-gray-800">
                      <AvatarImage src={post.user.avatar_url || "/placeholder.svg"} />
                      <AvatarFallback>{post.user.username.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{post.user.full_name || post.user.username}</span>
                        <TierIcon className={cn("h-4 w-4", tierColor)} />
                        <Badge variant="outline" className={cn("text-xs", tierColor)}>
                          {post.user.tier.charAt(0).toUpperCase() + post.user.tier.slice(1)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                        <span>•</span>
                        <span
                          className={cn(
                            "font-medium",
                            netScore > 0 ? "text-green-600" : netScore < 0 ? "text-red-600" : "text-gray-500",
                          )}
                        >
                          {netScore > 0 ? `+${netScore}` : netScore} score
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold mb-2 leading-tight">{post.title}</h3>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{post.content}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleVote(post.id, "up")}
                      className={cn(
                        "flex items-center gap-2 transition-all",
                        post.user_vote === "up" && "text-green-600 bg-green-50 hover:bg-green-100",
                      )}
                    >
                      <ThumbsUp className={cn("h-4 w-4", post.user_vote === "up" && "fill-current")} />
                      <span>{post.upvotes}</span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleVote(post.id, "down")}
                      className={cn(
                        "flex items-center gap-2 transition-all",
                        post.user_vote === "down" && "text-red-600 bg-red-50 hover:bg-red-100",
                      )}
                    >
                      <ThumbsDown className={cn("h-4 w-4", post.user_vote === "down" && "fill-current")} />
                      <span>{post.downvotes}</span>
                    </Button>

                    <Button variant="ghost" size="sm" className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      Reply
                    </Button>
                  </div>

                  <Button variant="ghost" size="sm" className="flex items-center gap-2">
                    <Share2 className="h-4 w-4" />
                    Share
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {posts.length === 0 && !loading && (
        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
          <CardContent className="p-12 text-center">
            <Users className="h-20 w-20 text-gray-400 mx-auto mb-6" />
            <h3 className="text-2xl font-semibold mb-3">No posts yet</h3>
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              Be the first to share something in the freebies room!
            </p>
          </CardContent>
        </Card>
      )}

      {loading && posts.length > 0 && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </div>
      )}
    </div>
  )
}
