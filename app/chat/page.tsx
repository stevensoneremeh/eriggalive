"use client"

import type React from "react"

import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAbly } from "@/contexts/ably-context"
import { createClient } from "@/lib/supabase/client"
import { Send, Users, Crown, Star, Zap, Heart, Lock, Globe, Gift } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface ChatMessage {
  id: string
  user_id: string
  room: string
  content: string
  upvotes: number
  created_at: string
  user: {
    id: string
    username: string
    full_name: string | null
    avatar_url: string | null
    tier: string
  }
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
  href: string
}

const CHAT_ROOMS: ChatRoom[] = [
  {
    id: "general",
    name: "General Chat",
    description: "Open discussions for all fans",
    icon: Globe,
    color: "from-gray-500 to-gray-600",
    bgColor: "bg-gray-500/10",
    borderColor: "border-gray-200/20",
    textColor: "text-gray-600",
    requiredTier: "all",
    memberCount: 2847,
    isLocked: false,
    href: "/chat/general",
  },
  {
    id: "freebies",
    name: "Freebies Room",
    description: "Free content and community games",
    icon: Gift,
    color: "from-yellow-500 to-orange-500",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-200/20",
    textColor: "text-yellow-600",
    requiredTier: "all",
    memberCount: 1892,
    isLocked: false,
    href: "/chat/freebies",
  },
  {
    id: "grassroot",
    name: "Street Rep",
    description: "For the grassroot fans",
    icon: Star,
    color: "from-green-500 to-green-600",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-200/20",
    textColor: "text-green-600",
    requiredTier: "grassroot",
    memberCount: 1247,
    isLocked: false,
    href: "/chat/grassroot",
  },
  {
    id: "pioneer",
    name: "Warri Elite",
    description: "Pioneer tier discussions",
    icon: Zap,
    color: "from-blue-500 to-blue-600",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-200/20",
    textColor: "text-blue-600",
    requiredTier: "pioneer",
    memberCount: 456,
    isLocked: false,
    href: "/chat/pioneer",
  },
  {
    id: "elder",
    name: "Erigma Circle",
    description: "Elder tier exclusive",
    icon: Crown,
    color: "from-purple-500 to-purple-600",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-200/20",
    textColor: "text-purple-600",
    requiredTier: "elder",
    memberCount: 89,
    isLocked: false,
    href: "/chat/elder",
  },
  {
    id: "blood",
    name: "Blood Brotherhood",
    description: "Ultimate tier sanctuary",
    icon: Heart,
    color: "from-red-500 to-red-600",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-200/20",
    textColor: "text-red-600",
    requiredTier: "blood_brotherhood",
    memberCount: 12,
    isLocked: false,
    href: "/chat/blood",
  },
]

const TIER_HIERARCHY = {
  grassroot: 1,
  pioneer: 2,
  elder: 3,
  blood_brotherhood: 4,
  admin: 5,
}

export default function ChatPage() {
  const { user, profile, isAuthenticated, isLoading } = useAuth()
  const { client: ablyClient, isConnected } = useAbly()
  const router = useRouter()
  const { toast } = useToast()
  const [selectedRoom, setSelectedRoom] = useState<string>("general")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState<Record<string, number>>({})

  const supabase = createClient()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login")
      return
    }
  }, [isAuthenticated, isLoading, router])

  useEffect(() => {
    if (isAuthenticated && selectedRoom) {
      fetchMessages(selectedRoom)
    }
  }, [isAuthenticated, selectedRoom])

  useEffect(() => {
    if (ablyClient && isConnected && selectedRoom) {
      const channel = ablyClient.channels.get(`chat-${selectedRoom}`)

      channel.subscribe("new-message", (message) => {
        const newMsg = message.data as ChatMessage
        setMessages((prev) => [...prev, newMsg])
      })

      // Simulate online user counts
      const updateOnlineUsers = () => {
        const counts: Record<string, number> = {}
        CHAT_ROOMS.forEach((room) => {
          counts[room.id] = Math.floor(Math.random() * room.memberCount * 0.1) + 10
        })
        setOnlineUsers(counts)
      }

      updateOnlineUsers()
      const interval = setInterval(updateOnlineUsers, 30000)

      return () => {
        channel.unsubscribe()
        clearInterval(interval)
      }
    }
  }, [ablyClient, isConnected, selectedRoom])

  const fetchMessages = async (room: string) => {
    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .select(`
          *,
          user:users(id, username, full_name, avatar_url, tier)
        `)
        .eq("room", room)
        .eq("is_deleted", false)
        .order("created_at", { ascending: true })
        .limit(50)

      if (error) {
        console.error("Error fetching messages:", error)
        return
      }

      setMessages(data || [])
    } catch (error) {
      console.error("Error fetching messages:", error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !profile || !selectedRoom) return

    setIsSubmitting(true)
    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .insert({
          user_id: profile.id,
          room: selectedRoom,
          content: newMessage.trim(),
        })
        .select(`
          *,
          user:users(id, username, full_name, avatar_url, tier)
        `)
        .single()

      if (error) {
        console.error("Error sending message:", error)
        toast({
          title: "Error",
          description: "Failed to send message",
          variant: "destructive",
        })
        return
      }

      // Publish to Ably
      if (ablyClient && isConnected) {
        const channel = ablyClient.channels.get(`chat-${selectedRoom}`)
        await channel.publish("new-message", data)
      }

      setNewMessage("")
    } catch (error) {
      console.error("Error sending message:", error)
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const canAccessRoom = (requiredTier: string) => {
    if (requiredTier === "all") return true
    if (!profile) return false

    const userTierLevel = TIER_HIERARCHY[profile.tier as keyof typeof TIER_HIERARCHY] || 0
    const requiredTierLevel = TIER_HIERARCHY[requiredTier as keyof typeof TIER_HIERARCHY] || 0

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading chat...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  const selectedRoomData = CHAT_ROOMS.find((room) => room.id === selectedRoom)
  const RoomIcon = selectedRoomData?.icon || Globe

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-8rem)]">
          {/* Room List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Chat Rooms
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-12rem)]">
                <div className="space-y-2 p-4">
                  {CHAT_ROOMS.map((room) => {
                    const Icon = room.icon
                    const hasAccess = canAccessRoom(room.requiredTier)
                    const isOnline = onlineUsers[room.id] || 0

                    return (
                      <button
                        key={room.id}
                        onClick={() => hasAccess && setSelectedRoom(room.id)}
                        disabled={!hasAccess}
                        className={cn(
                          "w-full text-left p-3 rounded-lg transition-all",
                          selectedRoom === room.id
                            ? "bg-primary text-primary-foreground"
                            : hasAccess
                              ? "hover:bg-muted"
                              : "opacity-50 cursor-not-allowed",
                          room.bgColor,
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Icon className={cn("h-4 w-4", room.textColor)} />
                            <span className="font-medium">{room.name}</span>
                          </div>
                          {!hasAccess && <Lock className="h-4 w-4" />}
                        </div>
                        <p className="text-xs text-muted-foreground mb-1">{room.description}</p>
                        <div className="flex items-center justify-between text-xs">
                          <span>{room.memberCount.toLocaleString()} members</span>
                          <div className="flex items-center gap-1 text-green-600">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                            <span>{isOnline}</span>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="lg:col-span-3 flex flex-col">
            {/* Chat Header */}
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-lg", selectedRoomData?.bgColor)}>
                    <RoomIcon className={cn("h-5 w-5", selectedRoomData?.textColor)} />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{selectedRoomData?.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{selectedRoomData?.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {onlineUsers[selectedRoom] || 0} online
                  </span>
                  {isConnected && (
                    <span className="flex items-center gap-2 text-green-600">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      Live
                    </span>
                  )}
                </div>
              </div>
            </CardHeader>

            {/* Messages */}
            <CardContent className="flex-1 p-0">
              <ScrollArea className="h-[calc(100vh-20rem)] p-4">
                <div className="space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-8">
                      <RoomIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Welcome to {selectedRoomData?.name}</h3>
                      <p className="text-muted-foreground">Start the conversation!</p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div key={message.id} className="flex items-start space-x-3 group">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={message.user.avatar_url || "/placeholder-user.jpg"} />
                          <AvatarFallback>{message.user.username.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-sm">{message.user.username}</span>
                            <Badge
                              className={cn("text-xs px-1.5 py-0.5", getTierColor(message.user.tier), "text-white")}
                            >
                              {message.user.tier}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-sm text-foreground break-words">{message.content}</p>
                          {message.upvotes > 0 && (
                            <div className="flex items-center space-x-1 mt-1">
                              <Heart className="h-3 w-3 text-red-500" />
                              <span className="text-xs text-muted-foreground">{message.upvotes}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>

            {/* Message Input */}
            <div className="border-t p-4">
              <div className="flex items-center space-x-2">
                <div className="flex-1 relative">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        sendMessage()
                      }
                    }}
                    placeholder={`Message ${selectedRoomData?.name}...`}
                    disabled={isSubmitting}
                  />
                </div>
                <Button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || isSubmitting}
                  className={cn(
                    "shrink-0 bg-gradient-to-r text-white",
                    selectedRoom === "grassroot" && "from-green-500 to-green-600",
                    selectedRoom === "pioneer" && "from-blue-500 to-blue-600",
                    selectedRoom === "elder" && "from-purple-500 to-purple-600",
                    selectedRoom === "blood" && "from-red-500 to-red-600",
                    (selectedRoom === "general" || selectedRoom === "freebies") && "from-gray-500 to-gray-600",
                  )}
                >
                  {isSubmitting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
