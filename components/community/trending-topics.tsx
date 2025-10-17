"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Hash } from "lucide-react"

interface TrendingTopic {
  id: number
  tag: string
  posts_count: number
  growth_rate: number
}

export function TrendingTopics() {
  const [topics, setTopics] = useState<TrendingTopic[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Mock data for preview
    const mockTopics: TrendingTopic[] = [
      { id: 1, tag: "EriggaLive", posts_count: 234, growth_rate: 45 },
      { id: 2, tag: "PaperBoy", posts_count: 189, growth_rate: 32 },
      { id: 3, tag: "WarriVibes", posts_count: 156, growth_rate: 28 },
      { id: 4, tag: "StreetMusic", posts_count: 134, growth_rate: 25 },
      { id: 5, tag: "NigerianRap", posts_count: 98, growth_rate: 18 },
    ]

    setTimeout(() => {
      setTopics(mockTopics)
      setLoading(false)
    }, 500)
  }, [])

  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded w-20"></div>
            </div>
            <div className="h-5 bg-muted rounded w-12"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="p-4 space-y-3">
      {topics.map((topic, index) => (
        <div
          key={topic.id}
          className="flex items-center justify-between hover:bg-muted/50 p-2 rounded-md transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="flex items-center gap-1 text-teal-600">
              <Hash className="h-3 w-3" />
              <span className="text-xs font-medium">#{index + 1}</span>
            </div>
            <span className="font-medium truncate">#{topic.tag}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {topic.posts_count}
            </Badge>
            <div className="flex items-center gap-1 text-green-600">
              <TrendingUp className="h-3 w-3" />
              <span className="text-xs">+{topic.growth_rate}%</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
