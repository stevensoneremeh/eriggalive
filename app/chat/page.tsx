"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageCircle, Users, Crown, Star, Zap, Heart, Shield, Lock, Gift, TrendingUp, Globe } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

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
    href: "/rooms/freebies",
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
  const { user, profile, loading } = useAuth()
  const [onlineUsers, setOnlineUsers] = useState<Record<string, number>>({})

  useEffect(() => {
    // Simulate online user counts
    const updateOnlineUsers = () => {
      const counts: Record<string, number> = {}
      CHAT_ROOMS.forEach((room) => {
        counts[room.id] = Math.floor(Math.random() * room.memberCount * 0.1) + 10
      })
      setOnlineUsers(counts)
    }

    updateOnlineUsers()
    const interval = setInterval(updateOnlineUsers, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [])

  const canAccessRoom = (requiredTier: string) => {
    if (requiredTier === "all") return true
    if (!profile) return false

    const userTierLevel = TIER_HIERARCHY[profile.tier as keyof typeof TIER_HIERARCHY] || 0
    const requiredTierLevel = TIER_HIERARCHY[requiredTier as keyof typeof TIER_HIERARCHY] || 0

    return userTierLevel >= requiredTierLevel
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading chat rooms...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-2xl font-semibold mb-2">Sign In Required</h3>
              <p className="text-muted-foreground mb-6">Please sign in to access the chat rooms</p>
              <div className="flex gap-4 justify-center">
                <Button asChild>
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/signup">Create Account</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="max-w-7xl mx-auto p-4">
        {/* Header */}
        <div className="text-center py-8">
          <div className="flex items-center justify-center mb-4">
            <MessageCircle className="h-10 w-10 text-primary mr-3" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Chat Rooms
            </h1>
          </div>
          <p className="text-muted-foreground text-lg mt-2">Connect with fellow fans in tier-based discussions</p>
          <div className="flex justify-center gap-8 mt-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              {CHAT_ROOMS.length} Rooms Available
            </span>
            <span className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Real-time Conversations
            </span>
            {profile && (
              <span className="flex items-center gap-2">
                <Crown className="h-4 w-4" />
                {profile.tier.charAt(0).toUpperCase() + profile.tier.slice(1)} Tier
              </span>
            )}
          </div>
        </div>

        {/* User Status */}
        {profile && (
          <Card className="mb-8 bg-gradient-to-r from-primary/5 to-purple-500/5 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={profile.avatar_url || "/placeholder.svg"} />
                    <AvatarFallback>{profile.username.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-lg">{profile.full_name || profile.username}</h3>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                        {profile.tier.charAt(0).toUpperCase() + profile.tier.slice(1)} Member
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Access to {CHAT_ROOMS.filter((room) => canAccessRoom(room.requiredTier)).length} rooms
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Your Tier Level</p>
                  <p className="text-2xl font-bold text-primary">
                    {TIER_HIERARCHY[profile.tier as keyof typeof TIER_HIERARCHY] || 1}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Chat Rooms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {CHAT_ROOMS.map((room) => {
            const Icon = room.icon
            const hasAccess = canAccessRoom(room.requiredTier)
            const isOnline = onlineUsers[room.id] || 0

            return (
              <Card
                key={room.id}
                className={cn(
                  "relative overflow-hidden transition-all duration-300 hover:scale-105 group",
                  room.bgColor,
                  room.borderColor,
                  hasAccess ? "hover:shadow-xl cursor-pointer" : "opacity-60",
                )}
              >
                <div className={cn("absolute inset-0 bg-gradient-to-r opacity-5", room.color)} />

                <CardHeader className="relative pb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className={cn("p-3 rounded-xl", room.bgColor, "group-hover:scale-110 transition-transform")}>
                      <Icon className={cn("h-6 w-6", room.textColor)} />
                    </div>
                    {!hasAccess && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Lock className="h-4 w-4" />
                        <span className="text-xs">Locked</span>
                      </div>
                    )}
                  </div>

                  <CardTitle className="text-xl mb-2">{room.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{room.description}</p>
                </CardHeader>

                <CardContent className="relative">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{room.memberCount.toLocaleString()} members</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-green-600 font-medium">{isOnline} online</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className={cn("text-xs", room.textColor, "bg-transparent")}>
                        {room.requiredTier === "all"
                          ? "Open to All"
                          : `${room.requiredTier.charAt(0).toUpperCase() + room.requiredTier.slice(1)}+ Only`}
                      </Badge>

                      {hasAccess ? (
                        <Button size="sm" className={cn("bg-gradient-to-r text-white shadow-lg", room.color)} asChild>
                          <Link href={room.href}>Join Room</Link>
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" disabled>
                          <Lock className="h-4 w-4 mr-2" />
                          Upgrade Tier
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Upgrade Prompt */}
        {profile && CHAT_ROOMS.some((room) => !canAccessRoom(room.requiredTier)) && (
          <Card className="mt-8 bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-200/20">
            <CardContent className="p-6 text-center">
              <Crown className="h-12 w-12 text-orange-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Unlock More Rooms</h3>
              <p className="text-muted-foreground mb-4">
                Upgrade your tier to access exclusive chat rooms and connect with higher-tier members
              </p>
              <Button className="bg-gradient-to-r from-orange-500 to-red-500 text-white" asChild>
                <Link href="/premium">Upgrade Your Tier</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
