"use client"
import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import { Heart, MessageCircle, Share2, MoreHorizontal, Flag } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface ChatMessageProps {
  id: string
  content: string
  author: {
    id: string
    username: string
    avatar_url?: string
    tier: string
  }
  timestamp: string
  likes?: number
  replies?: number
  isLiked?: boolean
  onLike?: (messageId: string) => void
  onReply?: (messageId: string) => void
  onReport?: (messageId: string) => void
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
  onReport,
}: ChatMessageProps) {
  const [localLikes, setLocalLikes] = useState(likes)
  const [localIsLiked, setLocalIsLiked] = useState(isLiked)

  const getTierColor = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case "admin":
        return "bg-red-500"
      case "mod":
        return "bg-orange-500"
      case "grassroot":
        return "bg-green-500"
      case "pioneer":
        return "bg-blue-500"
      case "elder":
        return "bg-purple-500"
      case "blood":
        return "bg-red-800"
      default:
        return "bg-gray-500"
    }
  }

  const handleLike = () => {
    if (onLike) {
      onLike(id)
      setLocalIsLiked(!localIsLiked)
      setLocalLikes(localIsLiked ? localLikes - 1 : localLikes + 1)
    }
  }

  const handleReply = () => {
    if (onReply) {
      onReply(id)
    }
  }

  const handleReport = () => {
    if (onReport) {
      onReport(id)
    }
  }

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={author.avatar_url || "/placeholder-user.jpg"} alt={author.username} />
            <AvatarFallback>{author.username.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <span className="font-semibold text-sm">{author.username}</span>
              <Badge className={`${getTierColor(author.tier)} text-white text-xs`}>{author.tier}</Badge>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(timestamp), { addSuffix: true })}
              </span>
            </div>

            <div className="text-sm mb-3 break-words">{content}</div>

            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                className={`h-8 px-2 ${localIsLiked ? "text-red-500" : "text-muted-foreground"}`}
                onClick={handleLike}
              >
                <Heart className={`h-4 w-4 mr-1 ${localIsLiked ? "fill-current" : ""}`} />
                {localLikes}
              </Button>

              <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground" onClick={handleReply}>
                <MessageCircle className="h-4 w-4 mr-1" />
                {replies}
              </Button>

              <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground">
                <Share2 className="h-4 w-4" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleReport}>
                    <Flag className="h-4 w-4 mr-2" />
                    Report
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Export both named and default exports for compatibility
export const ChatMessageItem = ChatMessage
export default ChatMessage
