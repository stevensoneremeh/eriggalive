"use client"

import { Card } from "@/components/ui/card"
import { Users, Music, MessageSquare, Coins } from "lucide-react"

interface CommunityStatsProps {
  stats: {
    totalPosts: number
    totalBars: number
    activeUsers: number
    totalCoinsSpent: number
  }
}

export function CommunityStats({ stats }: CommunityStatsProps) {
  const statItems = [
    {
      icon: <MessageSquare className="h-4 w-4" />,
      label: "Posts",
      value: stats.totalPosts.toLocaleString(),
      color: "text-blue-500",
    },
    {
      icon: <Music className="h-4 w-4" />,
      label: "Bars",
      value: stats.totalBars.toLocaleString(),
      color: "text-orange-500",
    },
    {
      icon: <Users className="h-4 w-4" />,
      label: "Active Users",
      value: stats.activeUsers.toLocaleString(),
      color: "text-lime-500",
    },
    {
      icon: <Coins className="h-4 w-4" />,
      label: "Coins Spent",
      value: stats.totalCoinsSpent.toLocaleString(),
      color: "text-teal-500",
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {statItems.map((item, index) => (
        <Card key={index} className="p-4 text-center bg-card/50 backdrop-blur-sm border-white/20">
          <div
            className={`inline-flex items-center justify-center w-8 h-8 rounded-full bg-current/10 ${item.color} mb-2`}
          >
            {item.icon}
          </div>
          <div className="text-2xl font-bold">{item.value}</div>
          <div className="text-sm text-muted-foreground">{item.label}</div>
        </Card>
      ))}
    </div>
  )
}
