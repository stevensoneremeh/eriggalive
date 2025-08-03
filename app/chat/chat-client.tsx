"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, Send, Users } from "lucide-react"
import { motion } from "framer-motion"

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
    },
  },
}

export function ChatClient() {
  const { user, profile } = useAuth()
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState([
    {
      id: 1,
      user: { name: "Erigga Fan", avatar: "/placeholder-user.jpg", tier: "pioneer" },
      message: "Welcome to the Erigga Live chat! 🎵",
      timestamp: new Date(),
    },
    {
      id: 2,
      user: { name: "Music Lover", avatar: "/placeholder-user.jpg", tier: "grassroot" },
      message: "Can't wait for the next album drop! 🔥",
      timestamp: new Date(),
    },
  ])

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "grassroot":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "pioneer":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
      case "elder":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "blood_brotherhood":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || !profile) return

    const newMessage = {
      id: messages.length + 1,
      user: {
        name: profile.full_name || profile.username,
        avatar: profile.avatar_url || "/placeholder-user.jpg",
        tier: profile.tier,
      },
      message: message.trim(),
      timestamp: new Date(),
    }

    setMessages([...messages, newMessage])
    setMessage("")
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 pt-20 pb-8"
    >
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div variants={cardVariants} initial="hidden" animate="visible" className="space-y-6">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
              Live Chat
            </h1>
            <p className="text-muted-foreground">Connect with fellow Erigga fans in real-time</p>
          </div>

          {/* Chat Room */}
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>General Chat</span>
                <Badge variant="secondary" className="ml-auto">
                  {messages.length + 1} online
                </Badge>
              </CardTitle>
            </CardHeader>

            {/* Messages */}
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, index) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start space-x-3"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={msg.user.avatar || "/placeholder.svg"} alt={msg.user.name} />
                    <AvatarFallback>{msg.user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-sm">{msg.user.name}</span>
                      <Badge className={`text-xs ${getTierColor(msg.user.tier)}`}>
                        {msg.user.tier?.replace("_", " ").toUpperCase()}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{msg.timestamp.toLocaleTimeString()}</span>
                    </div>
                    <p className="text-sm bg-muted/50 rounded-lg p-2">{msg.message}</p>
                  </div>
                </motion.div>
              ))}
            </CardContent>

            {/* Message Input */}
            <div className="border-t p-4">
              <form onSubmit={handleSendMessage} className="flex space-x-2">
                <Input
                  placeholder="Type your message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" disabled={!message.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </Card>

          {/* Chat Rules */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageCircle className="h-5 w-5" />
                <span>Chat Guidelines</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Be respectful to all community members</li>
                <li>• No spam or excessive self-promotion</li>
                <li>• Keep discussions relevant to Erigga and music</li>
                <li>• Report inappropriate behavior to moderators</li>
                <li>• Have fun and enjoy the conversation! 🎵</li>
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}
