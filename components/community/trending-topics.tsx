"use client"
import { TrendingUp } from "lucide-react"

export function TrendingTopics() {
  const topics = [
    { tag: "EriggaVibes", posts: 234 },
    { tag: "PaperBoi", posts: 189 },
    { tag: "WarriToTheWorld", posts: 156 },
    { tag: "IndustryNight", posts: 143 },
    { tag: "DeltaState", posts: 98 },
  ]

  return (
    <div className="p-4 space-y-3">
      {topics.map((topic, index) => (
        <div
          key={topic.tag}
          className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-teal-500/10 text-teal-500 text-xs font-bold">
              {index + 1}
            </div>
            <div>
              <p className="font-medium">#{topic.tag}</p>
              <p className="text-xs text-muted-foreground">{topic.posts} posts</p>
            </div>
          </div>
          <TrendingUp className="h-4 w-4 text-teal-500" />
        </div>
      ))}
    </div>
  )
}
