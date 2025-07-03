"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Hash, TrendingUp } from "lucide-react"
import Link from "next/link"

// Simple trending hashtags component
export function HashtagTrending() {
  const [trendingHashtags, setTrendingHashtags] = useState([
    { name: "EriggaLive", count: 156, trending: true },
    { name: "NewMusic", count: 89, trending: true },
    { name: "Bars", count: 67, trending: false },
    { name: "Community", count: 45, trending: false },
    { name: "Support", count: 34, trending: false },
  ])

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Trending Topics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {trendingHashtags.map((hashtag, index) => (
          <Link key={hashtag.name} href={`/community?hashtag=${hashtag.name}`}>
            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer">
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{hashtag.name}</span>
                {hashtag.trending && (
                  <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                    🔥 Hot
                  </Badge>
                )}
              </div>
              <span className="text-sm text-muted-foreground">{hashtag.count} posts</span>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  )
}
