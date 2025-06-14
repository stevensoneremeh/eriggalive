"use client"

import { Card } from "@/components/ui/card"
import { Users, Music, Coins, TrendingUp } from "lucide-react"

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
      label: "Total Posts",
      value: stats.totalPosts.toLocaleString(),
      icon: <Users className="h-4 w-4" />,
      color: "text-blue-600",
    },
    {
      label: "Bars Submitted",
      value: stats.totalBars.toLocaleString(),
      icon: <Music className="h-4 w-4" />,
      color: "text-orange-600",
    },
    {
      label: "Active Users",
      value: stats.activeUsers.toLocaleString(),
      icon: <TrendingUp className="h-4 w-4" />,
      color: "text-green-600",
    },
    {
      label: "Coins Spent",
      value: stats.totalCoinsSpent.toLocaleString(),
      icon: <Coins className="h-4 w-4" />,
      color: "text-yellow-600",
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-4xl">
      {statItems.map((item, index) => (
        <Card key={index} className="p-4 text-center bg-card/50 backdrop-blur-sm border-white/20">
          <div className={`flex items-center justify-center mb-2 ${item.color}`}>{item.icon}</div>
          <div className="text-2xl font-bold mb-1">{item.value}</div>
          <div className="text-sm text-muted-foreground">{item.label}</div>
        </Card>
      ))}
    </div>
  )
}
