"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { MessageCircle, Share2, MoreHorizontal, ThumbsUp, ThumbsDown, Bookmark, Flag } from "lucide-react"
import { RealtimeCreatePostForm } from "./realtime-create-post-form"
import { formatDistanceToNow } from "date-fns"

interface Post {
  id: string
  title?: string
  content: string
  media_url?: string
  media_type?: string
  upvotes: number
  downvotes: number
  comments_count: number
  created_at: string
  is_pinned?: boolean
  user: {
    id: string
    username: string
    display_name?: string
    avatar_url?: string
    tier: string
  }
}

interface RealtimeCommunityFeedProps {
  initialPosts: Post[]
}

const TIER_ICONS = {
  grassroot: "Star",
  pioneer: "Zap",
  elder: "Crown",
  blood_brotherhood: "Flame",
}

const TIER_COLORS = {
  grassroot: "bg-green-500",
  pioneer: "bg-blue-500",
  elder: "bg-purple-500",
  blood_brotherhood: "bg-red-500",
}

const mockPosts: Post[] = [
  {
    id: "1",
    user: {
      username: "erigga_official",
      display_name: "Erigga",
      avatar_url: "/placeholder.svg",
      tier: "blood_brotherhood",
    },
    title: "New Track Alert! 🔥",
    content:
      "Just dropped something special for my day one fans. This one's straight from the heart of Warri. What y'all think about the new sound? Drop your thoughts below! 🎵",
    media_url: "/placeholder.svg",
    media_type: "image",
    upvotes: 234,
    downvotes: 2,
    comments_count: 45,
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
    is_pinned: true,
  },
  {
    id: "2",
    user: {
      username: "warri_boy_23",
      display_name: "Warri Boy",
      avatar_url: "/placeholder.svg",
      tier: "pioneer",
    },
    content:
      "Been listening to Erigga since day one. The growth is incredible! From 'A Very Very Good Bad Guy' to now, every album tells a story. Respect to the Paper Boi! 💯",
    upvotes: 89,
    downvotes: 1,
    comments_count: 12,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
  },
  {
    id: "3",
    user: {
      username: "music_lover_ng",
      display_name: "Music Lover",
      avatar_url: "/placeholder.svg",
      tier: "elder",
    },
    title: "Concert Experience",
    content:
      "Just came back from the Lagos show! The energy was unmatched. When he performed 'The Erigma', the whole crowd went wild! Already can't wait for the next one 🎤",
    media_url: "/placeholder.svg",
    media_type: "image",
    upvotes: 156,
    downvotes: 3,
    comments_count: 28,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
  },
]

export function RealtimeCommunityFeed({ initialPosts }: RealtimeCommunityFeedProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts || mockPosts)
  const [loading, setLoading] = useState(false)
  const { user, profile } = useAuth()
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
        (payload) => {
          console.log("New post received:", payload)
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

      const { data, error } = await supabase
        .from("community_posts")
        .select(`
          *,
          user:users!community_posts_user_id_fkey(
            id,
            username,
            display_name,
            avatar_url,
            tier
          )
        `)
        .eq("is_published", true)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false })
        .limit(20)

      if (error) throw error

      setPosts(data || [])
    } catch (error) {
      console.error("Error loading posts:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleVote = async (postId: string, voteType: "up" | "down") => {
    if (!profile) {
      console.log("Sign in required to vote on posts")
      return
    }

    try {
      const { data: existingVote } = await supabase
        .from("community_post_votes")
        .select("id")
        .eq("post_id", postId)
        .eq("user_id", profile.id)
        .single()

      if (existingVote) {
        // Remove vote
        await supabase.from("community_post_votes").delete().eq("post_id", postId).eq("user_id", profile.id)

        // Update local state
        setPosts((prevPosts) =>
          prevPosts.map((post) => {
            if (post.id === postId) {
              return {
                ...post,
                upvotes: voteType === "up" ? post.upvotes - 1 : post.upvotes,
                downvotes: voteType === "down" ? post.downvotes - 1 : post.downvotes,
              }
            }
            return post
          }),
        )
      } else {
        // Add vote
        await supabase
          .from("community_post_votes")
          .insert({ post_id: postId, user_id: profile.id, vote_type: voteType })

        // Update local state
        setPosts((prevPosts) =>
          prevPosts.map((post) => {
            if (post.id === postId) {
              return {
                ...post,
                upvotes: voteType === "up" ? post.upvotes + 1 : post.upvotes,
                downvotes: voteType === "down" ? post.downvotes + 1 : post.downvotes,
              }
            }
            return post
          }),
        )
      }
    } catch (error) {
      console.error("Error voting:", error)
    }
  }

  const handleBookmark = async (postId: string) => {
    if (!profile) {
      console.log("Sign in required to bookmark posts")
      return
    }

    try {
      const { data: existingBookmark } = await supabase
        .from("user_bookmarks")
        .select("id")
        .eq("post_id", postId)
        .eq("user_id", profile.id)
        .single()

      if (existingBookmark) {
        await supabase.from("user_bookmarks").delete().eq("post_id", postId).eq("user_id", profile.id)
      } else {
        await supabase.from("user_bookmarks").insert({ post_id: postId, user_id: profile.id })
      }
    } catch (error) {
      console.error("Error bookmarking:", error)
    }
  }

  const handleNewPost = (newPost: Omit<Post, "id" | "created_at" | "upvotes" | "downvotes" | "comments_count">) => {
    const post: Post = {
      ...newPost,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
      upvotes: 0,
      downvotes: 0,
      comments_count: 0,
    }
    setPosts((prevPosts) => [post, ...prevPosts])
  }

  const getTierIcon = (tier: string) => {
    const Icon = TIER_ICONS[tier as keyof typeof TIER_ICONS] || "Star"
    return Icon
  }

  const getTierColor = (tier: string) => {
    return TIER_COLORS[tier as keyof typeof TIER_COLORS] || "bg-gray-500"
  }

  if (loading && posts.length === 0) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="border-0 shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-700 animate-pulse" />
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-gray-300 dark:bg-gray-700 animate-pulse" />
                  <div className="h-3 w-24 bg-gray-300 dark:bg-gray-700 animate-pulse" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-6 w-3/4 bg-gray-300 dark:bg-gray-700 animate-pulse" />
              <div className="h-16 w-full bg-gray-300 dark:bg-gray-700 animate-pulse" />
              <div className="flex gap-4">
                <div className="h-8 w-20 bg-gray-300 dark:bg-gray-700 animate-pulse" />
                <div className="h-8 w-20 bg-gray-300 dark:bg-gray-700 animate-pulse" />
                <div className="h-8 w-20 bg-gray-300 dark:bg-gray-700 animate-pulse" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Create Post Form */}
      <RealtimeCreatePostForm onPostCreated={handleNewPost} />

      {/* Posts Feed */}
      <div className="space-y-4">
        {posts.map((post) => (
          <Card key={post.id} className="overflow-hidden hover:shadow-md transition-shadow">
            {post.is_pinned && (
              <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 px-4 py-2 border-b">
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="text-xs">
                    📌 Pinned Post
                  </Badge>
                </div>
              </div>
            )}

            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={post.user.avatar_url || "/placeholder.svg"} />
                      <AvatarFallback>
                        {(post.user.display_name || post.user.username).charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-background ${
                        getTierColor(post.user.tier) || "bg-gray-500"
                      }`}
                    />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-semibold text-sm">{post.user.display_name || post.user.username}</h4>
                      <span className="text-muted-foreground text-sm">@{post.user.username}</span>
                      <Badge variant="outline" className="text-xs">
                        {post.user.tier}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>

                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>

              {post.title && <h3 className="font-bold text-lg mt-2">{post.title}</h3>}
            </CardHeader>

            <CardContent className="pt-0">
              <p className="text-sm leading-relaxed mb-4">{post.content}</p>

              {post.media_url && (
                <div className="mb-4 rounded-lg overflow-hidden">
                  {post.media_type === "image" ? (
                    <img
                      src={post.media_url || "/placeholder.svg"}
                      alt="Post media"
                      className="w-full h-auto max-h-96 object-cover"
                    />
                  ) : post.media_type === "video" ? (
                    <video src={post.media_url} controls className="w-full h-auto max-h-96" />
                  ) : null}
                </div>
              )}

              <Separator className="mb-4" />

              {/* Post Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleVote(post.id, "up")}
                    className="flex items-center space-x-1 hover:text-green-600"
                  >
                    <ThumbsUp className="h-4 w-4" />
                    <span className="text-xs">{post.upvotes}</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleVote(post.id, "down")}
                    className="flex items-center space-x-1 hover:text-red-600"
                  >
                    <ThumbsDown className="h-4 w-4" />
                    <span className="text-xs">{post.downvotes}</span>
                  </Button>

                  <Button variant="ghost" size="sm" className="flex items-center space-x-1 hover:text-blue-600">
                    <MessageCircle className="h-4 w-4" />
                    <span className="text-xs">{post.comments_count}</span>
                  </Button>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleBookmark(post.id)}
                    className="hover:text-blue-600"
                  >
                    <Bookmark className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="hover:text-green-600">
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="hover:text-red-600">
                    <Flag className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Load More */}
      <div className="text-center">
        <Button variant="outline" onClick={() => setLoading(true)} disabled={loading}>
          {loading ? "Loading..." : "Load More Posts"}
        </Button>
      </div>
    </div>
  )
}
