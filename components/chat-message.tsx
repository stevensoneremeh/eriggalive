/**
 * Unified ChatMessage component – now exported both as default **and** named
 * so imports like `import ChatMessage from "@/components/chat-message"`
 * and   `import { ChatMessage } from "@/components/chat-message"`
 * are both valid.
 */
"use client"

import { cn } from "@/lib/utils"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

export interface ChatMessageProps {
  id?: string
  author: { name: string; avatarUrl?: string }
  content: string
  timestamp?: string
  className?: string
}

export function ChatMessage({ author, content, timestamp, className }: ChatMessageProps) {
  return (
    <div className={cn("flex items-start gap-3 rounded-lg px-4 py-3 hover:bg-muted/50 transition-colors", className)}>
      <Avatar className="h-9 w-9">
        <AvatarImage src={author.avatarUrl ?? "/placeholder-user.jpg"} alt={author.name} />
        <AvatarFallback>
          {author.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">
          {author.name} {timestamp && <span className="ml-1 text-xs text-muted-foreground">{timestamp}</span>}
        </p>
        <p className="text-sm whitespace-pre-wrap break-words">{content}</p>
      </div>
    </div>
  )
}

export default ChatMessage
