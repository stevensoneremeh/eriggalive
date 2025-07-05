"use client"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export interface ChatMessageProps {
  message: string
  sender?: "user" | "bot"
  avatarUrl?: string | null
  className?: string
}

export function ChatMessage({ message, sender = "bot", avatarUrl, className }: ChatMessageProps) {
  const isUser = sender === "user"

  return (
    <div className={cn("flex items-start gap-3 py-2", isUser ? "flex-row-reverse" : "", className)}>
      <Avatar className="h-8 w-8">
        {avatarUrl ? (
          <AvatarImage src={avatarUrl || "/placeholder.svg"} alt={`${sender} avatar`} />
        ) : (
          <AvatarFallback>{isUser ? "U" : "B"}</AvatarFallback>
        )}
      </Avatar>

      <p
        className={cn(
          "rounded-lg px-3 py-2 text-sm shadow-sm",
          isUser ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
        )}
      >
        {message}
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Higher-level wrapper expected by legacy code                      */
/* ------------------------------------------------------------------ */
export interface ChatMessageItemProps {
  message: {
    id: string
    content: string
    user_id: string
    username: string
    user_tier: string
    avatar_url?: string | null
    created_at: string
    likes_count?: number
    replies_count?: number
  }
  onLike?: (messageId: string) => void
  onReply?: (messageId: string) => void
}

export function ChatMessageItem({ message, onLike, onReply }: ChatMessageItemProps) {
  return (
    <ChatMessage
      message={message.content}
      sender={message.user_id ? "user" : "bot"}
      avatarUrl={message.avatar_url || undefined}
      /* Re-map extra props if needed */
      className="w-full"
    />
  )
}

/*  Keep the default export at the very end of the file  */
export default ChatMessage
