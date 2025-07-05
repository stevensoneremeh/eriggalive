"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Heart, MessageCircle, Share2, MoreHorizontal } from "lucide-react"
import { useState } from "react"

interface ChatMessageProps {
  id: string
  content: string
  author: {
    id: string
    username: string
    avatar?: string
    tier: string
  }
  timestamp: string
  likes?: number
  replies?: number
  isLiked?: boolean
  onLike?: (messageId: string) => void
  onReply?: (messageId: string) => void
  onShare?: (messageId: string) => void
}

export function ChatMessage({
  id,
  content,
  author,
  timestamp,
  likes = 0,
  replies = 0,
  isLiked = false,
  onLike,
  onReply,
  onShare,
}: ChatMessageProps) {
  const [liked, setLiked] = useState(isLiked)
  const [likeCount, setLikeCount] = useState(likes)

  const handleLike = () => {
    setLiked(!liked)
    setLikeCount(liked ? likeCount - 1 : likeCount + 1)
    onLike?.(id)
  }

  const getTierColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case "admin":
        return "bg-red-500"
      case "mod":
        return "bg-purple-500"
      case "elder":
        return "bg-yellow-500"
      case "blood":
        return "bg-orange-500"
      case "pioneer":
        return "bg-blue-500"
      default:
        return "bg-green-500"
    }
  }

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={author.avatar || "/placeholder.svg"} alt={author.username} />
            <AvatarFallback>{author.username.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <span className="font-semibold text-sm">{author.username}</span>
              <Badge className={`${getTierColor(author.tier)} text-white text-xs`}>{author.tier}</Badge>
              <span className="text-xs text-muted-foreground">{timestamp}</span>
            </div>

            <p className="text-sm text-foreground mb-3">{content}</p>

            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                className={`h-8 px-2 ${liked ? "text-red-500" : "text-muted-foreground"}`}
                onClick={handleLike}
              >
                <Heart className={`h-4 w-4 mr-1 ${liked ? "fill-current" : ""}`} />
                {likeCount}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-muted-foreground"
                onClick={() => onReply?.(id)}
              >
                <MessageCircle className="h-4 w-4 mr-1" />
                {replies}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-muted-foreground"
                onClick={() => onShare?.(id)}
              >
                <Share2 className="h-4 w-4" />
              </Button>

              <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground ml-auto">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export interface ChatMessageItemProps {
  message: {
    id: string
    content: string
    user_id: string
    username: string
    user_tier: string
    avatar_url?: string
    created_at: string
    likes_count?: number
    replies_count?: number
  }
  currentUserId?: string
  onLike?: (messageId: string) => void
  onReply?: (messageId: string) => void
}

export function ChatMessageItem({ message, currentUserId, onLike, onReply }: ChatMessageItemProps) {
  return (
    <ChatMessage
      id={message.id}
      content={message.content}
      author={{
        id: message.user_id,
        username: message.username,
        avatar: message.avatar_url,
        tier: message.user_tier,
      }}
      timestamp={new Date(message.created_at).toLocaleTimeString()}
      likes={message.likes_count || 0}
      replies={message.replies_count || 0}
      onLike={onLike}
      onReply={onReply}
    />
  )
}
