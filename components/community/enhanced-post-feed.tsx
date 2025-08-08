"use client"

import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Heart, MessageSquare } from 'lucide-react'

type UserLite = {
  username?: string | null
  full_name?: string | null
  avatar_url?: string | null
  tier?: string | null
}

type Post = {
  id: string
  content: string
  created_at: string
  user_id?: string | null
  category_id?: number | null
  media_url?: string | null
  vote_count?: number | null
  comment_count?: number | null
  users?: UserLite | null
}

type Category = {
  id: number
  name: string
  slug: string
  description?: string
  is_active: boolean
}

interface EnhancedPostFeedProps {
  categories: Category[]
  initialPosts?: Post[]
  posts?: Post[]
}

function TierBadge({ tier }: { tier?: string | null }) {
  const className =
    tier === "blood"
      ? "bg-red-600 text-white"
      : tier === "elder"
        ? "bg-purple-500 text-white"
        : tier === "pioneer"
          ? "bg-blue-500 text-white"
          : "bg-green-500 text-white"
  return <Badge className={className}>{(tier || "grassroot").toUpperCase()}</Badge>
}

export function EnhancedPostFeed({ categories, initialPosts, posts }: EnhancedPostFeedProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [feed, setFeed] = useState<Post[]>(initialPosts || posts || [])

  // Keep a stable list of category ids for filtering if needed later
  const activeCategoryIds = useMemo(() => categories.map((c) => c.id), [categories])

  useEffect(() => {
    // If feed was passed by props, keep it synced
    if (posts && posts.length > 0) {
      setFeed(posts)
    }
  }, [posts])

  useEffect(() => {
    // If there are no posts, fetch some defaults
    async function fetchPosts() {
      if (feed.length > 0) return
      setLoading(true)
      setError(null)
      try {
        const { data, error: fetchErr } = await supabase
          .from("community_posts")
          .select(
            `
            id,
            content,
            created_at,
            user_id,
            category_id,
            media_url,
            vote_count,
            comment_count,
            users:users!inner (
              username,
              full_name,
              avatar_url,
              tier
            )
          `,
          )
          .eq("is_published", true)
          .in("category_id", activeCategoryIds.length ? activeCategoryIds : [0])
          .order("created_at", { ascending: false })
          .limit(20)

        if (fetchErr) throw fetchErr
        setFeed(data || [])
      } catch (err: any) {
        console.error("EnhancedPostFeed fetch error:", err)
        setError("Unable to load posts at the moment. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, activeCategoryIds])

  if (loading && feed.length === 0) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted" />
                <div className="space-y-2">
                  <div className="h-4 w-40 bg-muted rounded" />
                  <div className="h-3 w-24 bg-muted rounded" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="h-4 w-full bg-muted rounded" />
                <div className="h-4 w-3/4 bg-muted rounded" />
                <div className="h-40 w-full bg-muted rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error && feed.length === 0) {
    return <div className="text-sm text-red-600">{error}</div>
  }

  return (
    <div className="space-y-6">
      {feed.map((post) => (
        <Card key={post.id}>
          <CardHeader>
            <div className="flex items-start gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={post.users?.avatar_url || "/placeholder-user.jpg"} />
                <AvatarFallback>{(post.users?.username || "U").charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center flex-wrap gap-2">
                  <span className="font-semibold">{post.users?.full_name || post.users?.username || "User"}</span>
                  <TierBadge tier={post.users?.tier} />
                </div>
                <div className="text-xs text-muted-foreground">
                  @{post.users?.username || "user"} •{" "}
                  {post.created_at ? new Date(post.created_at).toLocaleString() : "Just now"}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="mb-3 whitespace-pre-line">{post.content}</p>

            {post.media_url && (
              <div className="relative rounded-lg overflow-hidden bg-muted">
                {/* Display image or video based on extension */}
                {/\.(mp4|webm|ogg)$/i.test(post.media_url) ? (
                  <video
                    src={post.media_url}
                    controls
                    className="w-full h-auto"
                    poster="/placeholder.svg?height=300&width=600"
                  />
                ) : (
                  <img
                    src={post.media_url || "/placeholder.svg"}
                    alt="Post media"
                    className="w-full h-auto object-cover"
                    loading="lazy"
                  />
                )}
              </div>
            )}

            <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
              <Button variant="ghost" size="sm" className="px-2">
                <Heart className="h-4 w-4 mr-1" />
                {post.vote_count ?? 0}
              </Button>
              <Button variant="ghost" size="sm" className="px-2">
                <MessageSquare className="h-4 w-4 mr-1" />
                {post.comment_count ?? 0}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
