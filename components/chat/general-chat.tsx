"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Send, Users } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import ChatMessage from "@/components/chat-message"

interface ChatMessageType {
  id: string
  content: string
  author: { username: string }
  created_at: string
}

interface GeneralChatProps {
  roomId?: string
  roomName?: string
  initialMessages?: ChatMessageType[]
}

export function GeneralChat({ roomId = "general", roomName = "General Chat", initialMessages = [] }: GeneralChatProps) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<ChatMessageType[]>(initialMessages)
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return

    setIsLoading(true)

    const message: ChatMessageType = {
      id: crypto.randomUUID(),
      content: newMessage.trim(),
      author: { username: user.user_metadata?.username || "You" },
      created_at: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, message])
    setNewMessage("")
    setIsLoading(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          {roomName}
          <Badge variant="secondary" className="ml-auto">
            {messages.length} messages
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSendMessage()
          }}
          className="flex gap-2 border-t p-4"
        >
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={user ? "Type your message..." : "Please sign in to join the conversation"}
            disabled={!user || isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={!newMessage.trim() || isLoading} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export default GeneralChat
