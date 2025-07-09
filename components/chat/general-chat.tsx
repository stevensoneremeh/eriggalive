"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Send, Users } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

interface Message {
  id: string
  user: {
    id: string
    username: string
    avatar_url?: string
    tier: string
  }
  content: string
  timestamp: Date
}

interface GeneralChatProps {
  roomId?: string
  roomName?: string
}

export function GeneralChat({ roomId = "general", roomName = "General Chat" }: GeneralChatProps) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Mock messages for demo
  useEffect(() => {
    const mockMessages: Message[] = [
      {
        id: "1",
        user: {
          id: "user1",
          username: "EriggaFan1",
          avatar_url: "/placeholder-user.jpg",
          tier: "pioneer",
        },
        content: "What's everyone's favorite Erigga track?",
        timestamp: new Date(Date.now() - 300000),
      },
      {
        id: "2",
        user: {
          id: "user2",
          username: "WarriPikin",
          avatar_url: "/placeholder-user.jpg",
          tier: "elder",
        },
        content: "Paper Boi is a classic! 🔥",
        timestamp: new Date(Date.now() - 240000),
      },
      {
        id: "3",
        user: {
          id: "user3",
          username: "SouthSouthVibes",
          avatar_url: "/placeholder-user.jpg",
          tier: "grassroot",
        },
        content: "The Erigma album was incredible",
        timestamp: new Date(Date.now() - 180000),
      },
    ]
    setMessages(mockMessages)
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return

    setIsLoading(true)

    const message: Message = {
      id: Date.now().toString(),
      user: {
        id: user.id,
        username: user.username || "Anonymous",
        avatar_url: user.avatar_url,
        tier: user.tier || "grassroot",
      },
      content: newMessage.trim(),
      timestamp: new Date(),
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

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "elder":
        return "bg-yellow-500"
      case "pioneer":
        return "bg-purple-500"
      case "grassroot":
        return "bg-gray-500"
      default:
        return "bg-blue-500"
    }
  }

  const getTierLabel = (tier: string) => {
    switch (tier) {
      case "elder":
        return "Elder"
      case "pioneer":
        return "Pioneer"
      case "grassroot":
        return "Grassroot"
      default:
        return "Member"
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
            <div key={message.id} className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={message.user.avatar_url || "/placeholder.svg"} />
                <AvatarFallback>{message.user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{message.user.username}</span>
                  <Badge variant="secondary" className={`text-xs text-white ${getTierColor(message.user.tier)}`}>
                    {getTierLabel(message.user.tier)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{message.timestamp.toLocaleTimeString()}</span>
                </div>
                <p className="text-sm">{message.content}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="border-t p-4">
          {user ? (
            <div className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button onClick={handleSendMessage} disabled={!newMessage.trim() || isLoading} size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="text-center text-muted-foreground">Please sign in to join the conversation</div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default GeneralChat
