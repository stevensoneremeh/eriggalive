"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, MessageCircle, Crown, Star, Zap } from "lucide-react"

interface ChatSidebarProps {
  currentTier?: string
  onTierChange?: (tier: string) => void
}

export function ChatSidebar({ currentTier = "grassroot", onTierChange }: ChatSidebarProps) {
  const [selectedTier, setSelectedTier] = useState(currentTier)

  const tiers = [
    {
      id: "general",
      name: "General Chat",
      icon: MessageCircle,
      color: "bg-blue-500",
      members: 1250,
      description: "Open discussion for everyone",
    },
    {
      id: "freebies",
      name: "Freebies",
      icon: Star,
      color: "bg-green-500",
      members: 890,
      description: "Free content and giveaways",
    },
    {
      id: "grassroot",
      name: "Grassroot",
      icon: Users,
      color: "bg-gray-500",
      members: 450,
      description: "Entry level community",
    },
    {
      id: "pioneer",
      name: "Pioneer",
      icon: Zap,
      color: "bg-purple-500",
      members: 120,
      description: "Advanced community features",
    },
    {
      id: "elder",
      name: "Elder",
      icon: Crown,
      color: "bg-yellow-500",
      members: 35,
      description: "Exclusive premium content",
    },
  ]

  const handleTierSelect = (tierId: string) => {
    setSelectedTier(tierId)
    onTierChange?.(tierId)
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Chat Rooms
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {tiers.map((tier) => {
          const Icon = tier.icon
          const isSelected = selectedTier === tier.id

          return (
            <Button
              key={tier.id}
              variant={isSelected ? "default" : "outline"}
              className="w-full justify-start h-auto p-3"
              onClick={() => handleTierSelect(tier.id)}
            >
              <div className="flex items-center gap-3 w-full">
                <div className={`p-2 rounded-full ${tier.color}`}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium">{tier.name}</div>
                  <div className="text-xs text-muted-foreground">{tier.description}</div>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {tier.members}
                </Badge>
              </div>
            </Button>
          )
        })}
      </CardContent>
    </Card>
  )
}

export default ChatSidebar
