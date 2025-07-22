"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { useParams, useRouter } from "next/navigation"
import {
  Send,
  Smile,
  Paperclip,
  Heart,
  Reply,
  Flag,
  Users,
  Crown,
  Star,
  Zap,
  Shield,
  Lock,
  ArrowLeft,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"
import Link from "next/link"

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
}

const TIER_CONFIG = {
  grassroot: {
    name: "Street Rep",
    icon: Star,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/20",
    description: "For the grassroot fans",
    level: 1,
  },
  pioneer: {
    name: "Warri Elite",
    icon: Zap,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
    description: "Pioneer tier discussions",
    level: 2,
  },
  elder: {
    name: "Erigma Circle",
    icon: Crown,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/20",
    description: "Elder tier exclusive",
    level: 3,
  },
  blood: {
    name: "Blood Brotherhood",
    icon: Heart,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20",
    description: "Ultimate tier sanctuary",
    level: 4,
  },
}

const TIER_HIERARCHY = {
  grassroot: 1,
  pioneer: 2,
  elder: 3,
  blood_brotherhood: 4,
  admin: 5,
}

export default function TierChatPage() {
  const params = useParams()
  const router = useRouter()
  const { user, profile, loading } = useAuth()
  const { toast } = useToast()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [onlineCount, setOnlineCount] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const tierParam = params.tier as string
  const tierConfig = TIER_CONFIG[tierParam as keyof typeof TIER_CONFIG]

  useEffect(() => {
    if (!tierConfig) {
      router.push("/chat")
      return
    }

    // Load sample messages for this tier
    const sampleMessages: Message[] = [
      {
        id: "1",
        content: `Welcome to ${tierConfig.name}! This is an exclusive space for ${tierParam} tier members.`,
        user: {
          id: "mod",
          username: "moderator",
          fullName: "Chat Moderator",
          avatar: "/placeholder.svg",
          tier: "admin",
        },
        timestamp: new Date(Date.now() - 7200000),
        likes: 15,
        hasLiked: false,
      },
      {
        id: "2",
        content: "The energy in this tier is different! Love the exclusive discussions we have here 🔥",
        user: {
          id: "member1",
          username: "tiermember1",
          fullName: "Tier Member",
          avatar: "/placeholder.svg",
          tier: tierParam,
        },
        timestamp: new Date(Date.now() - 3600000),
        likes: 8,
        hasLiked: false,
      },
    ]

    setMessages(sampleMessages)
    setOnlineCount(Math.floor(Math.random() * 50) + 10)
  }, [tierParam, tierConfig, router])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const canAccessTier = () => {
    if (!profile) return false

    const userTierLevel = TIER_HIERARCHY[profile.tier as keyof typeof TIER_HIERARCHY] || 0
    const requiredTierLevel = TIER_HIERARCHY[tierParam as keyof typeof TIER_HIERARCHY] || 0

    return userTierLevel >= requiredTierLevel
  }

  const getTierColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case "blood_brotherhood":
      case "blood":
        return "bg-red-500"
      case "elder":
        return "bg-purple-500"
      case "pioneer":
        return "bg-blue-500"
      case "grassroot":
        return "bg-green-500"
      case "admin":
        return "bg-gray-800"
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
        fullName: profile.full_name || profile.username,
        avatar: profile.avatar_url || "/placeholder.svg",
        tier: profile.tier,
      },
      timestamp: new Date(),
      likes: 0,
      hasLiked: false,
    }

    setMessages((prev) => [...prev, message])
    setNewMessage("")
  }

  const handleLikeMessage = (messageId: string) => {
    if (!profile) return

    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId
          ? {
              ...msg,
              likes: msg.hasLiked ? msg.likes - 1 : msg.likes + 1,
              hasLiked: !msg.hasLiked,
            }
          : msg,
      ),
    )
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading chat...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!tierConfig) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-2xl font-semibold mb-2">Invalid Chat Room</h3>
              <p className="text-muted-foreground mb-6">The requested chat room does not exist.</p>
              <Button asChild>
                <Link href="/chat">Back to Chat Rooms</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-2xl font-semibold mb-2">Sign In Required</h3>
              <p className="text-muted-foreground mb-6">Please sign in to access tier-based chat rooms</p>
              <div className="flex gap-4 justify-center">
                <Button asChild>
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/signup">Create Account</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!canAccessTier()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <Lock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-2xl font-semibold mb-2">Access Restricted</h3>
              <p className="text-muted-foreground mb-2">This chat room requires {tierParam} tier or higher.</p>
              <p className="text-muted-foreground mb-6">Your current tier: {profile?.tier}</p>
              <div className="flex gap-4 justify-center">
                <Button asChild>
                  <Link href="/premium">Upgrade Tier</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/chat">Back to Chat Rooms</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const TierIcon = tierConfig.icon

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="max-w-6xl mx-auto p-4">
        {/* Header */}
        <div className="text-center py-8">
          <div className="flex items-center justify-center mb-4">
            <Button variant="ghost" size="sm" asChild className="mr-4">
              <Link href="/chat">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Link>
            </Button>
            <div className={cn("p-3 rounded-xl mr-3", tierConfig.bgColor)}>
              <TierIcon className={cn("h-8 w-8", tierConfig.color)} />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-blue-600 to-purple-600 bg-clip-text text-transparent">
              {tierConfig.name}
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">{tierConfig.description}</p>
          <div className="flex justify-center gap-8 mt-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              {onlineCount} online
            </span>
            <span className="flex items-center gap-2">
              <Crown className="h-4 w-4" />
              {tierParam.charAt(0).toUpperCase() + tierParam.slice(1)}+ Only
            </span>
          </div>
        </div>

        {/* Chat Container */}
        <Card className={cn("border-0 shadow-xl bg-card/80 backdrop-blur-sm", tierConfig.borderColor)}>
          {/* Chat Header */}
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TierIcon className={cn("h-5 w-5", tierConfig.color)} />
                  {tierConfig.name}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {messages.length} messages • {onlineCount} members online
                </p>
              </div>
              <Badge variant="outline" className={cn("text-xs", tierConfig.color)}>
                {tierParam.charAt(0).toUpperCase() + tierParam.slice(1)} Tier
              </Badge>
            </div>
          </CardHeader>

          {/* Messages */}
          <CardContent className="p-0">
            <ScrollArea className="h-[500px] p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className="group">
                    <div className="flex items-start space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={message.user.avatar || "/placeholder.svg"} />
                        <AvatarFallback>{message.user.username.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-sm">{message.user.username}</span>
                          <Badge className={cn("text-xs px-1.5 py-0.5", getTierColor(message.user.tier), "text-white")}>
                            {message.user.tier}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(message.timestamp, { addSuffix: true })}
                          </span>
                        </div>

                        <p className="text-sm text-foreground mb-2 break-words">{message.content}</p>

                        {/* Message Actions */}
                        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            className={cn("h-6 px-2 text-xs", message.hasLiked && "text-red-500")}
                            onClick={() => handleLikeMessage(message.id)}
                          >
                            <Heart className={cn("h-3 w-3 mr-1", message.hasLiked && "fill-current")} />
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
                  placeholder={`Message ${tierConfig.name}...`}
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
                disabled={!newMessage.trim()}
                className={cn(
                  "shrink-0 bg-gradient-to-r text-white",
                  tierParam === "grassroot" && "from-green-500 to-green-600",
                  tierParam === "pioneer" && "from-blue-500 to-blue-600",
                  tierParam === "elder" && "from-purple-500 to-purple-600",
                  tierParam === "blood" && "from-red-500 to-red-600",
                )}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
