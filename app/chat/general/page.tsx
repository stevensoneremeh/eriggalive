'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Send, Users } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import Link from 'next/link'

interface Message {
  id: string
  content: string
  user: {
    username: string
    full_name: string
    avatar_url?: string
    tier: string
  }
  created_at: string
}

// Mock messages for demonstration
const mockMessages: Message[] = [
  {
    id: '1',
    content: 'Welcome to the general chat! 🎵',
    user: {
      username: 'erigga_official',
      full_name: 'Erigga',
      avatar_url: '/placeholder-user.jpg',
      tier: 'blood'
    },
    created_at: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: '2',
    content: 'Just dropped a new track, check it out!',
    user: {
      username: 'fan_boy_123',
      full_name: 'John Doe',
      tier: 'grassroot'
    },
    created_at: new Date(Date.now() - 1800000).toISOString()
  },
  {
    id: '3',
    content: 'The new album is fire! 🔥🔥🔥',
    user: {
      username: 'music_lover',
      full_name: 'Jane Smith',
      tier: 'pioneer'
    },
    created_at: new Date(Date.now() - 900000).toISOString()
  }
]

const getTierColor = (tier: string) => {
  switch (tier) {
    case 'blood': return 'bg-red-500'
    case 'elder': return 'bg-orange-500'
    case 'pioneer': return 'bg-purple-500'
    case 'mod': return 'bg-yellow-500'
    case 'grassroot': return 'bg-green-500'
    default: return 'bg-gray-500'
  }
}

export default function GeneralChatPage() {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>(mockMessages)
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !user) return

    setIsLoading(true)
    
    // Simulate sending message
    const message: Message = {
      id: Date.now().toString(),
      content: newMessage.trim(),
      user: {
        username: user.user_metadata?.username || user.email?.split('@')[0] || 'user',
        full_name: user.user_metadata?.full_name || user.email || 'User',
        avatar_url: user.user_metadata?.avatar_url,
        tier: 'grassroot' // Default tier
      },
      created_at: new Date().toISOString()
    }

    setMessages(prev => [...prev, message])
    setNewMessage('')
    setIsLoading(false)
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-4">Please sign in to join the chat.</p>
            <Button asChild>
              <Link href="/login">Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">General Chat</h1>
            <p className="text-muted-foreground">Open discussion for all members</p>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Users className="h-4 w-4 mr-1" />
            1,247 members online
          </div>
        </div>
      </div>

      <Card className="h-[600px] flex flex-col">
        <CardContent className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className="flex items-start space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={message.user.avatar_url || "/placeholder.svg"} />
                  <AvatarFallback>
                    {message.user.full_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-sm">
                      {message.user.full_name}
                    </span>
                    <Badge 
                      className={`text-xs ${getTierColor(message.user.tier)} text-white`}
                    >
                      {message.user.tier}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatTime(message.created_at)}
                    </span>
                  </div>
                  <p className="text-sm mt-1 break-words">
                    {message.content}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </CardContent>
        
        <div className="border-t p-4">
          <form onSubmit={handleSendMessage} className="flex space-x-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading || !newMessage.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  )
}
