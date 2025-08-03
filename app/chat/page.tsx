"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users, Lock, MessageCircle, Crown, Send } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"

interface ChatRoom {
  id: string
  name: string
  description: string
  requiredTier: string
  memberCount: number
  isActive: boolean
  icon: React.ReactNode
  color: string
}

interface Message {
  id: string
  content: string
  created_at: string
  user_id: string
  channel_id: string
  user: {
    id: string
    username: string
    full_name: string
    avatar_url: string
    tier: string
  }
}

const CHAT_ROOMS: ChatRoom[] = [
  {
    id: "general",
    name: "General Chat",
    description: "Open discussion for all community members",
    requiredTier: "grassroot",
    memberCount: 1250,
    isActive: true,
    icon: <MessageCircle className="h-6 w-6" />,
    color: "bg-blue-500",
  },
  {
    id: "grassroot",
    name: "Grassroot Lounge",
    description: "For Grassroot tier members and above",
    requiredTier: "grassroot",
    memberCount: 890,
    isActive: true,
    icon: <Users className="h-6 w-6" />,
    color: "bg-green-500",
  },
  {
    id: "pioneer",
    name: "Pioneer Hub",
    description: "Exclusive to Pioneer tier members and above",
    requiredTier: "pioneer",
    memberCount: 340,
    isActive: true,
    icon: <Crown className="h-6 w-6" />,
    color: "bg-blue-600",
  },
  {
    id: "elder",
    name: "Elder Council",
    description: "For Elder tier members and above",
    requiredTier: "elder",
    memberCount: 120,
    isActive: true,
    icon: <Crown className="h-6 w-6" />,
    color: "bg-purple-600",
  },
  {
    id: "blood",
    name: "Blood Brotherhood",
    description: "The most exclusive tier - Blood members only",
    requiredTier: "blood_brotherhood",
    memberCount: 45,
    isActive: true,
    icon: <Crown className="h-6 w-6" />,
    color: "bg-red-600",
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
  const { profile } = useAuth()
  const [availableRooms, setAvailableRooms] = useState<ChatRoom[]>([])
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (profile?.tier) {
      const userTierLevel = TIER_HIERARCHY[profile.tier as keyof typeof TIER_HIERARCHY] || 0

      const accessible = CHAT_ROOMS.filter((room) => {
        const roomTierLevel = TIER_HIERARCHY[room.requiredTier as keyof typeof TIER_HIERARCHY] || 0
        return userTierLevel >= roomTierLevel
      })

      setAvailableRooms(accessible)
      setLoading(false)
    }
  }, [profile])

  useEffect(() => {
    if (selectedRoom && profile) {
      fetchMessages(selectedRoom)
      setupRealtimeSubscription(selectedRoom)
    }
  }, [selectedRoom, profile])

  const setupRealtimeSubscription = (channelId: string) => {
    // Real-time subscription for chat messages
    const channel = supabase
      .channel(`chat-${channelId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `channel_id=eq.${channelId}`,
        },
        (payload) => {
          // Fetch the full message with user data
          fetchMessageWithUser(payload.new.id).then((newMessage) => {
            if (newMessage) {
              setMessages((prev) => [...prev, newMessage])
            }
          })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const fetchMessageWithUser = async (messageId: string) => {
    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .select(`
          *,
          user:users!chat_messages_user_id_fkey (
            id,
            username,
            full_name,
            avatar_url,
            tier
          )
        `)
        .eq("id", messageId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error("Error fetching message:", error)
      return null
    }
  }

  const fetchMessages = async (channelId: string) => {
    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .select(`
          *,
          user:users!chat_messages_user_id_fkey (
            id,
            username,
            full_name,
            avatar_url,
            tier
          )
        `)
        .eq("channel_id", channelId)
        .order("created_at", { ascending: true })
        .limit(50)

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error("Error fetching messages:", error)
      // Fallback to empty messages if table doesn't exist
      setMessages([])
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedRoom || !profile) return

    try {
      const { error } = await supabase.from("chat_messages").insert({
        content: newMessage.trim(),
        channel_id: selectedRoom,
        user_id: profile.id,
      })

      if (error) throw error

      setNewMessage("")
    } catch (error) {
      console.error("Error sending message:", error)
      toast.error("Failed to send message")
    }
  }

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <Lock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Please log in to access the chat rooms.</p>
            <Link href="/auth/signin">
              <Button className="w-full">Log In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (selectedRoom) {
    const room = CHAT_ROOMS.find((r) => r.id === selectedRoom)

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-4xl mx-auto p-4">
          <div className="mb-4">
            <Button onClick={() => setSelectedRoom(null)} variant="outline">
              ← Back to Rooms
            </Button>
          </div>

          <Card className="h-[600px] flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {room?.icon}
                {room?.name}
                <Badge className={getTierColor(room?.requiredTier || "grassroot")}>
                  {room?.requiredTier?.replace("_", " ").toUpperCase()}
                </Badge>
              </CardTitle>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col">
              <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                {messages.map((message) => (
                  <div key={message.id} className="flex items-start space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={message.user.avatar_url || "/placeholder-user.jpg"} />
                      <AvatarFallback>
                        {message.user.full_name?.charAt(0) || message.user.username?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-semibold text-sm">{message.user.full_name || message.user.username}</span>
                        <Badge className={`text-xs ${getTierColor(message.user.tier)}`}>
                          {message.user.tier?.replace("_", " ").toUpperCase()}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm">{message.content}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex space-x-2">
                <Input
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      sendMessage()
                    }
                  }}
                />
                <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-6xl mx-auto p-4">
        {/* Header */}
        <div className="text-center py-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Chat Rooms
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Connect with community members in tier-based chat rooms
          </p>
          <div className="mt-4">
            <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
              Your Tier: {profile.tier?.replace("_", " ").toUpperCase()}
            </Badge>
          </div>
        </div>

        {/* Chat Rooms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableRooms.map((room) => (
            <Card
              key={room.id}
              className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer"
              onClick={() => setSelectedRoom(room.id)}
            >
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-full ${room.color} text-white`}>{room.icon}</div>
                  <Badge variant="secondary" className="text-xs">
                    {room.memberCount} members
                  </Badge>
                </div>
                <CardTitle className="text-xl">{room.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">{room.description}</p>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">
                    {room.requiredTier?.replace("_", " ")}+ tier
                  </Badge>
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    Join Chat
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Locked Rooms */}
        {CHAT_ROOMS.length > availableRooms.length && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-center mb-6 text-gray-600 dark:text-gray-400">
              Upgrade Your Tier to Access
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {CHAT_ROOMS.filter((room) => !availableRooms.includes(room)).map((room) => (
                <Card
                  key={room.id}
                  className="border-0 shadow-lg bg-gray-100/80 dark:bg-gray-700/80 backdrop-blur-sm opacity-60"
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="p-3 rounded-full bg-gray-400 text-white">
                        <Lock className="h-6 w-6" />
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        Locked
                      </Badge>
                    </div>
                    <CardTitle className="text-xl text-gray-500">{room.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm">{room.description}</p>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        Requires {room.requiredTier?.replace("_", " ")} tier
                      </Badge>
                      <Link href="/premium">
                        <Button size="sm" variant="outline">
                          Upgrade
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
