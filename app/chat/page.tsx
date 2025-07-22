'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MessageCircle, Users, Crown, Star, Zap } from 'lucide-react'

const chatRooms = [
  {
    id: 'general',
    name: 'General Chat',
    description: 'Open discussion for all members',
    icon: MessageCircle,
    members: 1247,
    tier: 'all',
    color: 'bg-blue-500',
    href: '/chat/general'
  },
  {
    id: 'grassroot',
    name: 'Grassroot Lounge',
    description: 'Exclusive chat for Grassroot members',
    icon: Users,
    members: 892,
    tier: 'grassroot',
    color: 'bg-green-500',
    href: '/chat/grassroot'
  },
  {
    id: 'mod',
    name: 'Mod Squad',
    description: 'Moderator exclusive discussions',
    icon: Star,
    members: 156,
    tier: 'mod',
    color: 'bg-yellow-500',
    href: '/chat/mod'
  },
  {
    id: 'pioneer',
    name: 'Pioneer Circle',
    description: 'Pioneer tier member discussions',
    icon: Crown,
    members: 78,
    tier: 'pioneer',
    color: 'bg-purple-500',
    href: '/chat/pioneer'
  },
  {
    id: 'elder',
    name: 'Elder Council',
    description: 'Elder tier exclusive chat',
    icon: Zap,
    members: 34,
    tier: 'elder',
    color: 'bg-orange-500',
    href: '/chat/elder'
  },
  {
    id: 'blood',
    name: 'Blood Brotherhood',
    description: 'Highest tier exclusive chat',
    icon: Crown,
    members: 12,
    tier: 'blood',
    color: 'bg-red-500',
    href: '/chat/blood'
  }
]

const getTierBadgeColor = (tier: string) => {
  switch (tier) {
    case 'all': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
    case 'grassroot': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
    case 'mod': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
    case 'pioneer': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
    case 'elder': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
    case 'blood': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
  }
}

export default function ChatPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Chat Rooms</h1>
        <p className="text-muted-foreground">
          Connect with the community in our various chat rooms
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {chatRooms.map((room) => {
          const Icon = room.icon
          return (
            <Card key={room.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg ${room.color} text-white`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <Badge className={getTierBadgeColor(room.tier)}>
                    {room.tier === 'all' ? 'Open' : room.tier}
                  </Badge>
                </div>
                <CardTitle className="text-xl">{room.name}</CardTitle>
                <CardDescription>{room.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Users className="h-4 w-4 mr-1" />
                    {room.members.toLocaleString()} members
                  </div>
                  <Button asChild>
                    <Link href={room.href}>
                      Join Chat
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="mt-12 text-center">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Chat Guidelines</CardTitle>
            <CardDescription>
              Please follow these rules to maintain a positive community environment
            </CardDescription>
          </CardHeader>
          <CardContent className="text-left">
            <ul className="space-y-2 text-sm">
              <li>• Be respectful to all community members</li>
              <li>• No spam, excessive self-promotion, or off-topic content</li>
              <li>• Keep discussions relevant to the chat room's purpose</li>
              <li>• No harassment, hate speech, or discriminatory language</li>
              <li>• Follow moderator instructions and community guidelines</li>
              <li>• Report inappropriate behavior to moderators</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
