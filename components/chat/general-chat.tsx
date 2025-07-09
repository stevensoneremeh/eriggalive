"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Send, Smile, Paperclip, MoreVertical, Heart, Reply, Flag } from 'lucide-react'
import { useAuth } from "@/contexts/auth-context"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  content: string
  user: {
    id: string
    username: string
    fullName: string
    avatar: string
    tier: string
  }
  timestamp: Date
  likes: number
  hasLiked: boolean
  replies?: Message[]
}

interface GeneralChatProps {
  className?: string
}

const SAMPLE_MESSAGES: Message[] = [
  {
    id: "1",
    content: "Welcome to the general chat! 🎵 Let's keep the energy high and the vibes positive!",
    user: {
      id: "erigga",
      username: "eriggaofficial",
      fullName: "Erigga",
      avatar: "/placeholder-user.jpg",
      tier: "blood"
    },
    timestamp: new Date(Date.now() - 3600000),
    likes: 24,
    hasLiked: false
  },
  {
    id: "2",
    content: "Just heard the new track! Fire as always 🔥🔥🔥",
    user: {
      id: "fan1",
      username: "warriking",
      fullName: "Warri King",
      avatar: "/placeholder-user.jpg",
      tier: "pioneer"
    },
    timestamp: new Date(Date.now() - 1800000),
    likes: 8,
    hasLiked: true
  },
  {
    id: "3",
    content: "When's the next concert? Can't wait to see you live again! 🎤",
    user: {
      id: "fan2",
      username: "southsideboy",
      fullName: "Southside Boy",
      avatar: "/placeholder-user.jpg",
      tier: "elder"
    },
    timestamp: new Date(Date.now() - 900000),
    likes: 5,
    hasLiked: false
  }
]

export function GeneralChat({ className }: GeneralChatProps) {
  const { profile } = useAuth()
  const [messages, setMessages] = useState<Message[]>(SAMPLE_MESSAGES)
  const [newMessage, setNewMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const getTierColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case "blood":
        return "bg-red-500"
      case "elder":
        return "bg-purple-500"
      case "pioneer":
        return "bg-blue-500"
      case "grassroot":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  const handleSendMessage = () => {
    if (!newMessage.trim() || !profile) return

    const message: Message = {
      id: Date.now().toString(),
      content: newMessage,
      user: {
        id: profile.id.toString(),
        username: profile.username,
        fullName: profile.full_name,
        avatar: profile.avatar_url || "/placeholder-user.jpg",
        tier: profile.tier
      },
      timestamp: new Date(),
      likes: 0,
      hasLiked: false
    }

    setMessages(prev => [...prev, message])
    setNewMessage("")
  }

  const handleLikeMessage = (messageId: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { 
            ...msg, 
            likes: msg.hasLiked ? msg.likes - 1 : msg.likes + 1,
            hasLiked: !msg.hasLiked 
          }
        : msg
    ))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Chat Header */}
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">General Chat</CardTitle>
            <p className="text-sm text-muted-foreground">
              {messages.length} messages • {Math.floor(Math.random() * 50) + 20} online
            </p>
          </div>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      {/* Messages */}
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-[500px] p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className="group">
                <div className="flex items-start space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={message.user.avatar || "/placeholder.svg"} />
                    <AvatarFallback>
                      {message.user.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-sm">{message.user.username}</span>
                      <Badge 
                        className={cn(
                          "text-xs px-1.5 py-0.5",
                          getTierColor(message.user.tier),
                          "text-white"
                        )}
                      >
                        {message.user.tier}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(message.timestamp, { addSuffix: true })}
                      </span>
                    </div>
                    
                    <p className="text-sm text-foreground mb-2 break-words">
                      {message.content}
                    </p>
                    
                    {/* Message Actions */}
                    <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "h-6 px-2 text-xs",
                          message.hasLiked && "text-red-500"
                        )}
                        onClick={() => handleLikeMessage(message.id)}
                      >
                        <Heart className={cn(
                          "h-3 w-3 mr-1",
                          message.hasLiked && "fill-current"
                        )} />
                        {message.likes}
                      </Button>
                      
                      <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                        <Reply className="h-3 w-3 mr-1" />
                        Reply
                      </Button>
                      
                      <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                        <Flag className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                </div>
                <span>Someone is typing...</span>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </CardContent>

      {/* Message Input */}
      <div className="border-t p-4">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" className="shrink-0">
            <Paperclip className="h-4 w-4" />
          </Button>
          
          <div className="flex-1 relative">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={profile ? "Type a message..." : "Sign in to chat"}
              disabled={!profile}
              className="pr-10"
            />
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
            >
              <Smile className="h-4 w-4" />
            </Button>
          </div>
          
          <Button 
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || !profile}
            className="shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        
        {!profile && (
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Please sign in to participate in the chat
          </p>
        )}
      </div>
    </div>
  )
}

export default GeneralChat
