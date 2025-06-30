"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context" // Keep your existing auth
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, MessageCircle, Crown, Shield, Star, Zap } from "lucide-react"
import Link from "next/link"

interface ChatRoom {
  id: string
  name: string
  description: string
  tier_required: string
  member_count: number
  icon: React.ReactNode
  color: string
}

const CHAT_ROOMS: ChatRoom[] = [
  {
    id: "general",
    name: "General Chat",
    description: "Open discussion for all community members",
    tier_required: "grassroot",
    member_count: 1247,
    icon: <MessageCircle className="h-6 w-6" />,
    color: "bg-blue-500",
  },
  {
    id: "freebies",
    name: "Freebies Room",
    description: "Vote on free content and exclusive drops",
    tier_required: "grassroot",
    member_count: 892,
    icon: <Star className="h-6 w-6" />,
    color: "bg-yellow-500",
  },
  {
    id: "grassroot",
    name: "Grassroot Lounge",
    description: "Grassroot tier members discussion",
    tier_required: "grassroot",
    member_count: 634,
    icon: <Users className="h-6 w-6" />,
    color: "bg-green-500",
  },
  {
    id: "pioneer",
    name: "Pioneer Hub",
    description: "Pioneer tier exclusive discussions",
    tier_required: "pioneer",
    member_count: 298,
    icon: <Zap className="h-6 w-6" />,
    color: "bg-blue-600",
  },
  {
    id: "elder",
    name: "Elder Council",
    description: "Elder tier strategic discussions",
    tier_required: "elder",
    member_count: 127,
    icon: <Shield className="h-6 w-6" />,
    color: "bg-purple-600",
  },
  {
    id: "blood",
    name: "Blood Brotherhood",
    description: "Blood tier inner circle",
    tier_required: "blood",
    member_count: 45,
    icon: <Crown className="h-6 w-6" />,
    color: "bg-red-600",
  },
]

const TIER_HIERARCHY = {
  grassroot: 1,
  pioneer: 2,
  elder: 3,
  blood: 4,
}

export default function ChatPage() {
  const { user, profile } = useAuth() // Use your existing auth
  const [accessibleRooms, setAccessibleRooms] = useState<ChatRoom[]>([])

  useEffect(() => {
    if (profile) {
      const userTierLevel = TIER_HIERARCHY[profile.tier as keyof typeof TIER_HIERARCHY] || 1

      const accessible = CHAT_ROOMS.filter((room) => {
        const roomTierLevel = TIER_HIERARCHY[room.tier_required as keyof typeof TIER_HIERARCHY] || 1
        return userTierLevel >= roomTierLevel
      })

      setAccessibleRooms(accessible)
    }
  }, [profile])

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-2xl font-bold mb-2">Join the Conversation</h2>
            <p className="text-gray-600 mb-4">Sign in to access chat rooms and connect with the community</p>
            <Link href="/login">
              <Button className="w-full">Sign In</Button>
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
          <p className="text-gray-600 dark:text-gray-400 mt-2">Connect with fellow fans in tier-based discussions</p>
          {profile && (
            <Badge className="mt-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white">
              Your Tier: {profile.tier.toUpperCase()}
            </Badge>
          )}
        </div>

        {/* Chat Rooms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accessibleRooms.map((room) => (
            <Card
              key={room.id}
              className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 cursor-pointer group"
            >
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-full ${room.color} text-white`}>{room.icon}</div>
                  <Badge variant="secondary" className="text-xs">
                    {room.member_count} members
                  </Badge>
                </div>
                <CardTitle className="text-xl group-hover:text-purple-600 transition-colors">{room.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400 mb-4">{room.description}</p>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">
                    {room.tier_required.toUpperCase()}+ Required
                  </Badge>
                  <Link href={`/rooms/${room.id}`}>
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    >
                      Enter Room
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Locked Rooms */}
        {CHAT_ROOMS.length > accessibleRooms.length && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-center mb-6 text-gray-800 dark:text-gray-200">Upgrade Your Tier</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {CHAT_ROOMS.filter((room) => !accessibleRooms.includes(room)).map((room) => (
                <Card
                  key={room.id}
                  className="border-0 shadow-lg bg-gray-100/50 dark:bg-gray-800/50 backdrop-blur-sm opacity-75"
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className={`p-3 rounded-full ${room.color} text-white opacity-50`}>{room.icon}</div>
                      <Badge variant="secondary" className="text-xs opacity-50">
                        {room.member_count} members
                      </Badge>
                    </div>
                    <CardTitle className="text-xl text-gray-500">{room.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-500 mb-4">{room.description}</p>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        {room.tier_required.toUpperCase()} Required
                      </Badge>
                      <Button size="sm" disabled className="opacity-50">
                        Locked
                      </Button>
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
