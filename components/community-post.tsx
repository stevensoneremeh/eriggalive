"use client"

import { useState } from "react"
import Image from "next/image"
import { formatDistanceToNow } from "date-fns"
import { MessageSquare, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { UserTierBadge } from "@/components/user-tier-badge"
import { VoteButtons } from "@/components/vote-buttons"
import { useAuth } from "@/contexts/auth-context"

type Post = {
  id: string
  user_id: string
  username: string
  user_tier: string
  content: string
  media_url?: string
  media_type?: string
  created_at: string
  upvotes: number
  downvotes: number
  comments_count: number
  has_voted?: boolean | null
  vote_type?: "up" | "down" | null
}

interface CommunityPostProps {
  post: Post
  onVote: (postId: string, voteType: "up" | "down") => void
}

export function CommunityPost({ post, onVote }: CommunityPostProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const { user } = useAuth()

  const handleVote = (voteType: "up" | "down") => {
    if (!user) {
      // Show login prompt or handle unauthenticated user
      return
    }
    onVote(post.id, voteType)
  }

  const formattedDate = formatDistanceToNow(new Date(post.created_at), { addSuffix: true })

  // Determine if content should be truncated
  const shouldTruncate = post.content.length > 300 && !isExpanded
  const displayContent = shouldTruncate ? `${post.content.substring(0, 300)}...` : post.content

  return (
    <Card className="overflow-hidden border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-brand-lime to-brand-teal dark:from-gray-700 dark:to-gray-600 flex items-center justify-center text-white font-bold text-lg">
            {post.username.charAt(0).toUpperCase()}
          </div>
          <div className="ml-3">
            <div className="flex items-center">
              <span className="font-medium text-gray-900 dark:text-white">{post.username}</span>
              <UserTierBadge tier={post.user_tier} className="ml-2" />
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">{formattedDate}</span>
          </div>
        </div>

        <div className="prose prose-sm max-w-none dark:prose-invert text-gray-800 dark:text-gray-200">
          <p className="whitespace-pre-line">{displayContent}</p>
          {shouldTruncate && (
            <button
              onClick={() => setIsExpanded(true)}
              className="text-brand-teal dark:text-brand-lime hover:underline mt-1 text-sm font-medium"
            >
              Read more
            </button>
          )}
        </div>

        {post.media_url && (
          <div className="mt-4 rounded-lg overflow-hidden">
            {post.media_type === "image" ? (
              <div className="relative aspect-video w-full">
                <Image
                  src={post.media_url || "/placeholder.svg"}
                  alt="Post media"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 768px"
                />
              </div>
            ) : post.media_type === "video" ? (
              <video
                src={post.media_url}
                controls
                className="w-full rounded-lg"
                poster="/placeholder.svg?height=400&width=600"
              />
            ) : null}
          </div>
        )}
      </CardContent>

      <CardFooter className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <VoteButtons
            upvotes={post.upvotes}
            downvotes={post.downvotes}
            userVote={post.vote_type}
            onVote={handleVote}
          />
          <Button variant="ghost" size="sm" className="text-gray-600 dark:text-gray-300">
            <MessageSquare className="h-4 w-4 mr-1" />
            <span>{post.comments_count}</span>
          </Button>
        </div>
        <Button variant="ghost" size="sm" className="text-gray-600 dark:text-gray-300">
          <Share2 className="h-4 w-4 mr-1" />
          <span>Share</span>
        </Button>
      </CardFooter>
    </Card>
  )
}
