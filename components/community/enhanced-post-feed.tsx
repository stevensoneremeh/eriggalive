"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { formatDistanceToNow } from "date-fns"
import { Heart, MessageCircle, Share2, Eye, Hash, Coins } from 'lucide-react'
import { cn } from "@/lib/utils"

interface Category {
  id: number
  name: string
  slug: string
  description?: string
  is_active: boolean
}

interface EnhancedPostFeedProps {
  categories: Category[]
  initialPosts: any[]
  posts: any[]
}

export function EnhancedPostFeed({ categories, initialPosts, posts }: EnhancedPostFeedProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [feedPosts, setFeedPosts] = useState<any[]>(initialPosts)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadPosts()
  }, [])

  const loadPosts = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("community_posts")
        .select(`
          *,
          users!inner (
            id, username, full_name, avatar_url, tier
          ),
          community_categories!inner (
            id, name, slug, color, icon
          )
        `)
        .eq("is_published", true)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false })
        .limit(20)

      if (error) throw error
      setFeedPosts(data || [])
    } catch (error) {
      console.error("Error loading posts:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleVote = async (postId: number, hasVoted: boolean) => {
    if (!user) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to vote on posts.",
        variant: "destructive",
      })
      return
    }

    try {
      const { error } = await supabase.rpc("handle_post_vote", {
        p_post_id: postId,
        p_user_id: user.id,
        p_vote_type: "up"
      })

      if (error) throw error

      setFeedPosts(prev => prev.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              vote_count: hasVoted ? post.vote_count - 1 : post.vote_count + 1,
              has_voted: !hasVoted 
            }
          : post
      ))

      toast({
        title: hasVoted ? "Vote Removed" : "Vote Added! 🎉",
        description: hasVoted ? "Your vote has been removed." : "Thanks for voting!",
      })
    } catch (error) {
      console.error("Error voting:", error)
      toast({
        title: "Vote Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getTierColor = (tier: string) => {
    const colors = {
      admin: "bg-red-500 text-white",
      blood: "bg-red-600 text-white",
      elder: "bg-purple-500 text-white",
      pioneer: "bg-blue-500 text-white",
      grassroot: "bg-green-500 text-white",
    }
    return colors[tier as keyof typeof colors] || "bg-gray-500 text-white"
  }

  const renderContent = (content: string) => {
    let html = content.replace(/#(\w+)/g, '<span class="text-blue-600 font-medium cursor-pointer">#$1</span>')
    html = html.replace(/@(\w+)/g, '<span class="text-purple-600 font-medium cursor-pointer">@$1</span>')
    return { __html: html }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-muted rounded-full" />
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-32" />
                  <div className="h-3 bg-muted rounded w-24" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="h-4 bg-muted rounded w-full" />
                <div className="h-4 bg-muted rounded w-3/4" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (feedPosts.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No posts yet</h3>
          <p className="text-muted-foreground">Be the first to share something with the community!</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {feedPosts.map((post) => (
        <Card key={post.id} className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage 
                    src={post.users?.avatar_url || "/placeholder-user.jpg"} 
                    alt={post.users?.username} 
                  />
                  <AvatarFallback>
                    {post.users?.username?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-semibold">{post.users?.full_name || post.users?.username}</span>
                    <Badge className={getTierColor(post.users?.tier || "grassroot")}>
                      {(post.users?.tier || "grassroot").replace("_", " ").toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>@{post.users?.username}</span>
                    <span>•</span>
                    <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div
                className="prose prose-sm max-w-none dark:prose-invert leading-relaxed"
                dangerouslySetInnerHTML={renderContent(post.content)}
              />
              {post.hashtags && post.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {post.hashtags.slice(0, 5).map((hashtag: string, index: number) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900"
                    >
                      <Hash className="h-3 w-3 mr-1" />
                      {hashtag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "flex items-center gap-2 hover:bg-green-100 dark:hover:bg-green-900/20",
                    post.has_voted && "text-green-600 bg-green-50 dark:bg-green-900/20",
                  )}
                  onClick={() => handleVote(post.id, post.has_voted || false)}
                >
                  <Heart className={cn("h-5 w-5", post.has_voted && "fill-current")} />
                  <span className="font-medium">{post.vote_count || 0}</span>
                  <Coins className="h-4 w-4 text-yellow-500" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2 hover:bg-blue-100 dark:hover:bg-blue-900/20"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>{post.comment_count || 0}</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2 hover:bg-purple-100 dark:hover:bg-purple-900/20"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  <span>{post.view_count || 0}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
