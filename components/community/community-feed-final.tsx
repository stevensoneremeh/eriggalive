"use client"

import { useState } from "react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { ArrowBigUp, MessageCircle, Share2, Eye, Hash, Coins } from "lucide-react"
import { cn } from "@/lib/utils"

interface CommunityFeedProps {
  posts: any[]
  currentUser: any
}

export function CommunityFeed({ posts: initialPosts, currentUser }: CommunityFeedProps) {
  const [posts, setPosts] = useState(initialPosts)
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  const handleVote = async (postId: number, hasVoted: boolean) => {
    if (!currentUser) {
      toast({
        title: "Login Required",
        description: "Please login to vote on posts.",
        variant: "destructive",
      })
      return
    }

    try {
      const { data, error } = await supabase.rpc("vote_on_post", {
        p_post_id: postId,
        p_user_id: currentUser.id,
      })

      if (error) {
        throw error
      }

      // Update local state
      setPosts((prevPosts) =>
        prevPosts.map((post) => {
          if (post.id === postId) {
            return {
              ...post,
              has_voted: !hasVoted,
              vote_count: hasVoted ? post.vote_count - 1 : post.vote_count + 1,
            }
          }
          return post
        }),
      )

      toast({
        title: hasVoted ? "Vote Removed" : "Vote Added! 🎉",
        description: hasVoted
          ? "Your vote has been removed."
          : `100 Erigga Coins transferred to @${posts.find((p) => p.id === postId)?.users?.username}`,
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
      blood_brotherhood: "bg-red-600 text-white",
      elder: "bg-purple-500 text-white",
      pioneer: "bg-blue-500 text-white",
      grassroot: "bg-green-500 text-white",
    }
    return colors[tier as keyof typeof colors] || "bg-gray-500 text-white"
  }

  const renderContent = (content: string) => {
    // Replace hashtags with styled spans
    let processedContent = content.replace(
      /#(\w+)/g,
      '<span class="text-blue-500 font-medium cursor-pointer hover:text-blue-600">#$1</span>',
    )

    // Replace mentions with styled spans
    processedContent = processedContent.replace(
      /@(\w+)/g,
      '<span class="text-purple-500 font-medium cursor-pointer hover:text-purple-600">@$1</span>',
    )

    return { __html: processedContent }
  }

  if (posts.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <div className="text-gray-500 dark:text-gray-400">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No posts yet</h3>
            <p>Be the first to share something with the community!</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <Card
          key={post.id}
          className="shadow-lg hover:shadow-xl transition-all duration-300 border-0 bg-white dark:bg-gray-800"
        >
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4 flex-1">
                <Avatar className="h-12 w-12 ring-2 ring-gray-200 dark:ring-gray-700">
                  <AvatarImage src={post.users?.avatar_url || "/placeholder-user.jpg"} alt={post.users?.username} />
                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold">
                    {post.users?.username?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-lg">{post.users?.full_name || post.users?.username}</span>
                    <Badge className={getTierColor(post.users?.tier)}>
                      {post.users?.tier?.replace("_", " ").toUpperCase() || "GRASSROOT"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-1">
                    <span>@{post.users?.username}</span>
                    <span>•</span>
                    <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                    <span>•</span>
                    <Badge
                      variant="outline"
                      style={{
                        backgroundColor: post.community_categories?.color + "20",
                        borderColor: post.community_categories?.color,
                        color: post.community_categories?.color,
                      }}
                    >
                      {post.community_categories?.icon} {post.community_categories?.name}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pb-4">
            <div
              className="prose prose-sm max-w-none dark:prose-invert leading-relaxed text-gray-800 dark:text-gray-200"
              dangerouslySetInnerHTML={renderContent(post.content)}
            />

            {/* Hashtags */}
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
          </CardContent>

          <CardFooter className="pt-4 border-t bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-1">
                {/* Vote Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "flex items-center gap-2 hover:bg-green-100 dark:hover:bg-green-900/20",
                    post.has_voted && "text-green-600 bg-green-50 dark:bg-green-900/20",
                  )}
                  onClick={() => handleVote(post.id, post.has_voted)}
                  disabled={post.users?.id === currentUser?.id}
                >
                  <ArrowBigUp className={cn("h-5 w-5", post.has_voted && "fill-current")} />
                  <span className="font-medium">{post.vote_count}</span>
                  <Coins className="h-4 w-4 text-yellow-500" />
                </Button>

                {/* Comments */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2 hover:bg-blue-100 dark:hover:bg-blue-900/20"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>{post.comment_count}</span>
                </Button>

                {/* Share */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2 hover:bg-purple-100 dark:hover:bg-purple-900/20"
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  <span>{post.view_count || 0}</span>
                </div>
              </div>
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
