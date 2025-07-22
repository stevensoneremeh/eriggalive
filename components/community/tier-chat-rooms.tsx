"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"
import { useAbly } from "@/contexts/ably-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { Send, Users, Crown, Star, Flame, ThumbsUp, ThumbsDown, Shield, Zap } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"

interface ChatMessage {
  id: string
  content: string
  user_id: string
  room_id: string
  vote_count: number
  created_at: string
  user: {
    username: string
    full_name: string | null
    avatar_url: string | null
    tier: string
  }
  user_vote?: "up" | "down" | null
}

interface ChatRoom {
  id: string
  name: string
  tier: string
  description: string
  icon: React.ComponentType<any>
  color: string
  min_tier_level: number
}

const CHAT_ROOMS: ChatRoom[] = [
  {
    id: "street-rep",
    name: "Street Rep",
    tier: "grassroot",
    description: "General discussions for all fans",
    icon: Star,
    color: "text-green-500",
    min_tier_level: 1,
  },
  {
    id: "warri-elite",
    name: "Warri Elite",
    tier: "pioneer",
    description: "Exclusive discussions for Pioneer members",
    icon: Zap,
    color: "text-blue-500",
    min_tier_level: 2,
  },
  {
    id: "erigma-circle",
    name: "Erigma Circle",
    tier: "elder",
    description: "Inner circle for Elder members",
    icon: Crown,
    color: "text-purple-500",
    min_tier_level: 3,
  },
  {
    id: "blood-brotherhood",
    name: "Blood Brotherhood",
    tier: "blood_brotherhood",
    description: "Ultimate tier for Blood Brotherhood",
    icon: Flame,
    color: "text-red-500",
    min_tier_level: 4,
  },
]

const TIER_LEVELS = {
  grassroot: 1,
  pioneer: 2,
  elder: 3,
  blood_brotherhood: 4,
  admin: 5,
}

export function TierChatRooms() {
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({})
  const [newMessage, setNewMessage] = useState("")
  const [activeRoom, setActiveRoom] = useState("street-rep")
  const [onlineUsers, setOnlineUsers] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  const { user, profile } = useAuth()
  const { isConnected, subscribeToFeed } = useAbly()
  const { toast } = useToast()
  const supabase = createClient()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const userTierLevel = profile ? TIER_LEVELS[profile.tier as keyof typeof TIER_LEVELS] || 1 : 1
  const availableRooms = CHAT_ROOMS.filter((room) => userTierLevel >= room.min_tier_level)

  useEffect(() => {
    if (profile) {
      loadMessages()
      loadOnlineUsers()
    }
  }, [profile])

  useEffect(() => {
    scrollToBottom()
  }, [messages, activeRoom])

  useEffect(() => {
    if (!isConnected || !profile) return

    const unsubscribe = subscribeToFeed((data: any) => {
      if (data.room_id === activeRoom) {
        setMessages((prev) => ({
          ...prev,
          [activeRoom]: [...(prev[activeRoom] || []), data.message],
        }))
      }
    })

    return unsubscribe
  }, [isConnected, activeRoom, profile, subscribeToFeed])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const loadMessages = async () => {
    try {
      setLoading(true)
      const roomPromises = availableRooms.map(async (room) => {
        const { data } = await supabase
          .from("chat_messages")
          .select(`
            *,
            user:users!chat_messages_user_id_fkey(
              username,
              full_name,
              avatar_url,
              tier
            )
          `)
          .eq("room_id", room.id)
          .order("created_at", { ascending: true })
          .limit(50)

        return { roomId: room.id, messages: data || [] }
      })

      const results = await Promise.all(roomPromises)
      const messagesMap: Record<string, ChatMessage[]> = {}

      results.forEach(({ roomId, messages }) => {
        messagesMap[roomId] = messages
      })

      setMessages(messagesMap)
    } catch (error) {
      console.error("Error loading messages:", error)
      toast({
        title: "Error",
        description: "Failed to load chat messages",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadOnlineUsers = async () => {
    try {
      const promises = availableRooms.map(async (room) => {
        const count = Math.floor(Math.random() * 50) + 10
        return { roomId: room.id, count }
      })

      const results = await Promise.all(promises)
      const onlineMap: Record<string, number> = {}

      results.forEach(({ roomId, count }) => {
        onlineMap[roomId] = count
      })

      setOnlineUsers(onlineMap)
    } catch (error) {
      console.error("Error loading online users:", error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !profile) return

    try {
      const messageData = {
        content: newMessage.trim(),
        user_id: profile.id,
        room_id: activeRoom,
        vote_count: 0,
      }

      const { data, error } = await supabase
        .from("chat_messages")
        .insert(messageData)
        .select(`
          *,
          user:users!chat_messages_user_id_fkey(
            username,
            full_name,
            avatar_url,
            tier
          )
        `)
        .single()

      if (error) throw error

      setMessages((prev) => ({
        ...prev,
        [activeRoom]: [...(prev[activeRoom] || []), data],
      }))

      setNewMessage("")
    } catch (error) {
      console.error("Error sending message:", error)
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      })
    }
  }

  const voteOnMessage = async (messageId: string, voteType: "up" | "down") => {
    if (!profile) return

    try {
      const { data: existingVote } = await supabase
        .from("chat_message_votes")
        .select("vote_type")
        .eq("message_id", messageId)
        .eq("user_id", profile.id)
        .single()

      if (existingVote?.vote_type === voteType) {
        await supabase.from("chat_message_votes").delete().eq("message_id", messageId).eq("user_id", profile.id)
      } else {
        await supabase.from("chat_message_votes").upsert({
          message_id: messageId,
          user_id: profile.id,
          vote_type: voteType,
        })
      }

      loadMessages()
    } catch (error) {
      console.error("Error voting on message:", error)
      toast({
        title: "Error",
        description: "Failed to vote on message",
        variant: "destructive",
      })
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const getTierIcon = (tier: string) => {
    const room = CHAT_ROOMS.find((r) => r.tier === tier)
    return room?.icon || Star
  }

  const getTierColor = (tier: string) => {
    const room = CHAT_ROOMS.find((r) => r.tier === tier)
    return room?.color || "text-gray-500"
  }

  if (!profile) {
    return (
      <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
        <CardContent className="p-12 text-center">
          <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Sign In Required</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Please sign in to access the tier-based chat rooms</p>
          <Button onClick={() => (window.location.href = "/login")}>Sign In</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn("w-2 h-2 rounded-full", isConnected ? "bg-green-500" : "bg-red-500")} />
          <span className="text-sm text-muted-foreground">{isConnected ? "Connected" : "Disconnected"}</span>
        </div>
        <Badge variant="outline" className={getTierColor(profile.tier)}>
          {profile.tier.charAt(0).toUpperCase() + profile.tier.slice(1)} Member
        </Badge>
      </div>

      <Tabs value={activeRoom} onValueChange={setActiveRoom} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 gap-2">
          {availableRooms.map((room) => {
            const Icon = room.icon
            return (
              <TabsTrigger
                key={room.id}
                value={room.id}
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{room.name}</span>
                <Badge variant="secondary" className="ml-1 text-xs">
                  {onlineUsers[room.id] || 0}
                </Badge>
              </TabsTrigger>
            )
          })}
        </TabsList>

        {availableRooms.map((room) => (
          <TabsContent key={room.id} value={room.id} className="space-y-4">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <room.icon className={cn("h-6 w-6", room.color)} />
                    <div>
                      <CardTitle className="text-lg">{room.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{room.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{onlineUsers[room.id] || 0} online</span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <ScrollArea className="h-96 w-full rounded-md border p-4">
                  <div className="space-y-4">
                    {loading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : (
                      <>
                        {(messages[room.id] || []).map((message) => {
                          const TierIcon = getTierIcon(message.user.tier)
                          const tierColor = getTierColor(message.user.tier)

                          return (
                            <div key={message.id} className="flex gap-3 group">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={message.user.avatar_url || "/placeholder.svg"} />
                                <AvatarFallback>{message.user.username.charAt(0).toUpperCase()}</AvatarFallback>
                              </Avatar>

                              <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-sm">
                                    {message.user.full_name || message.user.username}
                                  </span>
                                  <TierIcon className={cn("h-3 w-3", tierColor)} />
                                  <span className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                                  </span>
                                </div>

                                <p className="text-sm">{message.content}</p>

                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2 text-xs"
                                    onClick={() => voteOnMessage(message.id, "up")}
                                  >
                                    <ThumbsUp className="h-3 w-3 mr-1" />
                                    {message.vote_count > 0 ? message.vote_count : ""}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2 text-xs"
                                    onClick={() => voteOnMessage(message.id, "down")}
                                  >
                                    <ThumbsDown className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                        <div ref={messagesEndRef} />
                      </>
                    )}
                  </div>
                </ScrollArea>

                <div className="flex gap-2">
                  <Input
                    placeholder={`Message ${room.name}...`}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1"
                    disabled={!isConnected}
                  />
                  <Button onClick={sendMessage} disabled={!newMessage.trim() || !isConnected} className="px-3">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>

                {!isConnected && <p className="text-xs text-muted-foreground text-center">Reconnecting to chat...</p>}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
