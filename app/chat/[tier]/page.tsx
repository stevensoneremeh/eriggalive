'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Send, Users, Lock } from 'lucide-react'
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

const tierInfo: Record<string, { name: string; description: string; color: string; requiredTier: string }> = {
  grassroot: {
    name: 'Grassroot Lounge',
    description: 'Exclusive chat for Grassroot members',
    color: 'bg-green-500',
    requiredTier: 'grassroot'
  },
  mod: {
    name: 'Mod Squad',
    description: 'Moderator exclusive discussions',
    color: 'bg-yellow-500',
    requiredTier: 'mod'
  },
  pioneer: {
    name: 'Pioneer Circle',
    description: 'Pioneer tier member discussions',
    color: 'bg-purple-500',
    requiredTier: 'pioneer'
  },
  elder: {
    name: 'Elder Council',
    description: 'Elder tier exclusive chat',
    color: 'bg-orange-500',
    requiredTier: 'elder'
  },
  blood: {
    name: 'Blood Brotherhood',
    description: 'Highest tier exclusive chat',
    color: 'bg-red-500',
    requiredTier: 'blood'
  }
}

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

export default function TierChatPage() {
  const params = useParams()
  const tier = params.tier as string
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [userTier, setUserTier] = useState<string>('grassroot') // Mock user tier
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const currentTierInfo = tierInfo[tier]

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const hasAccess = () => {
    if (!currentTierInfo) return false
    
    const tierHierarchy = ['grassroot', 'mod', 'pioneer', 'elder', 'blood']
    const userTierIndex = tierHierarchy.indexOf(userTier)
    const requiredTierIndex = tierHierarchy.indexOf(currentTierInfo.requiredTier)
    
    return userTierIndex >= requiredTierIndex
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !user || !hasAccess()) return

    setIsLoading(true)
    
    // Simulate sending message
    const message: Message = {
      id: Date.now().toString(),
      content: newMessage.trim(),
      user: {
        username: user.user_metadata?.username || user.email?.split('@')[0] || 'user',
        full_name: user.user_metadata?.full_name || user.email || 'User',
        avatar_url: user.user_metadata?.avatar_url,
        tier: userTier
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

  if (!currentTierInfo) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Chat Room Not Found</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-4">The requested chat room does not exist.</p>
            <Button asChild>
              <Link href="/chat">Back to Chat Rooms</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!hasAccess()) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lock className="h-5 w-5 mr-2" />
              Access Restricted
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-4">
              You need {currentTierInfo.requiredTier} tier or higher to access this chat room.
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Your current tier: <Badge className={getTierColor(userTier)}>{userTier}</Badge>
            </p>
            <div className="space-y-2">
              <Button asChild>
                <Link href="/premium">Upgrade Membership</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/chat">Back to Chat Rooms</Link>
              </Button>
            </div>
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
            <h1 className="text-2xl font-bold flex items-center">
              <div className={`p-2 rounded-lg ${currentTierInfo.color} text-white mr-3`}>
                <Lock className="h-5 w-5" />
              </div>
              {currentTierInfo.name}
            </h1>
            <p className="text-muted-foreground">{currentTierInfo.description}</p>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Users className="h-4 w-4 mr-1" />
            {Math.floor(Math.random() * 100) + 20} members online
          </div>
        </div>
      </div>

      <Card className="h-[600px] flex flex-col">
        <CardContent className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Lock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Welcome to the {currentTierInfo.name}!</p>
                <p className="text-sm">Be the first to start the conversation.</p>
              </div>
            ) : (
              messages.map((message) => (
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
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </CardContent>
        
        <div className="border-t p-4">
          <form onSubmit={handleSendMessage} className="flex space-x-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={`Message ${currentTierInfo.name}...`}
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
