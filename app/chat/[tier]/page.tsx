"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Crown, Zap, Star, Flame, Send, Users, Lock, AlertTriangle, MessageCircle } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"

interface ChatMessage {
  id: string
  content: string
  user: {
    username: string
    display_name: string
    avatar_url?: string
    tier: string
  }
  created_at: string
}

interface TierInfo {
  name: string
  icon: React.ElementType
  color: string
  description: string
  requiredTier: string
}

const tierInfo: Record<string, TierInfo> = {
  grassroot: {
    name: "Grassroot Chat",
    icon: Star,
    color: "text-green-500",
    description: "Chat room for Grassroot members and above",
    requiredTier: "grassroot",
  },
  pioneer: {
    name: "Pioneer Chat",
    icon: Zap,
    color: "text-blue-500",
    description: "Exclusive chat for Pioneer members and above",
    requiredTier: "pioneer",
  },
  elder: {
    name: "Elder Chat",
    icon: Crown,
    color: "text-purple-500",
    description: "Premium chat for Elder members and above",
    requiredTier: "elder",
  },
  blood: {
    name: "Blood Brotherhood Chat",
    icon: Flame,
    color: "text-red-500",
    description: "Elite chat for Blood Brotherhood members only",
    requiredTier: "blood",
  },
}

const tierOrder = ["grassroot", "pioneer", "elder", "blood"]

function getTierLevel(tier: string): number {
  return tierOrder.indexOf(tier.toLowerCase())
}

function canAccessTier(userTier: string, requiredTier: string): boolean {
  const userLevel = getTierLevel(userTier)
  const requiredLevel = getTierLevel(requiredTier)
  return userLevel >= requiredLevel
}

export default function TierChatPage() {
  const params = useParams()
  const router = useRouter()
  const { user, profile, loading } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState(0)

  const tier = params.tier as string
  const currentTierInfo = tierInfo[tier]

  useEffect(() => {
    if (!loading && (!user || !profile)) {
      router.push("/login")
      return
    }

    if (!loading && profile && !canAccessTier(profile.tier || "grassroot", tier)) {
      toast.error(`You need ${currentTierInfo?.name} access to join this chat room`)
      router.push("/community")
      return
    }

    if (user && profile && canAccessTier(profile.tier || "grassroot", tier)) {
      loadMessages()
      // Set up real-time updates here if needed
    }
  }, [user, profile, loading, tier, router])

  const loadMessages = async () => {
    try {
      const response = await fetch(`/api/chat/${tier}/messages`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
        setOnlineUsers(data.onlineUsers || 0)
      }
    } catch (error) {
      console.error("Failed to load messages:", error)
      // Set mock messages for demo
      setMessages([
        {
          id: "1",
          content: "Welcome to the chat room!",
          user: {
            username: "moderator",
            display_name: "Chat Moderator",
            tier: "elder",
          },
          created_at: new Date().toISOString(),
        },
      ])
      setOnlineUsers(12)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || sending) return

    setSending(true)
    try {
      const response = await fetch(`/api/chat/${tier}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage.trim() }),
      })

      if (response.ok) {
        const data = await response.json()
        setMessages((prev) => [...prev, data.message])
        setNewMessage("")
      } else {
        toast.error("Failed to send message")
      }
    } catch (error) {
      console.error("Error sending message:", error)
      toast.error("Failed to send message")
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-96 bg-muted rounded" />
        </div>
      </div>
    )
  }

  if (!user || !profile) {
    return (
      <div className="container mx-auto px-4 py-8 pt-24">
        <Card>
          <CardContent className="text-center py-12">
            <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Please sign in</h3>
            <p className="text-muted-foreground mb-4">You need to be signed in to access chat rooms</p>
            <Button onClick={() => router.push("/login")}>Sign In</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!currentTierInfo) {
    return (
      <div className="container mx-auto px-4 py-8 pt-24">
        <Card>
          <CardContent className="text-center py-12">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h3 className="text-lg font-semibold mb-2">Chat Room Not Found</h3>
            <p className="text-muted-foreground mb-4">The requested chat room doesn't exist</p>
            <Button onClick={() => router.push("/community")}>Back to Community</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!canAccessTier(profile.tier || "grassroot", tier)) {
    const TierIcon = currentTierInfo.icon
    return (
      <div className="container mx-auto px-4 py-8 pt-24">
        <Card>
          <CardContent className="text-center py-12">
            <Lock className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
            <h3 className="text-lg font-semibold mb-2">Access Restricted</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-center space-x-2">
                <TierIcon className={`h-5 w-5 ${currentTierInfo.color}`} />
                <span className="font-medium">{currentTierInfo.name}</span>
              </div>
              <p className="text-muted-foreground">{currentTierInfo.description}</p>
              <p className="text-sm text-muted-foreground">
                Your current tier: <Badge variant="secondary">{profile.tier}</Badge>
              </p>
            </div>
            <div className="flex space-x-2 mt-6">
              <Button onClick={() => router.push("/premium")}>Upgrade Tier</Button>
              <Button variant="outline" onClick={() => router.push("/community")}>
                Back to Community
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const TierIcon = currentTierInfo.icon

  return (
    <div className="container mx-auto px-4 py-8 pt-24 max-w-4xl">
      {/* Header */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <TierIcon className={`h-6 w-6 ${currentTierInfo.color}`} />
              <div>
                <CardTitle>{currentTierInfo.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{currentTierInfo.description}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span className="text-sm">{onlineUsers} online</span>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Chat Interface */}
      <Card className="h-[600px] flex flex-col">
        <CardHeader className="py-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Live Chat</h3>
            <Badge variant="secondary">Your tier: {profile.tier}</Badge>
          </div>
        </CardHeader>

        <Separator />

        {/* Messages Area */}
        <CardContent className="flex-1 p-0">
          <ScrollArea className="h-full p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.id} className="flex space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={message.user.avatar_url || "/placeholder-user.jpg"} />
                    <AvatarFallback>{message.user.username.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">{message.user.display_name || message.user.username}</span>
                      <Badge variant="outline" className="text-xs">
                        {message.user.tier}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm">{message.content}</p>
                  </div>
                </div>
              ))}

              {messages.length === 0 && (
                <div className="text-center py-12">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No messages yet</h3>
                  <p className="text-muted-foreground">Be the first to start the conversation!</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>

        <Separator />

        {/* Message Input */}
        <CardContent className="p-4">
          <form onSubmit={sendMessage} className="flex space-x-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              disabled={sending}
              className="flex-1"
            />
            <Button type="submit" disabled={!newMessage.trim() || sending} size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
