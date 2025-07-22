"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { Send, ThumbsUp, Users, Lock, Crown, Star, Zap, Flame, MessageCircle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"

interface ChatMessage {
  id: string
  content: string
  vote_count: number
  created_at: string
  user: {
    id: string
    username: string
    full_name: string | null
    avatar_url: string | null
    tier: string
  }
  has_voted?: boolean
}

interface TierChatRoomsProps {
  userTier: string
}

const CHAT_ROOMS = [
  {
    id: "street-rep",
    name: "Street Rep",
    description: "General discussions for all fans",
    requiredTier: "grassroot",
    icon: Star,
    color: "from-green-500 to-emerald-500",
    textColor: "text-green-600",
    bgColor: "bg-green-50 dark:bg-green-900/20",
  },
  {
    id: "warri-elite",
    name: "Warri Elite",
    description: "Exclusive discussions for Pioneer members",
    requiredTier: "pioneer",
    icon: Zap,
    color: "from-blue-500 to-cyan-500",
    textColor: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-900/20",
  },
  {
    id: "erigma-circle",
    name: "Erigma Circle",
    description: "VIP discussions for Elder members",
    requiredTier: "elder",
    icon: Crown,
    color: "from-purple-500 to-violet-500",
    textColor: "text-purple-600",
    bgColor: "bg-purple-50 dark:bg-purple-900/20",
  },
  {
    id: "blood-brotherhood",
    name: "Blood Brotherhood",
    description: "Ultimate exclusive access",
    requiredTier: "blood_brotherhood",
    icon: Flame,
    color: "from-red-500 to-rose-500",
    textColor: "text-red-600",
    bgColor: "bg-red-50 dark:bg-red-900/20",
  },
]

const TIER_HIERARCHY = {
  grassroot: 1,
  pioneer: 2,
  elder: 3,
  blood_brotherhood: 4,
}

export function TierChatRooms({ userTier }: TierChatRoomsProps) {
  const [selectedRoom, setSelectedRoom] = useState<string>("street-rep")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)

  const { profile } = useAuth()
  const { toast } = useToast()
  const supabase = createClient()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const userTierLevel = TIER_HIERARCHY[userTier as keyof typeof TIER_HIERARCHY] || 1
  const availableRooms = CHAT_ROOMS.filter(
    (room) => TIER_HIERARCHY[room.requiredTier as keyof typeof TIER_HIERARCHY] <= userTierLevel,
  )

  const currentRoom = CHAT_ROOMS.find((room) => room.id === selectedRoom)

  useEffect(() => {
    loadMessages()

    // Set up real-time subscription
    const channel = supabase
      .channel(`chat_${selectedRoom}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `room_id=eq.${selectedRoom}`,
        },
        (payload) => {
          console.log("New message received:", payload)
          loadMessages() // Reload messages when new one is added
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedRoom, supabase])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const loadMessages = async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from("chat_messages")
        .select(`
          *,
          user:users!chat_messages_user_id_fkey(
            id,
            username,
            full_name,
            avatar_url,
            tier
          )
        `)
        .eq("room_id", selectedRoom)
        .order("created_at", { ascending: true })
        .limit(50)

      if (error) throw error

      // Get vote status for each message if user is logged in
      let messagesWithVoteStatus = data || []

      if (profile) {
        messagesWithVoteStatus = await Promise.all(
          (data || []).map(async (message) => {
            const { data: voteData } = await supabase
              .from("chat_message_votes")
              .select("user_id")
              .eq("message_id", message.id)
              .eq("user_id", profile.id)
              .single()

            return {
              ...message,
              has_voted: !!voteData,
            }
          }),
        )
      }

      setMessages(messagesWithVoteStatus)
    } catch (error) {
      console.error("Error loading messages:", error)
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!profile) {
      toast({
        title: "Sign in required",
        description: "Please sign in to send messages",
        variant: "destructive",
      })
      return
    }

    if (!newMessage.trim()) return

    try {
      setSending(true)

      const { error } = await supabase.from("chat_messages").insert({
        content: newMessage.trim(),
        user_id: profile.id,
        room_id: selectedRoom,
      })

      if (error) throw error

      setNewMessage("")
      toast({ title: "Message sent!" })
    } catch (error) {
      console.error("Error sending message:", error)
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      })
    } finally {
      setSending(false)
    }
  }

  const voteMessage = async (messageId: string) => {
    if (!profile) {
      toast({
        title: "Sign in required",
        description: "Please sign in to vote on messages",
        variant: "destructive",
      })
      return
    }

    try {
      const { data: existingVote } = await supabase
        .from("chat_message_votes")
        .select("id")
        .eq("message_id", messageId)
        .eq("user_id", profile.id)
        .single()

      if (existingVote) {
        // Remove vote
        await supabase.from("chat_message_votes").delete().eq("message_id", messageId).eq("user_id", profile.id)

        // Update local state
        setMessages(
          messages.map((msg) =>
            msg.id === messageId ? { ...msg, vote_count: msg.vote_count - 1, has_voted: false } : msg,
          ),
        )

        toast({ title: "Vote removed" })
      } else {
        // Add vote
        await supabase.from("chat_message_votes").insert({
          message_id: messageId,
          user_id: profile.id,
          vote_type: "up",
        })

        // Update local state
        setMessages(
          messages.map((msg) =>
            msg.id === messageId ? { ...msg, vote_count: msg.vote_count + 1, has_voted: true } : msg,
          ),
        )

        toast({ title: "Vote added!" })
      }
    } catch (error) {
      console.error("Error voting:", error)
      toast({
        title: "Error",
        description: "Failed to vote on message",
        variant: "destructive",
      })
    }
  }

  const getTierIcon = (tier: string) => {
    const room = CHAT_ROOMS.find((r) => r.requiredTier === tier)
    return room?.icon || Star
  }

  const getTierColor = (tier: string) => {
    const room = CHAT_ROOMS.find((r) => r.requiredTier === tier)
    return room?.textColor || "text-gray-500"
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
      {/* Room List */}
      <div className="lg:col-span-1">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Chat Rooms
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {CHAT_ROOMS.map((room) => {
              const Icon = room.icon
              const hasAccess = TIER_HIERARCHY[room.requiredTier as keyof typeof TIER_HIERARCHY] <= userTierLevel
              const isSelected = selectedRoom === room.id

              return (
                <div
                  key={room.id}
                  onClick={() => hasAccess && setSelectedRoom(room.id)}
                  className={cn(
                    "p-4 rounded-lg cursor-pointer transition-all duration-200",
                    hasAccess ? "hover:shadow-md" : "opacity-50 cursor-not-allowed",
                    isSelected && hasAccess
                      ? `bg-gradient-to-r ${room.color} text-white shadow-lg`
                      : hasAccess
                        ? room.bgColor
                        : "bg-gray-100 dark:bg-gray-800",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "p-2 rounded-full",
                        isSelected && hasAccess ? "bg-white/20" : "bg-white dark:bg-gray-700",
                      )}
                    >
                      {hasAccess ? (
                        <Icon className={cn("h-4 w-4", isSelected ? "text-white" : room.textColor)} />
                      ) : (
                        <Lock className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className={cn("font-semibold text-sm", isSelected && hasAccess ? "text-white" : "")}>
                          {room.name}
                        </h3>
                        {!hasAccess && <Lock className="h-3 w-3 text-gray-400" />}
                      </div>
                      <p
                        className={cn(
                          "text-xs",
                          isSelected && hasAccess ? "text-white/80" : "text-gray-500 dark:text-gray-400",
                        )}
                      >
                        {room.description}
                      </p>
                      <Badge
                        variant="outline"
                        className={cn("text-xs mt-1", isSelected && hasAccess ? "border-white/30 text-white/90" : "")}
                      >
                        {room.requiredTier.charAt(0).toUpperCase() + room.requiredTier.slice(1).replace("_", " ")}+
                      </Badge>
                    </div>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      {/* Chat Area */}
      <div className="lg:col-span-3">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 h-full flex flex-col">
          {/* Chat Header */}
          <CardHeader className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              {currentRoom && (
                <>
                  <div className={cn("p-3 rounded-full bg-gradient-to-r", currentRoom.color)}>
                    <currentRoom.icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{currentRoom.name}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{currentRoom.description}</p>
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-500">
                      {messages.length > 0 ? `${new Set(messages.map((m) => m.user.id)).size} active` : "0 active"}
                    </span>
                  </div>
                </>
              )}
            </div>
          </CardHeader>

          {/* Messages */}
          <CardContent className="flex-1 p-0">
            <ScrollArea className="h-full p-4">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-center">
                  <MessageCircle className="h-12 w-12 text-gray-300 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No messages yet. Be the first to start the conversation!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => {
                    const TierIcon = getTierIcon(message.user.tier)
                    const tierColor = getTierColor(message.user.tier)

                    return (
                      <div key={message.id} className="flex gap-3 group">
                        <Avatar className="h-8 w-8 ring-2 ring-white dark:ring-gray-800">
                          <AvatarImage src={message.user.avatar_url || "/placeholder.svg"} />
                          <AvatarFallback className="text-xs">
                            {message.user.username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm">
                              {message.user.full_name || message.user.username}
                            </span>
                            <TierIcon className={cn("h-3 w-3", tierColor)} />
                            <Badge variant="outline" className={cn("text-xs", tierColor)}>
                              {message.user.tier.charAt(0).toUpperCase() + message.user.tier.slice(1)}
                            </Badge>
                            <span className="text-xs text-gray-400">
                              {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">{message.content}</p>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => voteMessage(message.id)}
                              className={cn(
                                "h-6 px-2 text-xs transition-all",
                                message.has_voted
                                  ? "text-blue-600 bg-blue-50 hover:bg-blue-100"
                                  : "text-gray-500 hover:text-blue-600",
                              )}
                            >
                              <ThumbsUp className={cn("h-3 w-3 mr-1", message.has_voted && "fill-current")} />
                              {message.vote_count}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>
          </CardContent>

          {/* Message Input */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <form onSubmit={sendMessage} className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={`Message ${currentRoom?.name}...`}
                className="flex-1"
                maxLength={500}
                disabled={sending}
              />
              <Button
                type="submit"
                disabled={!newMessage.trim() || sending}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              >
                {sending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
            <div className="text-xs text-gray-400 mt-1 text-right">{newMessage.length}/500</div>
          </div>
        </Card>
      </div>
    </div>
  )
}
