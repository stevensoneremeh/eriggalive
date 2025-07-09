"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Users, MessageCircle, Crown, Star, Zap, Heart, Settings, Search, Hash } from 'lucide-react'
import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"

interface ChatSidebarProps {
  className?: string
}

const CHAT_ROOMS = [
  {
    id: "general",
    name: "General Chat",
    description: "Open discussion for all fans",
    icon: MessageCircle,
    memberCount: 1247,
    isActive: true,
    tier: "all"
  },
  {
    id: "freebies",
    name: "Freebies",
    description: "Free content and giveaways",
    icon: Star,
    memberCount: 892,
    isActive: true,
    tier: "all"
  },
  {
    id: "grassroot",
    name: "Grassroot",
    description: "Grassroot tier discussions",
    icon: Users,
    memberCount: 456,
    isActive: true,
    tier: "grassroot"
  },
  {
    id: "pioneer",
    name: "Pioneer",
    description: "Pioneer tier exclusive",
    icon: Zap,
    memberCount: 234,
    isActive: true,
    tier: "pioneer"
  },
  {
    id: "elder",
    name: "Elder",
    description: "Elder tier VIP lounge",
    icon: Crown,
    memberCount: 89,
    isActive: true,
    tier: "elder"
  },
  {
    id: "blood",
    name: "Blood",
    description: "Blood tier inner circle",
    icon: Heart,
    memberCount: 23,
    isActive: true,
    tier: "blood"
  }
]

const ONLINE_USERS = [
  {
    id: 1,
    username: "eriggaofficial",
    fullName: "Erigga",
    avatar: "/placeholder-user.jpg",
    tier: "blood",
    isOnline: true
  },
  {
    id: 2,
    username: "warriking",
    fullName: "Warri King",
    avatar: "/placeholder-user.jpg",
    tier: "pioneer",
    isOnline: true
  },
  {
    id: 3,
    username: "southsideboy",
    fullName: "Southside Boy",
    avatar: "/placeholder-user.jpg",
    tier: "elder",
    isOnline: true
  }
]

export function ChatSidebar({ className }: ChatSidebarProps) {
  const { profile } = useAuth()
  const [selectedRoom, setSelectedRoom] = useState("general")

  const getTierColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case "blood":
        return "bg-red-500"
      case "elder":
        return "bg-purple-500"
      case "pioneer":
        return "bg-blue-500"
      case "grassroot":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  const canAccessRoom = (roomTier: string) => {
    if (roomTier === "all") return true
    if (!profile) return false
    
    const tierHierarchy = ["grassroot", "pioneer", "elder", "blood"]
    const userTierIndex = tierHierarchy.indexOf(profile.tier)
    const roomTierIndex = tierHierarchy.indexOf(roomTier)
    
    return userTierIndex >= roomTierIndex
  }

  return (
    <div className={cn("w-80 bg-card border-r", className)}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Chat Rooms</h2>
          <Button variant="ghost" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <input
            type="text"
            placeholder="Search rooms..."
            className="w-full pl-10 pr-4 py-2 bg-background border rounded-md text-sm"
          />
        </div>

        {/* Chat Rooms */}
        <ScrollArea className="h-[300px]">
          <div className="space-y-2">
            {CHAT_ROOMS.map((room) => {
              const Icon = room.icon
              const isAccessible = canAccessRoom(room.tier)
              const isSelected = selectedRoom === room.id

              return (
                <Button
                  key={room.id}
                  variant={isSelected ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start p-3 h-auto",
                    !isAccessible && "opacity-50 cursor-not-allowed"
                  )}
                  onClick={() => isAccessible && setSelectedRoom(room.id)}
                  disabled={!isAccessible}
                >
                  <div className="flex items-center space-x-3 w-full">
                    <div className={cn(
                      "p-2 rounded-full",
                      room.tier === "all" ? "bg-primary/10" : getTierColor(room.tier)
                    )}>
                      <Icon className={cn(
                        "h-4 w-4",
                        room.tier === "all" ? "text-primary" : "text-white"
                      )} />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{room.name}</span>
                        {!isAccessible && (
                          <Badge variant="outline" className="text-xs">
                            Locked
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {room.description}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-muted-foreground">
                          {room.memberCount} members
                        </span>
                        {room.isActive && (
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                        )}
                      </div>
                    </div>
                  </div>
                </Button>
              )
            })}
          </div>
        </ScrollArea>

        <Separator className="my-4" />

        {/* Online Users */}
        <div>
          <h3 className="text-sm font-medium mb-3 flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
            Online ({ONLINE_USERS.length})
          </h3>
          <ScrollArea className="h-[200px]">
            <div className="space-y-2">
              {ONLINE_USERS.map((user) => (
                <div key={user.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-accent">
                  <div className="relative">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar || "/placeholder.svg"} />
                      <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    {user.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium truncate">{user.username}</span>
                      <Badge 
                        className={cn(
                          "text-xs px-1.5 py-0.5",
                          getTierColor(user.tier),
                          "text-white"
                        )}
                      >
                        {user.tier}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{user.fullName}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}

export default ChatSidebar
