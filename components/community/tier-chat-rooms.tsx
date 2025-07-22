"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/contexts/auth-context"
import { subscribeToChannel, publishEvent, ABLY_CHANNELS } from "@/lib/ably"
import { formatDistanceToNow } from "date-fns"
import { Send, Users, Crown, Shield, Star } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface ChatMessage {
  id: string
  content: string
  user: {
    id: string
    username: string
    full_name: string
    avatar_url?: string
    tier: string
  }
  timestamp: string
  tier: string
}

const TIER_CONFIG = {
  grassroot: {
    name: "Street Rep",
    icon: Users,
    color: "bg-green-500",
    description: "General community chat",
    minTier: "grassroot",
  },
  pioneer: {
    name: "Warri Elite",
    icon: Star,
    color: "bg-blue-500",
    description: "Pioneer tier and above",
    minTier: "pioneer",
  },
  blood: {
    name: "Erigma Circle",
    icon: Crown,
    color: "bg-red-500",
    description: "Blood tier exclusive",
    minTier: "blood",
  },
}

const TIER_HIERARCHY = {
  grassroot: 1,
  pioneer: 2,
  elder: 3,
  blood: 4,
}

export function TierChatRooms() {
  const { profile, isAuthenticated } = useAuth()
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({
    grassroot: [],
    pioneer: [],
    blood: [],
  })
  const [newMessage, setNewMessage] = useState("")
  const [activeTab, setActiveTab] = useState("grassroot")
  const [onlineUsers, setOnlineUsers] = useState<Record<string, number>>({
    grassroot: 0,
    pioneer: 0,
    blood: 0,
  })
  const [isConnected, setIsConnected] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, activeTab])

  // Check if user can access a tier
  const canAccessTier = (tier: string) => {
    if (!profile) return false
    const userTierLevel = TIER_HIERARCHY[profile.tier as keyof typeof TIER_HIERARCHY] || 0
    const requiredTierLevel = TIER_HIERARCHY[tier as keyof typeof TIER_HIERARCHY] || 0
    return userTierLevel >= requiredTierLevel
  }

  // Get available tiers for user
  const getAvailableTiers = () => {
    return Object.keys(TIER_CONFIG).filter((tier) => canAccessTier(tier))
  }

  // Subscribe to chat channels
  useEffect(() => {
    if (!isAuthenticated || !profile) return

    const unsubscribers: (() => void)[] = []
    setIsConnected(true)

    // Subscribe to each accessible tier
    getAvailableTiers().forEach((tier) => {
      const channelName = ABLY_CHANNELS.TIER_CHAT(tier)

      // Subscribe to messages
      const messageUnsubscribe = subscribeToChannel(channelName, "message", (message) => {
        const chatMessage: ChatMessage = {
          id: message.id || Date.now().toString(),
          content: message.data.content,
          user: message.data.user,
          timestamp: message.timestamp ? new Date(message.timestamp).toISOString() : new Date().toISOString(),
          tier,
        }

        setMessages((prev) => ({
          ...prev,
          [tier]: [...(prev[tier] || []), chatMessage],
        }))

        // Show notification if not on active tab
        if (tier !== activeTab) {
          toast.success(`New message in ${TIER_CONFIG[tier as keyof typeof TIER_CONFIG].name}`)
        }
      })

      // Subscribe to presence updates
      const presenceUnsubscribe = subscribeToChannel(channelName, "presence", (message) => {
        setOnlineUsers((prev) => ({
          ...prev,
          [tier]: message.data.count || 0,
        }))
      })

      unsubscribers.push(messageUnsubscribe, presenceUnsubscribe)
    })

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe())
      setIsConnected(false)
    }
  }, [isAuthenticated, profile, activeTab])

  const sendMessage = async () => {
    if (!newMessage.trim() || !profile || !canAccessTier(activeTab)) return

    try {
      const messageData = {
        content: newMessage.trim(),
        user: {
          id: profile.id,
          username: profile.username,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
          tier: profile.tier,
        },
      }

      await publishEvent(ABLY_CHANNELS.TIER_CHAT(activeTab), "message", messageData)
      setNewMessage("")
    } catch (error) {
      console.error("Failed to send message:", error)
      toast.error("Failed to send message")
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const getTierBadgeColor = (tier: string) => {
    const colors = {
      grassroot: "bg-green-500 text-white",
      pioneer: "bg-blue-500 text-white",
      elder: "bg-purple-500 text-white",
      blood: "bg-red-500 text-white",
    }
    return colors[tier as keyof typeof colors] || "bg-gray-500 text-white"
  }

  if (!isAuthenticated) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Join the Conversation</h3>
          <p className="text-muted-foreground mb-4">
            Sign in to access tier-based chat rooms and connect with the community.
          </p>
          <Button asChild>
            <a href="/login">Sign In</a>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const availableTiers = getAvailableTiers()

  if (availableTiers.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Chat Access</h3>
          <p className="text-muted-foreground">
            You don't have access to any chat rooms yet. Upgrade your tier to join the conversation.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Live Chat Rooms
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className={cn("w-2 h-2 rounded-full", isConnected ? "bg-green-500 animate-pulse" : "bg-red-500")} />
            <span className="text-sm text-muted-foreground">{isConnected ? "Connected" : "Disconnected"}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="mx-6 mb-4">
            {availableTiers.map((tier) => {
              const config = TIER_CONFIG[tier as keyof typeof TIER_CONFIG]
              const Icon = config.icon
              return (
                <TabsTrigger key={tier} value={tier} className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span>{config.name}</span>
                  {onlineUsers[tier] > 0 && (
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {onlineUsers[tier]}
                    </Badge>
                  )}
                </TabsTrigger>
              )
            })}
          </TabsList>

          {availableTiers.map((tier) => {
            const config = TIER_CONFIG[tier as keyof typeof TIER_CONFIG]
            const tierMessages = messages[tier] || []

            return (
              <TabsContent key={tier} value={tier} className="flex-1 flex flex-col mx-6 mb-6">
                <div className="mb-4 p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <config.icon className="h-4 w-4" />
                    <span className="font-medium">{config.name}</span>
                    <Badge className={config.color}>{tier.charAt(0).toUpperCase() + tier.slice(1)}+</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{config.description}</p>
                </div>

                <ScrollArea className="flex-1 pr-4">
                  <div className="space-y-4">
                    {tierMessages.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <config.icon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No messages yet. Start the conversation!</p>
                      </div>
                    ) : (
                      tierMessages.map((message) => (
                        <div key={message.id} className="flex gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={message.user.avatar_url || "/placeholder-user.jpg"} />
                            <AvatarFallback>{message.user.username.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">
                                {message.user.full_name || message.user.username}
                              </span>
                              <Badge className={cn("text-xs", getTierBadgeColor(message.user.tier))}>
                                {message.user.tier}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
                              </span>
                            </div>
                            <p className="text-sm break-words">{message.content}</p>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                <div className="mt-4 flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={`Message ${config.name}...`}
                    className="flex-1"
                    maxLength={500}
                  />
                  <Button onClick={sendMessage} disabled={!newMessage.trim() || !isConnected} size="icon">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>
            )
          })}
        </Tabs>
      </CardContent>
    </Card>
  )
}
