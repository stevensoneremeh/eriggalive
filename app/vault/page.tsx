"use client"

import { AuthGuard } from "@/components/auth-guard"
import { useAuth } from "@/contexts/auth-context"
import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Music, Video, ImageIcon, Play, Download, Lock, Search, Star, Clock, Eye } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import { useToast } from "@/hooks/use-toast"

interface VaultItem {
  id: string
  title: string
  description: string
  type: "audio" | "video" | "image" | "document"
  url: string
  thumbnail_url?: string
  duration?: number
  file_size?: number
  tier_required: string
  coin_cost: number
  is_premium: boolean
  views_count: number
  created_at: string
  artist?: string
  album?: string
  genre?: string
}

export default function VaultPage() {
  const { user, profile } = useAuth()
  const { toast } = useToast()
  const [vaultItems, setVaultItems] = useState<VaultItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null)
  const [tablesExist, setTablesExist] = useState(false)

  const checkTablesExist = async () => {
    try {
      const { error } = await supabase.from("vault").select("id").limit(1)

      if (!error) {
        setTablesExist(true)
      }
    } catch (error) {
      console.log("Vault tables don't exist yet")
      setTablesExist(false)
    }
  }

  const fetchVaultItems = async () => {
    if (!tablesExist) {
      // Create mock data for demonstration
      const mockItems: VaultItem[] = [
        {
          id: "1",
          title: "The Erigma",
          description: "Classic album from Erigga",
          type: "audio",
          url: "/placeholder-audio.mp3",
          thumbnail_url: "/erigga/albums/TheErigma2012.jpg",
          duration: 3600,
          tier_required: "grassroot",
          coin_cost: 0,
          is_premium: false,
          views_count: 1250,
          created_at: new Date().toISOString(),
          artist: "Erigga",
          album: "The Erigma",
          genre: "Hip Hop",
        },
        {
          id: "2",
          title: "Behind the Scenes",
          description: "Exclusive studio footage",
          type: "video",
          url: "/placeholder-video.mp4",
          thumbnail_url: "/erigga/studio/erigga-recording-studio.jpg",
          duration: 1800,
          tier_required: "pioneer",
          coin_cost: 50,
          is_premium: true,
          views_count: 890,
          created_at: new Date().toISOString(),
          artist: "Erigga",
        },
        {
          id: "3",
          title: "Live Performance Photos",
          description: "High-quality concert photos",
          type: "image",
          url: "/erigga/performances/erigga-live-performance.jpg",
          tier_required: "grassroot",
          coin_cost: 10,
          is_premium: false,
          views_count: 2100,
          created_at: new Date().toISOString(),
        },
      ]
      setVaultItems(mockItems)
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.from("vault").select("*").order("created_at", { ascending: false })

      if (error) throw error

      setVaultItems(data || [])
    } catch (error) {
      console.error("Error fetching vault items:", error)
      toast({
        title: "Error",
        description: "Failed to load vault content",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const canAccess = (item: VaultItem) => {
    if (!profile) return false

    const tierLevels = {
      grassroot: 1,
      pioneer: 2,
      elder: 3,
      blood_brotherhood: 4,
    }

    const userTierLevel = tierLevels[profile.tier as keyof typeof tierLevels] || 1
    const requiredTierLevel = tierLevels[item.tier_required as keyof typeof tierLevels] || 1

    return userTierLevel >= requiredTierLevel && (profile.coins || 0) >= item.coin_cost
  }

  const purchaseItem = async (item: VaultItem) => {
    if (!profile || !canAccess(item)) return

    try {
      // In a real implementation, this would handle the purchase logic
      toast({
        title: "Success",
        description: `Access granted to ${item.title}`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to purchase item",
        variant: "destructive",
      })
    }
  }

  const filteredItems = vaultItems.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = selectedType === "all" || item.type === selectedType
    return matchesSearch && matchesType
  })

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "audio":
        return <Music className="w-4 h-4" />
      case "video":
        return <Video className="w-4 h-4" />
      case "image":
        return <ImageIcon className="w-4 h-4" />
      default:
        return <Music className="w-4 h-4" />
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "grassroot":
        return "bg-green-100 text-green-800"
      case "pioneer":
        return "bg-purple-100 text-purple-800"
      case "elder":
        return "bg-blue-100 text-blue-800"
      case "blood_brotherhood":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  useEffect(() => {
    const initialize = async () => {
      await checkTablesExist()
      await fetchVaultItems()
    }

    if (profile) {
      initialize()
    }
  }, [profile])

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Media Vault</h1>
            <p className="text-gray-600 dark:text-gray-300">
              Access exclusive content, music, videos, and behind-the-scenes material
            </p>
          </div>

          {/* Search and Filter */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search vault content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={selectedType === "all" ? "default" : "outline"}
                onClick={() => setSelectedType("all")}
                size="sm"
              >
                All
              </Button>
              <Button
                variant={selectedType === "audio" ? "default" : "outline"}
                onClick={() => setSelectedType("audio")}
                size="sm"
              >
                <Music className="w-4 h-4 mr-1" />
                Music
              </Button>
              <Button
                variant={selectedType === "video" ? "default" : "outline"}
                onClick={() => setSelectedType("video")}
                size="sm"
              >
                <Video className="w-4 h-4 mr-1" />
                Videos
              </Button>
              <Button
                variant={selectedType === "image" ? "default" : "outline"}
                onClick={() => setSelectedType("image")}
                size="sm"
              >
                <ImageIcon className="w-4 h-4 mr-1" />
                Images
              </Button>
            </div>
          </div>

          {/* Content Grid */}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              <p className="text-gray-600 dark:text-gray-300 mt-2">Loading vault content...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Music className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No content found</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {searchQuery ? "Try adjusting your search terms" : "New content will be added soon!"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredItems.map((item) => (
                <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative">
                    <div className="aspect-video bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      {item.thumbnail_url ? (
                        <img
                          src={item.thumbnail_url || "/placeholder.svg"}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        getTypeIcon(item.type)
                      )}
                    </div>

                    {/* Overlay badges */}
                    <div className="absolute top-2 left-2 flex gap-1">
                      <Badge className={getTierColor(item.tier_required)}>
                        {item.tier_required.replace("_", " ").toUpperCase()}
                      </Badge>
                      {item.is_premium && (
                        <Badge variant="secondary">
                          <Star className="w-3 h-3 mr-1" />
                          Premium
                        </Badge>
                      )}
                    </div>

                    {/* Duration for audio/video */}
                    {item.duration && (
                      <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {formatDuration(item.duration)}
                      </div>
                    )}
                  </div>

                  <CardContent className="p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-1">{item.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">{item.description}</p>

                    {item.artist && <p className="text-xs text-gray-500 mb-2">by {item.artist}</p>}

                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                      <span className="flex items-center">
                        <Eye className="w-3 h-3 mr-1" />
                        {item.views_count.toLocaleString()} views
                      </span>
                      {item.coin_cost > 0 && <span className="font-medium">{item.coin_cost} coins</span>}
                    </div>

                    <div className="flex gap-2">
                      {canAccess(item) ? (
                        <>
                          <Button size="sm" className="flex-1">
                            <Play className="w-4 h-4 mr-1" />
                            {item.type === "image" ? "View" : "Play"}
                          </Button>
                          <Button size="sm" variant="outline">
                            <Download className="w-4 h-4" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => purchaseItem(item)}
                          disabled={!profile || (profile.coins || 0) < item.coin_cost}
                        >
                          <Lock className="w-4 h-4 mr-1" />
                          {item.coin_cost > 0 ? `Unlock (${item.coin_cost} coins)` : "Upgrade Tier"}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  )
}
