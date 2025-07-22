"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Send, Users, Crown, Star, Zap } from "lucide-react"
import { subscribeToChannel, publishEvent, ABLY_CHANNELS } from "@/lib/ably"
import { cn } from "@/lib/utils"

interface ChatMessage {
  id: string
  content: string
  user: {
    id: string
    username: string
    full_name: string
    avatar_url: string | null
    tier: string
  }
  timestamp: Date
  tier: string
}

const TIER_ROOMS = [
  {
    id: "street_rep",
    name: "Street Rep",
    description: "General discussion for all fans",
    icon: Users,
    color: "bg-green-500",
    minTier: "grassroot",
  },
  {
    id: "warri_elite",
    name: "Warri Elite",
    description: "Elite tier discussions",
    icon: Star,
    color: "bg-blue-500",
    minTier: "pioneer",
  },
  {
    id: "erigma_circle",
    name: "Erigma Circle",
    description: "Inner circle conversations",
    icon: Crown,
    color: "bg-purple-500",
    minTier: "elder",
  },
]

const TIER_HIERARCHY = ["grassroot", "pioneer", "elder", "blood"]

export function TierChatRooms() {
  const { profile, isAuthenticated } = useAuth()
  const [activeRoom, setActiveRoom] = useState("street_rep")
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({
    street_rep: [],
    warri_elite: [],
    erigma_circle: [],
  })
  const [newMessage, setNewMessage] = useState("")
  const [isConnected, setIsConnected] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, activeRoom])

  const canAccessRoom = (roomMinTier: string) => {
    if (!profile) return false
    const userTierIndex = TIER_HIERARCHY.indexOf(profile.tier)
    const roomTierIndex = TIER_HIERARCHY.indexOf(roomMinTier)
    return userTierIndex >= roomTierIndex
  }

  const getAccessibleRooms = () => {
    return TIER_ROOMS.filter((room) => canAccessRoom(room.minTier))
  }

  useEffect(() => {
    if (!isAuthenticated || !profile) return

    const unsubscribeFunctions: (() => void)[] = []

    // Subscribe to accessible chat rooms
    getAccessibleRooms().forEach((room) => {
      const channelName = ABLY_CHANNELS.TIER_CHAT(room.id)

      const unsubscribe = subscribeToChannel(channelName, "message", (message) => {
        const chatMessage: ChatMessage = {
          id: message.id || Date.now().toString(),
          content: message.data.content,
          user: message.data.user,
          timestamp: new Date(message.timestamp || Date.now()),
          tier: room.id,
        }

        setMessages((prev) => ({
          ...prev,
          [room.id]: [...(prev[room.id] || []), chatMessage],
        }))
      })

      unsubscribeFunctions.push(unsubscribe)
    })

    setIsConnected(true)

    return () => {
      unsubscribeFunctions.forEach((unsubscribe) => unsubscribe())
      setIsConnected(false)
    }
  }, [isAuthenticated, profile])

  const sendMessage = async () => {
    if (!newMessage.trim() || !profile || !isConnected) return

    const room = TIER_ROOMS.find((r) => r.id === activeRoom)
    if (!room || !canAccessRoom(room.minTier)) return

    const messageData = {
      content: newMessage,
      user: {
        id: profile.id.toString(),
        username: profile.username,
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        tier: profile.tier,
      },
    }

    try {
      await publishEvent(ABLY_CHANNELS.TIER_CHAT(activeRoom), "message", messageData)
      setNewMessage("")
    } catch (error) {
      console.error("Failed to send message:", error)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (!isAuthenticated) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Join the Conversation</h3>
          <p className="text-muted-foreground">Sign in to access tier-based chat rooms and connect with other fans.</p>
        </CardContent>
      </Card>
    )
  }

  const accessibleRooms = getAccessibleRooms()

  if (accessibleRooms.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Crown className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Upgrade Your Tier</h3>
          <p className="text-muted-foreground">
            Upgrade your membership tier to access exclusive chat rooms and connect with other fans.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Live Chat Rooms
          {isConnected && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        <Tabs value={activeRoom} onValueChange={setActiveRoom} className="flex-1 flex flex-col">
          <TabsList className="mx-4 mb-4">
            {accessibleRooms.map((room) => {
              const Icon = room.icon
              return (
                <TabsTrigger key={room.id} value={room.id} className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {room.name}
                </TabsTrigger>
              )
            })}
          </TabsList>

          {accessibleRooms.map((room) => {
            const Icon = room.icon
            const roomMessages = messages[room.id] || []

            return (
              <TabsContent key={room.id} value={room.id} className="flex-1 flex flex-col mx-4 mt-0">
                <div className="flex items-center gap-2 mb-4 p-3 bg-muted rounded-lg">
                  <div className={cn("p-2 rounded-full", room.color)}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium">{room.name}</h4>
                    <p className="text-sm text-muted-foreground">{room.description}</p>
                  </div>
                  <Badge variant="outline" className="ml-auto">
                    {roomMessages.length} messages
                  </Badge>
                </div>

                <ScrollArea className="flex-1 pr-4">
                  <div className="space-y-4">
                    {roomMessages.length === 0 ? (
                      <div className="text-center py-8">
                        <Icon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
                      </div>
                    ) : (
                      roomMessages.map((message) => (
                        <div key={message.id} className="flex items-start gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={message.user.avatar_url || "/placeholder-user.jpg"} />
                            <AvatarFallback>{message.user.username.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">{message.user.username}</span>
                              <Badge variant="outline" className="text-xs">
                                {message.user.tier}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {message.timestamp.toLocaleTimeString()}
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

                <div className="flex gap-2 mt-4">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={`Message ${room.name}...`}
                    disabled={!isConnected}
                    className="flex-1"
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
