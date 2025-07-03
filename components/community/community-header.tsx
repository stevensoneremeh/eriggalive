"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, TrendingUp, Clock, ThumbsUp, Flame } from "lucide-react"
import { CreatePostDialog } from "./create-post-dialog"

export function CommunityHeader() {
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false)
  const [sortBy, setSortBy] = useState("latest")
  const [searchQuery, setSearchQuery] = useState("")

  const sortOptions = [
    { value: "latest", label: "Latest", icon: Clock },
    { value: "trending", label: "Trending", icon: TrendingUp },
    { value: "top", label: "Most Voted", icon: ThumbsUp },
    { value: "hot", label: "Hot", icon: Flame },
  ]

  return (
    <div className="mb-8">
      <div className="flex flex-col space-y-6">
        {/* Hero Section */}
        <div className="text-center py-12 px-6 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-2xl border border-purple-500/20">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
            Welcome to Erigga Community
          </h1>
          <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
            Connect with fellow fans, discuss the latest tracks, share your thoughts, and stay updated with everything
            Erigga.
          </p>
          <Button
            onClick={() => setIsCreatePostOpen(true)}
            size="lg"
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <Plus className="mr-2 h-5 w-5" />
            Create Post
          </Button>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex items-center space-x-4 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background/50 border-muted"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40 bg-background/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => {
                  const Icon = option.icon
                  return (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center space-x-2">
                        <Icon className="h-4 w-4" />
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="cursor-pointer hover:bg-primary/20">
            🎵 Music
          </Badge>
          <Badge variant="secondary" className="cursor-pointer hover:bg-primary/20">
            📰 News
          </Badge>
          <Badge variant="secondary" className="cursor-pointer hover:bg-primary/20">
            💬 General
          </Badge>
          <Badge variant="secondary" className="cursor-pointer hover:bg-primary/20">
            🎤 Events
          </Badge>
          <Badge variant="secondary" className="cursor-pointer hover:bg-primary/20">
            🤝 Collaborations
          </Badge>
          <Badge variant="secondary" className="cursor-pointer hover:bg-primary/20">
            🏙️ Street Culture
          </Badge>
        </div>
      </div>

      <CreatePostDialog open={isCreatePostOpen} onOpenChange={setIsCreatePostOpen} />
    </div>
  )
}
