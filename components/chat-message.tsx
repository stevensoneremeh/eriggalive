"use client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { formatDistanceToNow } from "date-fns"

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
  isOwn?: boolean
}

export function ChatMessage({ id, content, author, timestamp, isOwn = false }: ChatMessageProps) {
  const getTierColor = (tier: string) => {
    switch (tier?.toLowerCase()) {
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
    <Card className={`mb-4 ${isOwn ? "ml-auto max-w-[80%]" : "mr-auto max-w-[80%]"}`}>
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={author.avatar_url || "/placeholder.svg"} alt={author.username} />
            <AvatarFallback>{author.username.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <span className="font-medium text-sm">{author.username}</span>
              <Badge className={`${getTierColor(author.tier)} text-white text-xs`}>{author.tier}</Badge>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(timestamp), { addSuffix: true })}
              </span>
            </div>
            <p className="text-sm text-foreground break-words">{content}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Wrapper component for backward compatibility
export function ChatMessageItem(props: ChatMessageProps) {
  return <ChatMessage {...props} />
}

// Default export
export default ChatMessage
