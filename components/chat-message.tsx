"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export interface ChatMessageProps {
  author: string
  message: string
  avatarUrl?: string
  timestamp?: string
}

/**
 * A minimal, reusable chat-message item.
 */
export function ChatMessage({ author, message, avatarUrl, timestamp }: ChatMessageProps) {
  return (
    <div className="flex items-start gap-3 py-2">
      <Avatar>
        <AvatarImage src={avatarUrl ?? "/placeholder-user.jpg"} alt={author} />
        <AvatarFallback>{author[0]?.toUpperCase()}</AvatarFallback>
      </Avatar>

      <div className="flex-1">
        <div className="text-sm font-medium">{author}</div>
        <p className="text-sm leading-snug">{message}</p>
        {timestamp && <div className="mt-0.5 text-xs text-muted-foreground">{timestamp}</div>}
      </div>
    </div>
  )
}

/* Default export so `import ChatMessage from '@/components/chat-message'` works */
export default ChatMessage
