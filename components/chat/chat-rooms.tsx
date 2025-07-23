"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useAbly } from "@/contexts/ably-context"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Users, TrendingUp, TrendingDown } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface ChatRoom {
  id: string
  name: string
  description: string
  room_type: string
  required_tier: string
}

interface ChatMessage {
  id: string
  content: string
  created_at: string
  upvotes: number
  downvotes: number
  users: {
    id: string
    username: string
    avatar_url: string | null
    tier: string
  }
}

export function ChatRooms() {
  const { user, profile } = useAuth()
  const { ably, isConnected } = useAbly()
  const [rooms, setRooms] = useState<ChatRoom[]>([])
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchRooms()
  }, [])

  useEffect(() => {
    if (activeRoom) {
      fetchMessages(activeRoom.id)
    }
  }, [activeRoom])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (ably && isConnected && activeRoom) {
      const channel = ably.channels.get(`chat:${activeRoom.id}`)

      // Subscribe to new messages
      channel.subscribe("message", (message) => {
        const newMessage = message.data
        setMessages((prev) => [...prev, newMessage])
      })

      // Subscribe to message votes
      channel.subscribe("vote", (message) => {
        const { messageId, upvotes, downvotes } = message.data
        setMessages((prev) => prev.map((msg) => (msg.id === messageId ? { ...msg, upvotes, downvotes } : msg)))
      })

      // Subscribe to presence
      channel.presence.enter({ username: profile?.username })

      channel.presence.subscribe("enter", (member) => {
        setOnlineUsers((prev) => [...prev, member.data.username])
      })

      channel.presence.subscribe("leave", (member) => {
        setOnlineUsers((prev) => prev.filter((u) => u !== member.data.username))
      })

      return () => {
        channel.unsubscribe()
        channel.presence.leave()
      }
    }
  }, [ably, isConnected, activeRoom, profile])

  const fetchRooms = async () => {
    try {
      const { data, error } = await supabase.from("chat_rooms").select("*").eq("is_active", true).order("name")

      if (error) throw error

      const accessibleRooms =
        data?.filter((room) => {
          if (room.room_type === "general") return true
          if (!profile) return false

          const tierOrder = ["grassroot", "pioneer", "elder", "blood", "mod", "admin"]
          const userTierIndex = tierOrder.indexOf(profile.tier)
          const roomTierIndex = tierOrder.indexOf(room.required_tier)

          return userTierIndex >= roomTierIndex
        }) || []

      setRooms(accessibleRooms)
      if (accessibleRooms.length > 0 && !activeRoom) {
        setActiveRoom(accessibleRooms[0])
      }
    } catch (error) {
      console.error("Error fetching rooms:", error)
    }
  }

  const fetchMessages = async (roomId: string) => {
    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .select(`
          *,
          users (id, username, avatar_url, tier)
        `)
        .eq("room_id", roomId)
        .eq("is_deleted", false)
        .order("created_at", { ascending: true })
        .limit(50)

      if (error) throw error

      setMessages(data || [])
    } catch (error) {
      console.error("Error fetching messages:", error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeRoom || !profile) return

    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .insert({
          room_id: activeRoom.id,
          user_id: profile.id,
          content: newMessage.trim(),
        })
        .select(`
          *,
          users (id, username, avatar_url, tier)
        `)
        .single()

      if (error) throw error

      // Publish to Ably
      if (ably && isConnected) {
        const channel = ably.channels.get(`chat:${activeRoom.id}`)
        channel.publish("message", data)
      }

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

  const voteMessage = async (messageId: string, voteType: number) => {
    if (!profile) return

    try {
      const { error } = await supabase.from("chat_message_votes").upsert({
        message_id: messageId,
        user_id: profile.id,
        vote_type: voteType,
      })

      if (error) throw error

      // Fetch updated vote counts
      const { data: updatedMessage } = await supabase
        .from("chat_messages")
        .select("upvotes, downvotes")
        .eq("id", messageId)
        .single()

      if (updatedMessage && ably && isConnected && activeRoom) {
        const channel = ably.channels.get(`chat:${activeRoom.id}`)
        channel.publish("vote", {
          messageId,
          upvotes: updatedMessage.upvotes,
          downvotes: updatedMessage.downvotes,
        })
      }
    } catch (error) {
      console.error("Error voting:", error)
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "blood":
        return "bg-red-500"
      case "elder":
        return "bg-purple-500"
      case "pioneer":
        return "bg-blue-500"
      default:
        return "bg-green-500"
    }
  }

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Chat Rooms</h2>
          <div className="flex items-center space-x-2 mt-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
            <span className="text-sm text-gray-600">{isConnected ? "Connected" : "Disconnected"}</span>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2">
            {rooms.map((room) => (
              <Button
                key={room.id}
                variant={activeRoom?.id === room.id ? "default" : "ghost"}
                className="w-full justify-start mb-1"
                onClick={() => setActiveRoom(room)}
              >
                <div className="text-left">
                  <div className="font-medium">{room.name}</div>
                  <div className="text-xs text-gray-500">{room.description}</div>
                </div>
              </Button>
            ))}
          </div>
        </ScrollArea>

        {/* Online Users */}
        <div className="p-4 border-t">
          <div className="flex items-center space-x-2 mb-2">
            <Users className="w-4 h-4" />
            <span className="text-sm font-medium">Online ({onlineUsers.length})</span>
          </div>
          <div className="space-y-1">
            {onlineUsers.slice(0, 5).map((username, index) => (
              <div key={index} className="text-xs text-gray-600">
                {username}
              </div>
            ))}
            {onlineUsers.length > 5 && <div className="text-xs text-gray-500">+{onlineUsers.length - 5} more</div>}
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeRoom ? (
          <>
            {/* Chat Header */}
            <div className="p-4 bg-white border-b border-gray-200">
              <h3 className="text-lg font-semibold">{activeRoom.name}</h3>
              <p className="text-sm text-gray-600">{activeRoom.description}</p>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className="flex space-x-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={message.users.avatar_url || ""} />
                      <AvatarFallback>{message.users.username[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-sm">{message.users.username}</span>
                        <Badge className={`${getTierColor(message.users.tier)} text-xs`}>{message.users.tier}</Badge>
                        <span className="text-xs text-gray-500">
                          {new Date(message.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-800 mt-1">{message.content}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => voteMessage(message.id, 1)}
                          className="h-6 px-2 text-xs"
                        >
                          <TrendingUp className="w-3 h-3 mr-1" />
                          {message.upvotes}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => voteMessage(message.id, -1)}
                          className="h-6 px-2 text-xs"
                        >
                          <TrendingDown className="w-3 h-3 mr-1" />
                          {message.downvotes}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 bg-white border-t border-gray-200">
              <div className="flex space-x-2">
                <Input
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                />
                <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-500">Select a chat room to start messaging</p>
          </div>
        )}
      </div>
    </div>
  )
}
