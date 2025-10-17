"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  MessageCircle,
  Send,
  Search,
  Plus,
  MoreHorizontal,
  Phone,
  Video,
  Paperclip,
  Smile,
  Check,
  CheckCheck,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase-utils"
import type { Database } from "@/types/database"

interface Conversation {
  id: number
  type: string
  title?: string
  avatar_url?: string
  participants: any[]
  last_message?: any
  unread_count: number
  updated_at: string
}

interface Message {
  id: number
  conversation_id: number
  sender_id: number
  content: string
  message_type: string
  media_url?: string
  is_read: boolean
  created_at: string
  sender: any
}

export function MessageCenter() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { user, profile } = useAuth()
  const { toast } = useToast()
  const supabase = createClient()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const loadConversations = useCallback(async () => {
    if (!user || !profile) return

    try {
      // This would be a complex query joining conversations, participants, and messages
      // For now, we'll use dummy data
      const dummyConversations: Conversation[] = [
        {
          id: 1,
          type: "direct",
          title: "Erigga Official",
          avatar_url: "/placeholder-user.jpg",
          participants: [],
          last_message: {
            content: "Thanks for the support! 🙏",
            created_at: new Date(Date.now() - 3600000).toISOString(),
          },
          unread_count: 2,
          updated_at: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: 2,
          type: "direct",
          title: "Community Moderator",
          avatar_url: "/placeholder-user.jpg",
          participants: [],
          last_message: {
            content: "Welcome to the community!",
            created_at: new Date(Date.now() - 7200000).toISOString(),
          },
          unread_count: 0,
          updated_at: new Date(Date.now() - 7200000).toISOString(),
        },
      ]

      setConversations(dummyConversations)
    } catch (error) {
      console.error("Error loading conversations:", error)
    } finally {
      setLoading(false)
    }
  }, [user, profile])

  const loadMessages = useCallback(
    async (conversationId: number) => {
      try {
        // Dummy messages for demo
        const dummyMessages: Message[] = [
          {
            id: 1,
            conversation_id: conversationId,
            sender_id: 1,
            content: "Hey! Welcome to the community 🎵",
            message_type: "text",
            is_read: true,
            created_at: new Date(Date.now() - 7200000).toISOString(),
            sender: { id: 1, username: "erigga_official", avatar_url: "/placeholder-user.jpg" },
          },
          {
            id: 2,
            conversation_id: conversationId,
            sender_id: profile?.id || 2,
            content: "Thank you! I'm excited to be here",
            message_type: "text",
            is_read: true,
            created_at: new Date(Date.now() - 7000000).toISOString(),
            sender: { id: profile?.id || 2, username: profile?.username, avatar_url: profile?.avatar_url },
          },
          {
            id: 3,
            conversation_id: conversationId,
            sender_id: 1,
            content: "Thanks for the support! 🙏",
            message_type: "text",
            is_read: false,
            created_at: new Date(Date.now() - 3600000).toISOString(),
            sender: { id: 1, username: "erigga_official", avatar_url: "/placeholder-user.jpg" },
          },
        ]

        setMessages(dummyMessages)
        setTimeout(scrollToBottom, 100)
      } catch (error) {
        console.error("Error loading messages:", error)
      }
    },
    [profile],
  )

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id)
    }
  }, [selectedConversation, loadMessages])

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !profile) return

    const tempMessage: Message = {
      id: Date.now(),
      conversation_id: selectedConversation.id,
      sender_id: profile.id,
      content: newMessage,
      message_type: "text",
      is_read: false,
      created_at: new Date().toISOString(),
      sender: {
        id: profile.id,
        username: profile.username,
        avatar_url: profile.avatar_url,
      },
    }

    setMessages((prev) => [...prev, tempMessage])
    setNewMessage("")
    setTimeout(scrollToBottom, 100)

    try {
      // Here you would send the message to the backend
      toast({
        title: "Message Sent",
        description: "Your message has been delivered.",
      })
    } catch (error) {
      console.error("Error sending message:", error)
      toast({
        title: "Failed to Send",
        description: "Please try again.",
        variant: "destructive",
      })
    }
  }

  const getMessageStatus = (message: Message) => {
    if (message.sender_id === profile?.id) {
      return message.is_read ? (
        <CheckCheck className="h-3 w-3 text-blue-500" />
      ) : (
        <Check className="h-3 w-3 text-gray-400" />
      )
    }
    return null
  }

  const totalUnreadCount = conversations.reduce((sum, conv) => sum + conv.unread_count, 0)

  if (!user) return null

  return (
    <div className="relative">
      <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)} className="relative">
        <MessageCircle className="h-5 w-5" />
        {totalUnreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {totalUnreadCount > 99 ? "99+" : totalUnreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <Card className="absolute right-0 top-12 w-96 h-[600px] shadow-xl border-0 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl z-50 flex flex-col">
          {!selectedConversation ? (
            <>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Messages</CardTitle>
                  <div className="flex items-center gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>New Message</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Input placeholder="Search users..." />
                          <p className="text-sm text-muted-foreground">Search for users to start a conversation</p>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8">
                      ×
                    </Button>
                  </div>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardHeader>

              <CardContent className="flex-1 p-0">
                <ScrollArea className="h-full">
                  {loading ? (
                    <div className="p-4 space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-center space-x-3 animate-pulse">
                          <div className="h-12 w-12 bg-slate-200 dark:bg-slate-700 rounded-full" />
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : conversations.length === 0 ? (
                    <div className="p-8 text-center">
                      <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No conversations yet</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Start a conversation with other community members
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {conversations
                        .filter(
                          (conv) =>
                            conv.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            conv.last_message?.content.toLowerCase().includes(searchQuery.toLowerCase()),
                        )
                        .map((conversation) => (
                          <div
                            key={conversation.id}
                            className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors"
                            onClick={() => setSelectedConversation(conversation)}
                          >
                            <div className="flex items-center space-x-3">
                              <div className="relative">
                                <Avatar className="h-12 w-12">
                                  <AvatarImage src={conversation.avatar_url || "/placeholder-user.jpg"} />
                                  <AvatarFallback>{conversation.title?.charAt(0).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                {conversation.unread_count > 0 && (
                                  <Badge
                                    variant="destructive"
                                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                                  >
                                    {conversation.unread_count}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium truncate">{conversation.title}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(new Date(conversation.updated_at), { addSuffix: true })}
                                  </p>
                                </div>
                                <p className="text-sm text-muted-foreground truncate">
                                  {conversation.last_message?.content}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedConversation(null)}
                      className="h-8 w-8"
                    >
                      ←
                    </Button>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={selectedConversation.avatar_url || "/placeholder-user.jpg"} />
                      <AvatarFallback>{selectedConversation.title?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{selectedConversation.title}</p>
                      <p className="text-xs text-muted-foreground">Online</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Video className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1 p-0 flex flex-col">
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender_id === profile?.id ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-3 ${
                            message.sender_id === profile?.id ? "bg-primary text-primary-foreground" : "bg-muted"
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-xs opacity-70">
                              {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                            </p>
                            {getMessageStatus(message)}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                <div className="p-4 border-t">
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <div className="flex-1 relative">
                      <Textarea
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault()
                            sendMessage()
                          }
                        }}
                        className="min-h-[40px] max-h-[120px] resize-none pr-10"
                      />
                      <Button variant="ghost" size="icon" className="absolute right-1 top-1 h-8 w-8">
                        <Smile className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button onClick={sendMessage} disabled={!newMessage.trim()} size="icon" className="h-8 w-8">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </>
          )}
        </Card>
      )}
    </div>
  )
}
