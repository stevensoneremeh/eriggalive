"use client"

import type React from "react"

import { cn } from "@/lib/utils"
import { useChatScroll } from "@/hooks/use-chat-scroll"
import { useTierChat, type TierChatMessage } from "@/hooks/use-tier-chat"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Send, Crown, Star, Flame, Zap } from "lucide-react"
import { useCallback, useEffect, useState } from "react"

interface TierChatProps {
  userTier: string
  username: string
  onMessage?: (messages: TierChatMessage[]) => void
}

const tierIcons = {
  Grassroot: Star,
  Pioneer: Zap,
  Elder: Crown,
  Blood: Flame,
}

const tierColors = {
  Grassroot: "text-green-500",
  Pioneer: "text-blue-500",
  Elder: "text-purple-500",
  Blood: "text-red-500",
}

export function TierChat({ userTier, username, onMessage }: TierChatProps) {
  const { containerRef, scrollToBottom } = useChatScroll()
  const { messages, sendMessage, isConnected } = useTierChat({ userTier, username })
  const [newMessage, setNewMessage] = useState("")

  const TierIcon = tierIcons[userTier as keyof typeof tierIcons] || Star

  useEffect(() => {
    if (onMessage) {
      onMessage(messages)
    }
  }, [messages, onMessage])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const handleSendMessage = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (!newMessage.trim() || !isConnected) return

      sendMessage(newMessage)
      setNewMessage("")
    },
    [newMessage, isConnected, sendMessage],
  )

  return (
    <div className="flex flex-col h-full w-full bg-background text-foreground antialiased">
      {/* Header */}
      <div className="border-b border-border p-4">
        <div className="flex items-center space-x-3">
          <TierIcon className={cn("h-6 w-6", tierColors[userTier as keyof typeof tierColors])} />
          <div>
            <h2 className="text-lg font-semibold">{userTier} Chat</h2>
            <p className="text-sm text-muted-foreground">Exclusive chat for {userTier} tier members</p>
          </div>
          <Badge variant="secondary" className={cn("ml-auto", tierColors[userTier as keyof typeof tierColors])}>
            {userTier}
          </Badge>
        </div>
      </div>

      {/* Messages */}
      <div ref={containerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground">
            <TierIcon
              className={cn("h-12 w-12 mx-auto mb-2 opacity-50", tierColors[userTier as keyof typeof tierColors])}
            />
            <p>Welcome to the {userTier} chat!</p>
            <p>Start the conversation with your fellow {userTier} members.</p>
          </div>
        ) : null}
        <div className="space-y-1">
          {messages.map((message, index) => {
            const prevMessage = index > 0 ? messages[index - 1] : null
            const showHeader = !prevMessage || prevMessage.user.name !== message.user.name

            return (
              <div key={message.id} className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className={`flex mt-2 ${message.user.name === username ? "justify-end" : "justify-start"}`}>
                  <div
                    className={cn("max-w-[75%] w-fit flex flex-col gap-1", {
                      "items-end": message.user.name === username,
                    })}
                  >
                    {showHeader && (
                      <div
                        className={cn("flex items-center gap-2 text-xs px-3", {
                          "justify-end flex-row-reverse": message.user.name === username,
                        })}
                      >
                        <div className="flex items-center space-x-1">
                          <span className={"font-medium"}>{message.user.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {message.user.tier}
                          </Badge>
                        </div>
                        <span className="text-foreground/50 text-xs">
                          {new Date(message.createdAt).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </span>
                      </div>
                    )}
                    <div
                      className={cn(
                        "py-2 px-3 rounded-xl text-sm w-fit",
                        message.user.name === username
                          ? "bg-primary text-primary-foreground"
                          : message.isGlobal
                            ? "bg-yellow-600/20 text-yellow-200 border border-yellow-600/30"
                            : "bg-muted text-foreground",
                      )}
                    >
                      {message.isGlobal && (
                        <div className="flex items-center space-x-1 mb-1 text-xs font-medium">
                          <Crown className="h-3 w-3" />
                          <span>Global Announcement</span>
                        </div>
                      )}
                      {message.content}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <form onSubmit={handleSendMessage} className="flex w-full gap-2 border-t border-border p-4">
        <Input
          className={cn(
            "rounded-full bg-background text-sm transition-all duration-300",
            isConnected && newMessage.trim() ? "w-[calc(100%-36px)]" : "w-full",
          )}
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={`Message ${userTier} chat...`}
          disabled={!isConnected}
        />
        {isConnected && newMessage.trim() && (
          <Button
            className="aspect-square rounded-full animate-in fade-in slide-in-from-right-4 duration-300"
            type="submit"
            disabled={!isConnected}
          >
            <Send className="size-4" />
          </Button>
        )}
      </form>
    </div>
  )
}
