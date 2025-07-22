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
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { Send, Users, Crown, ThumbsUp, ThumbsDown, Shield, Droplets, Lock } from "lucide-react"
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
  description: string
  icon: React.ComponentType<any>
  color: string
  bgColor: string
  borderColor: string
  textColor: string
  requiredTier: string
  memberCount: number
  isLocked: boolean
}

const CHAT_ROOMS: ChatRoom[] = [
  {
    id: "street-rep",
    name: "Street Rep",
    description: "For the grassroot fans",
    icon: Users,
    color: "from-green-500 to-green-600",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-200/20",
    textColor: "text-green-600",
    requiredTier: "grassroot",
    memberCount: 1247,
    isLocked: false,
  },
  {
    id: "warri-elite",
    name: "Warri Elite",
    description: "Pioneer tier discussions",
    icon: Crown,
    color: "from-blue-500 to-blue-600",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-200/20",
    textColor: "text-blue-600",
    requiredTier: "pioneer",
    memberCount: 456,
    isLocked: false,
  },
  {
    id: "erigma-circle",
    name: "Erigma Circle",
    description: "Elder tier exclusive",
    icon: Shield,
    color: "from-purple-500 to-purple-600",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-200/20",
    textColor: "text-purple-600",
    requiredTier: "elder",
    memberCount: 89,
    isLocked: false,
  },
  {
    id: "blood-brotherhood",
    name: "Blood Brotherhood",
    description: "Ultimate tier sanctuary",
    icon: Droplets,
    color: "from-red-500 to-red-600",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-200/20",
    textColor: "text-red-600",
    requiredTier: "blood_brotherhood",
    memberCount: 12,
    isLocked: false,
  },
]

const TIER_LEVELS = {
  grassroot: 1,
  pioneer: 2,
  elder: 3,
  blood_brotherhood: 4,
  admin: 5,
}

const mockMessages = [
  {
    id: "1",
    user: { username: "erigga_fan1", avatar: "/placeholder.svg", tier: "grassroot" },
    content: "Just heard the new track! 🔥🔥🔥",
    timestamp: "2 min ago",
    upvotes: 5,
    downvotes: 0,
  },
  {
    id: "2",
    user: { username: "warri_boy", avatar: "/placeholder.svg", tier: "pioneer" },
    content: "That beat is absolutely insane! Erigga never disappoints",
    timestamp: "5 min ago",
    upvotes: 12,
    downvotes: 1,
  },
  {
    id: "3",
    user: { username: "music_lover", avatar: "/placeholder.svg", tier: "elder" },
    content: "The lyrics hit different this time. Real street poetry 📝",
    timestamp: "8 min ago",
    upvotes: 8,
    downvotes: 0,
  },
]

export function TierChatRooms() {
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({})
  const [newMessage, setNewMessage] = useState("")
  const [activeRoom, setActiveRoom] = useState("street-rep")
  const [onlineUsers, setOnlineUsers] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null)
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

  const handleSendMessage = () => {
    if (!newMessage.trim()) return
    // TODO: Implement message sending
    setNewMessage("")
  }

  const handleVote = (messageId: string, type: "up" | "down") => {
    // TODO: Implement voting
    console.log(`Voting ${type} on message ${messageId}`)
  }

  const canAccessRoom = (requiredTier: string) => {
    if (!profile) return false

    const tierHierarchy = {
      grassroot: 1,
      pioneer: 2,
      elder: 3,
      blood_brotherhood: 4,
    }

    const userTierLevel = tierHierarchy[profile.tier as keyof typeof tierHierarchy] || 0
    const requiredTierLevel = tierHierarchy[requiredTier as keyof typeof tierHierarchy] || 0

    return userTierLevel >= requiredTierLevel
  }

  if (!selectedRoom) {
    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold mb-2">Choose Your Chat Room</h3>
          <p className="text-muted-foreground">
            Access is based on your tier level. Higher tiers can access all lower tier rooms.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CHAT_ROOMS.map((room) => {
            const Icon = room.icon
            const hasAccess = canAccessRoom(room.requiredTier)

            return (
              <Card
                key={room.id}
                className={cn(
                  "relative overflow-hidden transition-all duration-300 hover:scale-105 cursor-pointer",
                  room.bgColor,
                  room.borderColor,
                  hasAccess ? "hover:shadow-lg" : "opacity-60 cursor-not-allowed",
                )}
                onClick={() => hasAccess && setSelectedRoom(room.id)}
              >
                <div className={cn("absolute inset-0 bg-gradient-to-r opacity-10", room.color)} />

                <CardHeader className="relative">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={cn("p-2 rounded-lg", room.bgColor)}>
                        <Icon className={cn("h-6 w-6", room.textColor)} />
                      </div>
                      <div>
                        <CardTitle className="flex items-center space-x-2">
                          <span>{room.name}</span>
                          {!hasAccess && <Lock className="h-4 w-4 text-muted-foreground" />}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">{room.description}</p>
                      </div>
                    </div>

                    <Badge variant="outline" className={room.textColor}>
                      {room.requiredTier}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="relative">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{room.memberCount} members</span>
                    </div>

                    {hasAccess ? (
                      <Button size="sm" className={cn("bg-gradient-to-r text-white", room.color)}>
                        Join Room
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" disabled>
                        <Lock className="h-4 w-4 mr-2" />
                        Locked
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {profile && (
          <Card className="bg-muted/20">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={profile.avatar_url || "/placeholder.svg"} />
                  <AvatarFallback>{profile.username.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">Your Current Tier: {profile.tier}</p>
                  <p className="text-sm text-muted-foreground">
                    You can access {CHAT_ROOMS.filter((room) => canAccessRoom(room.requiredTier)).length} out of{" "}
                    {CHAT_ROOMS.length} rooms
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  const currentRoom = CHAT_ROOMS.find((room) => room.id === selectedRoom)
  if (!currentRoom) return null

  const Icon = currentRoom.icon

  return (
    <div className="space-y-4">
      {/* Room Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" onClick={() => setSelectedRoom(null)}>
            ← Back
          </Button>
          <div className={cn("p-2 rounded-lg", currentRoom.bgColor)}>
            <Icon className={cn("h-5 w-5", currentRoom.textColor)} />
          </div>
          <div>
            <h3 className="font-semibold">{currentRoom.name}</h3>
            <p className="text-sm text-muted-foreground">{currentRoom.memberCount} members online</p>
          </div>
        </div>

        <Badge variant="outline" className={currentRoom.textColor}>
          {currentRoom.requiredTier}
        </Badge>
      </div>

      {/* Chat Messages */}
      <Card className="h-96">
        <ScrollArea className="h-full p-4">
          <div className="space-y-4">
            {mockMessages.map((msg) => (
              <div key={msg.id} className="flex space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={msg.user.avatar || "/placeholder.svg"} />
                  <AvatarFallback>{msg.user.username.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-sm">{msg.user.username}</span>
                    <Badge variant="outline" className="text-xs">
                      {msg.user.tier}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{msg.timestamp}</span>
                  </div>

                  <p className="text-sm">{msg.content}</p>

                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2 text-xs"
                      onClick={() => handleVote(msg.id, "up")}
                    >
                      <ThumbsUp className="h-3 w-3 mr-1" />
                      {msg.upvotes}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2 text-xs"
                      onClick={() => handleVote(msg.id, "down")}
                    >
                      <ThumbsDown className="h-3 w-3 mr-1" />
                      {msg.downvotes}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </Card>

      {/* Message Input */}
      <div className="flex space-x-2">
        <Input
          placeholder="Type your message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && sendMessage()}
          className="flex-1"
        />
        <Button
          onClick={sendMessage}
          disabled={!newMessage.trim() || !isConnected}
          className={cn("bg-gradient-to-r text-white", currentRoom.color)}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
