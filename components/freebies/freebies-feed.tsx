"use client"

import { useEffect, useState } from "react"
import { FreebiesPostCard } from "./freebies-post-card"
import { CreateFreebiesPost } from "./create-freebies-post"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { Loader2, TrendingUp, Clock, ThumbsUp } from "lucide-react"

interface FreebiesFeedProps {
  currentUserId?: string
}

export function FreebiesFeed({ currentUserId }: FreebiesFeedProps) {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState("newest")
  const supabase = createClient()

  const sortOptions = [
    { value: "newest", label: "Newest First", icon: Clock },
    { value: "most_voted", label: "Most Voted", icon: ThumbsUp },
    { value: "trending", label: "Trending", icon: TrendingUp },
  ]

  useEffect(() => {
    fetchPosts()
  }, [sortBy])

  const fetchPosts = async () => {
    try {
      let query = supabase.from("freebies_posts").select(`
          *,
          profiles:author_id (username, display_name, avatar_url, subscription_tier)
        `)

      // Apply sorting
      switch (sortBy) {
        case "newest":
          query = query.order("created_at", { ascending: false })
          break
        case "most_voted":
          query = query.order("upvotes", { ascending: false })
          break
        case "trending":
          // Simple trending algorithm: posts with high engagement in last 24 hours
          query = query
            .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
            .order("likes", { ascending: false })
          break
      }

      const { data, error } = await query.limit(20)

      if (error) throw error
      setPosts(data || [])
    } catch (error) {
      console.error("Error fetching posts:", error)
    } finally {
      setLoading(false)
    }
  }

  const handlePostCreated = () => {
    fetchPosts()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Freebies & Giveaways</h2>
          <p className="text-muted-foreground">Share and discover free stuff from the community</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => {
                const Icon = option.icon
                return (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center space-x-2">
                      <Icon className="h-4 w-4" />
                      <span>{option.label}</span>
                    </div>
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
          <CreateFreebiesPost onPostCreated={handlePostCreated} />
        </div>
      </div>

      {/* Posts */}
      {posts.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold mb-2">No freebies yet</h3>
          <p className="text-muted-foreground mb-4">Be the first to share a freebie with the community!</p>
          <CreateFreebiesPost onPostCreated={handlePostCreated} />
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <FreebiesPostCard key={post.id} post={post} currentUserId={currentUserId} />
          ))}
        </div>
      )}
    </div>
  )
}
