"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { formatDistanceToNow } from "date-fns"
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  MoreHorizontal,
  ThumbsUp,
  Coins,
  Edit,
  Trash2,
  Flag
} from "lucide-react"
import { VoteButton } from "./vote-button"
import { CommentSection } from "./comment-section"
import { useToast } from "@/components/ui/use-toast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface PostCardProps {
  post: any
  currentUserId?: string
  onVoteUpdate?: (postId: number, newVoteCount: number, hasVoted: boolean) => void
}

export function PostCard({ post, currentUserId, onVoteUpdate }: PostCardProps) {
  const [showComments, setShowComments] = useState(false)
  const [voteCount, setVoteCount] = useState(post.vote_count || 0)
  const [hasVoted, setHasVoted] = useState(post.has_voted || false)
  const { toast } = useToast()

  const handleVoteSuccess = (newVoteCount: number, newHasVoted: boolean) => {
    setVoteCount(newVoteCount)
    setHasVoted(newHasVoted)
    onVoteUpdate?.(post.id, newVoteCount, newHasVoted)
  }

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Post by ${post.user?.username}`,
          text: post.content.slice(0, 100) + "...",
          url: window.location.href,
        })
      } else {
        await navigator.clipboard.writeText(window.location.href)
        toast({
          title: "Link Copied",
          description: "Post link copied to clipboard",
        })
      }
    } catch (error) {
      console.error("Error sharing:", error)
    }
  }

  const renderMedia = () => {
    if (!post.media_url) return null

    switch (post.media_type) {
      case "image":
        return (
          <div className="mt-3 rounded-lg overflow-hidden">
            <img
              src={post.media_url}
              alt="Post media"
              className="w-full h-auto max-h-96 object-cover"
            />
          </div>
        )
      case "video":
        return (
          <div className="mt-3 rounded-lg overflow-hidden">
            <video
              src={post.media_url}
              controls
              className="w-full h-auto max-h-96"
            />
          </div>
        )
      case "audio":
        return (
          <div className="mt-3 p-4 bg-muted rounded-lg">
            <audio src={post.media_url} controls className="w-full" />
          </div>
        )
      default:
        return null
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage 
                src={post.user?.avatar_url || "/placeholder-user.jpg"} 
                alt={post.user?.username} 
              />
              <AvatarFallback>
                {post.user?.username?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="font-semibold text-sm">
                  {post.user?.full_name || post.user?.username}
                </h4>
                <Badge variant="secondary" className="text-xs">
                  {post.user?.tier || "grassroot"}
                </Badge>
              </div>
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <span>@{post.user?.username}</span>
                <span>•</span>
                <span>{formatDistanceToNow(new Date(post.created_at))} ago</span>
                {post.category && (
                  <>
                    <span>•</span>
                    <Badge variant="outline" className="text-xs">
                      {post.category.name}
                    </Badge>
                  </>
                )}
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {currentUserId === post.user?.auth_user_id && (
                <>
                  <DropdownMenuItem>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Post
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Post
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuItem>
                <Flag className="mr-2 h-4 w-4" />
                Report Post
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Post Content */}
          <div className="prose prose-sm max-w-none">
            <p className="whitespace-pre-wrap">{post.content}</p>
          </div>

          {/* Media */}
          {renderMedia()}

          {/* Post Actions */}
          <div className="flex items-center justify-between pt-3">
            <div className="flex items-center space-x-4">
              <VoteButton
                postId={post.id}
                postCreatorId={post.user?.auth_user_id}
                initialVoteCount={voteCount}
                initialHasVoted={hasVoted}
                currentUserId={currentUserId}
                onVoteSuccess={handleVoteSuccess}
              />

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowComments(!showComments)}
                className="text-muted-foreground hover:text-foreground"
              >
                <MessageCircle className="mr-1.5 h-4 w-4" />
                {post.comment_count || 0}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className="text-muted-foreground hover:text-foreground"
              >
                <Share2 className="mr-1.5 h-4 w-4" />
                Share
              </Button>
            </div>
          </div>

          {/* Comments Section */}
          {showComments && (
            <>
              <Separator />
              <CommentSection 
                postId={post.id} 
                currentUserId={currentUserId}
              />
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function PostCardSkeleton() {
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 bg-muted rounded-full animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted rounded animate-pulse w-1/4" />
            <div className="h-3 bg-muted rounded animate-pulse w-1/3" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="h-4 bg-muted rounded animate-pulse w-full" />
          <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
          <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
          <div className="flex space-x-4 pt-3">
            <div className="h-8 bg-muted rounded animate-pulse w-16" />
            <div className="h-8 bg-muted rounded animate-pulse w-16" />
            <div className="h-8 bg-muted rounded animate-pulse w-16" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
