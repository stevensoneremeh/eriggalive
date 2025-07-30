"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Lock, MessageCircle, Crown } from "lucide-react"
import Link from "next/link"

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
    requiredTier: "blood",
    memberCount: 45,
    isActive: true,
    icon: <Crown className="h-6 w-6" />,
    color: "bg-red-600",
  },
  {
    id: "freebies",
    name: "Freebies Room",
    description: "Vote on and access free content",
    requiredTier: "grassroot",
    memberCount: 2100,
    isActive: true,
    icon: <MessageCircle className="h-6 w-6" />,
    color: "bg-yellow-500",
  },
]

const TIER_HIERARCHY = {
  grassroot: 1,
  pioneer: 2,
  elder: 3,
  blood: 4,
  admin: 5,
}

export default function ChatPage() {
  const { profile } = useAuth()
  const [availableRooms, setAvailableRooms] = useState<ChatRoom[]>([])

  useEffect(() => {
    if (profile?.tier) {
      const userTierLevel = TIER_HIERARCHY[profile.tier as keyof typeof TIER_HIERARCHY] || 0

      const accessible = CHAT_ROOMS.filter((room) => {
        const roomTierLevel = TIER_HIERARCHY[room.requiredTier as keyof typeof TIER_HIERARCHY] || 0
        return userTierLevel >= roomTierLevel
      })

      setAvailableRooms(accessible)
    }
  }, [profile])

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <Lock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Please log in to access the chat rooms.</p>
            <Link href="/login">
              <Button className="w-full">Log In</Button>
            </Link>
          </CardContent>
        </Card>
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
            <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">Your Tier: {profile.tier}</Badge>
          </div>
        </div>

        {/* Chat Rooms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableRooms.map((room) => (
            <Card
              key={room.id}
              className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:scale-105"
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
                    {room.requiredTier}+ tier
                  </Badge>
                  <Link href={`/chat/${room.id}`}>
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    >
                      Join Chat
                    </Button>
                  </Link>
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
                        Requires {room.requiredTier} tier
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
