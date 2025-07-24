"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/contexts/auth-context"
import { Archive, Search, Play, Download, Lock, Crown, Star } from "lucide-react"
import { BlurredContent } from "@/components/blurred-content"

interface MediaItem {
  id: string
  title: string
  type: "video" | "audio" | "image"
  thumbnail?: string
  duration?: string
  size?: string
  tier_required: string
  created_at: string
  description?: string
  tags?: string[]
}

export default function VaultPage() {
  const { user, userProfile } = useAuth()
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTab, setSelectedTab] = useState("all")

  useEffect(() => {
    loadMediaItems()
  }, [])

  const loadMediaItems = async () => {
    try {
      setLoading(true)
      // Mock data for now - replace with actual API call
      const mockData: MediaItem[] = [
        {
          id: "1",
          title: "Exclusive Studio Session",
          type: "video",
          thumbnail: "/placeholder.svg?height=200&width=300",
          duration: "15:30",
          tier_required: "premium",
          created_at: "2024-01-15",
          description: "Behind the scenes studio session",
          tags: ["studio", "exclusive", "music"],
        },
        {
          id: "2",
          title: "Unreleased Track Preview",
          type: "audio",
          duration: "3:45",
          tier_required: "vip",
          created_at: "2024-01-10",
          description: "Preview of upcoming track",
          tags: ["unreleased", "preview", "music"],
        },
        {
          id: "3",
          title: "Concert Photos",
          type: "image",
          tier_required: "basic",
          created_at: "2024-01-05",
          description: "High-quality concert photography",
          tags: ["concert", "photos", "live"],
        },
      ]
      setMediaItems(mockData)
    } catch (error) {
      console.error("Error loading media items:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredItems = mediaItems.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTab = selectedTab === "all" || item.type === selectedTab
    return matchesSearch && matchesTab
  })

  const canAccess = (tierRequired: string) => {
    if (!userProfile?.tier) return false
    const tierHierarchy = { basic: 1, premium: 2, vip: 3 }
    const userTierLevel = tierHierarchy[userProfile.tier as keyof typeof tierHierarchy] || 0
    const requiredLevel = tierHierarchy[tierRequired as keyof typeof tierHierarchy] || 0
    return userTierLevel >= requiredLevel
  }

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case "vip":
        return <Crown className="h-4 w-4" />
      case "premium":
        return <Star className="h-4 w-4" />
      default:
        return null
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "vip":
        return "bg-yellow-500"
      case "premium":
        return "bg-purple-500"
      case "basic":
        return "bg-blue-500"
      default:
        return "bg-gray-500"
    }
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <Archive className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Media Vault</h1>
          <p className="text-muted-foreground mb-4">Please log in to access exclusive content</p>
          <Button asChild>
            <a href="/login">Login</a>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Archive className="h-8 w-8" />
        <div>
          <h1 className="text-3xl font-bold">Media Vault</h1>
          <p className="text-muted-foreground">Exclusive content for Erigga fans</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search media..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="video">Videos</TabsTrigger>
            <TabsTrigger value="audio">Audio</TabsTrigger>
            <TabsTrigger value="image">Images</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Media Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-48 bg-muted rounded-t-lg" />
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded mb-2" />
                <div className="h-3 bg-muted rounded w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => {
            const hasAccess = canAccess(item.tier_required)

            return (
              <Card key={item.id} className="overflow-hidden">
                <div className="relative">
                  {item.thumbnail && (
                    <img
                      src={item.thumbnail || "/placeholder.svg"}
                      alt={item.title}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  {!hasAccess && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Lock className="h-8 w-8 text-white" />
                    </div>
                  )}
                  <Badge className={`absolute top-2 right-2 ${getTierColor(item.tier_required)} text-white`}>
                    {getTierIcon(item.tier_required)}
                    <span className="ml-1 capitalize">{item.tier_required}</span>
                  </Badge>
                </div>

                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold line-clamp-1">{item.title}</h3>
                  </div>

                  {item.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{item.description}</p>
                  )}

                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                    <span className="capitalize">{item.type}</span>
                    {item.duration && <span>{item.duration}</span>}
                  </div>

                  {item.tags && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {item.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    {hasAccess ? (
                      <>
                        <Button size="sm" className="flex-1">
                          <Play className="h-4 w-4 mr-1" />
                          {item.type === "image" ? "View" : "Play"}
                        </Button>
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <BlurredContent requiredTier={item.tier_required}>
                        <Button size="sm" className="flex-1" disabled>
                          <Lock className="h-4 w-4 mr-1" />
                          Upgrade Required
                        </Button>
                      </BlurredContent>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {filteredItems.length === 0 && !loading && (
        <div className="text-center py-12">
          <Archive className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No media found</h3>
          <p className="text-muted-foreground">
            {searchTerm ? "Try adjusting your search terms" : "No media available at the moment"}
          </p>
        </div>
      )}
    </div>
  )
}
