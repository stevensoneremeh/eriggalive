"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"

interface CommunityPost {
  id: number
  user_id: number
  category_id: number
  content: string
  media_url?: string
  media_type?: string
  vote_count: number
  comment_count: number
  created_at: string
  updated_at: string
  has_voted?: boolean
  user?: {
    id: number
    username: string
    full_name: string
    avatar_url?: string
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
  const [posts, setPosts] = useState<CommunityPost[]>(initialPosts)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    // Set up real-time subscription for new posts
    const channel = supabase
      .channel("community_posts")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "community_posts",
        },
        async (payload) => {
          // Fetch the complete post data with relationships
          const { data: newPost } = await supabase
            .from("community_posts")
            .select(`
              *,
              user:users!community_posts_user_id_fkey(
                id,
                username,
                full_name,
                avatar_url,
                tier
              ),
              category:community_categories!community_posts_category_id_fkey(
                id,
                name,
                slug,
                color,
                icon
              )
            `)
            .eq("id", payload.new.id)
            .single()

          if (newPost) {
            setPosts((current) => [{ ...newPost, has_voted: false }, ...current])
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  const handleVote = async (postId: number, postCreatorAuthId: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast.error("Please log in to vote")
        return
      }

      const response = await fetch("/api/community/posts/vote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postId,
          postCreatorAuthId,
        }),
      })

      const result = await response.json()

      if (result.success) {
        // Update the post in the local state
        setPosts((current) =>
          current.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  vote_count: result.voted ? post.vote_count + 1 : post.vote_count - 1,
                  has_voted: result.voted,
                }
              : post,
          ),
        )
        toast.success(result.message)
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      console.error("Vote error:", error)
      toast.error("Failed to vote")
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "blood":
        return "bg-red-500"
      case "elder":
        return "bg-purple-500"
      case "pioneer":
        return "bg-blue-500"
      case "grassroot":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  const getTierLabel = (tier: string) => {
    switch (tier) {
      case "blood":
        return "Blood"
      case "elder":
        return "Elder"
      case "pioneer":
        return "Pioneer"
      case "grassroot":
        return "Grassroot"
      default:
        return "Member"
    }
  }

  if (posts.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">No posts yet. Be the first to share something!</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <Card key={post.id} className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={post.user?.avatar_url || "/placeholder.svg"} />
                  <AvatarFallback>{post.user?.username?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{post.user?.full_name || post.user?.username}</p>
                    <Badge variant="secondary" className={`text-white ${getTierColor(post.user?.tier || "grassroot")}`}>
                      {getTierLabel(post.user?.tier || "grassroot")}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>@{post.user?.username}</span>
                    <span>•</span>
                    <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                    {post.category && (
                      <>
                        <span>•</span>
                        <Badge variant="outline" className="text-xs">
                          {post.category.icon} {post.category.name}
                        </Badge>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            <div className="space-y-4">
              <p className="whitespace-pre-wrap">{post.content}</p>

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
                    <video src={post.media_url} controls className="w-full h-auto max-h-96" />
                  )}
                  {post.media_type === "audio" && <audio src={post.media_url} controls className="w-full" />}
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleVote(post.id, post.user?.id?.toString() || "")}
                    className={`gap-2 ${post.has_voted ? "text-red-500" : ""}`}
                  >
                    <Heart className={`h-4 w-4 ${post.has_voted ? "fill-current" : ""}`} />
                    {post.vote_count}
                  </Button>

                  <Button variant="ghost" size="sm" className="gap-2">
                    <MessageCircle className="h-4 w-4" />
                    {post.comment_count}
                  </Button>

                  <Button variant="ghost" size="sm" className="gap-2">
                    <Share2 className="h-4 w-4" />
                    Share
                  </Button>
                </div>

                <Button variant="ghost" size="sm">
                  <Bookmark className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
