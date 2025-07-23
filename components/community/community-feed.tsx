"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useAbly } from "@/contexts/ably-context"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, Share2, TrendingUp, TrendingDown } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface Post {
  id: string
  content: string
  upvotes: number
  downvotes: number
  comment_count: number
  created_at: string
  users: {
    id: string
    username: string
    avatar_url: string | null
    tier: string
  }
  user_vote?: {
    vote_type: number
  }
}

export function CommunityFeed() {
  const { user, profile } = useAuth()
  const { ably, isConnected } = useAbly()
  const [posts, setPosts] = useState<Post[]>([])
  const [newPost, setNewPost] = useState("")
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchPosts()
  }, [])

  useEffect(() => {
    if (ably && isConnected) {
      const channel = ably.channels.get("community")

      channel.subscribe("new-post", (message) => {
        const newPost = message.data
        setPosts((prev) => [newPost, ...prev])
      })

      channel.subscribe("post-vote", (message) => {
        const { postId, upvotes, downvotes } = message.data
        setPosts((prev) => prev.map((post) => (post.id === postId ? { ...post, upvotes, downvotes } : post)))
      })

      return () => {
        channel.unsubscribe()
      }
    }
  }, [ably, isConnected])

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from("community_posts")
        .select(`
          *,
          users (id, username, avatar_url, tier),
          post_votes (vote_type)
        `)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false })
        .limit(20)

      if (error) throw error

      setPosts(data || [])
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

  const createPost = async () => {
    if (!newPost.trim() || !profile) return

    try {
      const { data, error } = await supabase
        .from("community_posts")
        .insert({
          user_id: profile.id,
          content: newPost.trim(),
        })
        .select(`
          *,
          users (id, username, avatar_url, tier)
        `)
        .single()

      if (error) throw error

      // Publish to Ably
      if (ably && isConnected) {
        const channel = ably.channels.get("community")
        channel.publish("new-post", data)
      }

      setNewPost("")
      toast({
        title: "Success",
        description: "Post created successfully!",
      })
    } catch (error) {
      console.error("Error creating post:", error)
      toast({
        title: "Error",
        description: "Failed to create post",
        variant: "destructive",
      })
    }
  }

  const votePost = async (postId: string, voteType: number) => {
    if (!profile) return

    try {
      const { error } = await supabase.from("post_votes").upsert({
        post_id: postId,
        user_id: profile.id,
        vote_type: voteType,
      })

      if (error) throw error

      // Fetch updated vote counts
      const { data: updatedPost } = await supabase
        .from("community_posts")
        .select("upvotes, downvotes")
        .eq("id", postId)
        .single()

      if (updatedPost && ably && isConnected) {
        const channel = ably.channels.get("community")
        channel.publish("post-vote", {
          postId,
          upvotes: updatedPost.upvotes,
          downvotes: updatedPost.downvotes,
        })
      }
    } catch (error) {
      console.error("Error voting:", error)
      toast({
        title: "Error",
        description: "Failed to vote",
        variant: "destructive",
      })
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
      default:
        return "bg-green-500"
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading posts...</div>
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
          <span className="text-sm text-gray-600">{isConnected ? "Connected" : "Disconnected"}</span>
        </div>
      </div>

      {/* Create Post */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={profile?.avatar_url || ""} />
              <AvatarFallback>{profile?.username?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{profile?.username}</p>
              <Badge className={getTierColor(profile?.tier || "grassroot")}>{profile?.tier}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="What's on your mind?"
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            rows={3}
          />
          <Button onClick={createPost} disabled={!newPost.trim()}>
            Post
          </Button>
        </CardContent>
      </Card>

      {/* Posts Feed */}
      <div className="space-y-4">
        {posts.map((post) => (
          <Card key={post.id}>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarImage src={post.users.avatar_url || ""} />
                  <AvatarFallback>{post.users.username[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{post.users.username}</p>
                  <Badge className={getTierColor(post.users.tier)}>{post.users.tier}</Badge>
                  <p className="text-sm text-gray-500">{new Date(post.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-800">{post.content}</p>

              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => votePost(post.id, 1)}
                  className="flex items-center space-x-1"
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>{post.upvotes}</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => votePost(post.id, -1)}
                  className="flex items-center space-x-1"
                >
                  <TrendingDown className="w-4 h-4" />
                  <span>{post.downvotes}</span>
                </Button>

                <Button variant="ghost" size="sm" className="flex items-center space-x-1">
                  <MessageCircle className="w-4 h-4" />
                  <span>{post.comment_count}</span>
                </Button>

                <Button variant="ghost" size="sm">
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
