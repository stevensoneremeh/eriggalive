"use client"

import { useEffect, useState } from "react"
import { PostCard } from "./post-card"
import { createClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"

interface Post {
  id: string
  title: string
  content: string
  author_id: string
  category_id: string
  image_url?: string
  upvotes: number
  downvotes: number
  comment_count: number
  view_count: number
  created_at: string
  profiles: {
    username: string
    display_name?: string
    avatar_url?: string
  }
  categories: {
    name: string
    color: string
    icon?: string
  }
}

export function CommunityFeed() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from("posts")
        .select(`
          *,
          profiles:author_id (username, display_name, avatar_url),
          categories:category_id (name, color, icon)
        `)
        .order("created_at", { ascending: false })
        .limit(20)

      if (error) throw error
      setPosts(data || [])
    } catch (error) {
      console.error("Error fetching posts:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
        <p className="text-muted-foreground">Be the first to start a conversation!</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  )
}
