"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { ExternalLink } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { createClient } from "@/lib/supabase/client"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { MediaDisplay } from "@/components/media-display"
import { TierDashboardWrapper } from "@/components/tier-dashboard-wrapper"

// Mock data - in real app, this would come from Supabase
const albums = [
  {
    id: 1,
    title: "The Erigma",
    type: "album",
    cover_url: "https://images.genius.com/b8a7a7c8f8e8a7a7c8f8e8a7a7c8f8e8.1000x1000x1.jpg",
    release_date: "2019-02-14",
    total_tracks: 17,
    duration: "1:02:45",
    is_premium: false,
    play_count: 2500000,
    description: "The breakthrough album that established Erigga as the Paper Boi",
  },
  {
    id: 2,
    title: "The Erigma II",
    type: "album",
    cover_url: "https://images.genius.com/8c7b6a5d4e3f2a1b9c8d7e6f5a4b3c2d.1000x1000x1.jpg",
    release_date: "2020-10-30",
    total_tracks: 15,
    duration: "58:32",
    is_premium: false,
    play_count: 3200000,
    description: "The highly anticipated sequel featuring collaborations with top artists",
  },
  {
    id: 3,
    title: "Street Motivation",
    type: "mixtape",
    cover_url: "https://images.genius.com/f5e4d3c2b1a9f8e7d6c5b4a3f2e1d0c9.1000x1000x1.jpg",
    release_date: "2021-06-15",
    total_tracks: 12,
    duration: "45:18",
    is_premium: true,
    play_count: 1800000,
    description: "Raw street stories and motivational tracks",
  },
]

const singles = [
  {
    id: 1,
    title: "Send Her Money",
    artist: "Erigga",
    featuring: "Yemi Alade",
    duration: "3:45",
    cover_url: "https://images.genius.com/a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6.1000x1000x1.jpg",
    release_date: "2023-08-15",
    play_count: 5200000,
    is_premium: false,
  },
  {
    id: 2,
    title: "The Fear of God",
    artist: "Erigga",
    duration: "4:12",
    cover_url: "https://images.genius.com/b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7.1000x1000x1.jpg",
    release_date: "2023-03-20",
    play_count: 3800000,
    is_premium: false,
  },
  {
    id: 3,
    title: "Area to the World",
    artist: "Erigga",
    featuring: "Zlatan",
    duration: "3:28",
    cover_url: "https://images.genius.com/c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8.1000x1000x1.jpg",
    release_date: "2022-12-10",
    play_count: 4100000,
    is_premium: true,
  },
]

const musicVideos = [
  {
    id: 1,
    title: "Send Her Money (Official Video)",
    thumbnail_url: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    duration: "4:15",
    views: 8500000,
    release_date: "2023-08-20",
    is_premium: false,
  },
  {
    id: 2,
    title: "The Fear of God (Official Video)",
    thumbnail_url: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    duration: "4:42",
    views: 6200000,
    release_date: "2023-03-25",
    is_premium: false,
  },
  {
    id: 3,
    title: "Paper Boi (Behind The Scenes)",
    thumbnail_url: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    duration: "8:30",
    views: 1200000,
    release_date: "2023-01-15",
    is_premium: true,
  },
]

const galleryItems = [
  {
    id: 1,
    title: "Studio Session",
    image_url: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800",
    category: "Behind The Scenes",
    is_premium: false,
  },
  {
    id: 2,
    title: "Concert Performance",
    image_url: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800",
    category: "Live Shows",
    is_premium: false,
  },
  {
    id: 3,
    title: "Album Cover Shoot",
    image_url: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800",
    category: "Photoshoot",
    is_premium: true,
  },
]

const streamingPlatforms = [
  { name: "Spotify", icon: "🎵", url: "https://open.spotify.com/artist/erigga", color: "text-green-500" },
  { name: "Apple Music", icon: "🍎", url: "https://music.apple.com/artist/erigga", color: "text-gray-400" },
  { name: "Audiomack", icon: "🎧", url: "https://audiomack.com/erigga", color: "text-orange-500" },
  { name: "YouTube Music", icon: "🎥", url: "https://music.youtube.com/erigga", color: "text-red-500" },
  { name: "Boomplay", icon: "🎵", url: "https://boomplay.com/erigga", color: "text-yellow-500" },
  { name: "Deezer", icon: "🎶", url: "https://deezer.com/artist/erigga", color: "text-purple-500" },
]

export default function VaultPage() {
  const [media, setMedia] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("albums")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedAlbum, setSelectedAlbum] = useState<any>(null)
  const [selectedTrack, setSelectedTrack] = useState<any>(null)
  const [selectedVideo, setSelectedVideo] = useState<any>(null)
  const [showStreamingLinks, setShowStreamingLinks] = useState<any>(null)
  const { user, profile, isAuthenticated } = useAuth()
  const supabase = createClient()

  useEffect(() => {
    async function fetchMedia() {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from("media_items")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(12)

        if (error) throw error
        setMedia(data || [])
      } catch (err) {
        console.error("Error fetching media:", err)
        setError("Failed to load media items")
      } finally {
        setLoading(false)
      }
    }

    fetchMedia()
  }, [])

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const canAccess = (item: any) => {
    if (!item.is_premium) return true
    if (!profile) return false

    const tierHierarchy = { street_rep: 0, warri_elite: 1, erigma_circle: 2 }
    const userLevel = tierHierarchy[profile.tier as keyof typeof tierHierarchy]
    const requiredLevel = tierHierarchy[item.required_tier as keyof typeof tierHierarchy] || 0

    return userLevel >= requiredLevel
  }

  const StreamingLinksModal = ({ item, onClose }: any) => (
    <Dialog open={!!item} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Listen on Other Platforms</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {streamingPlatforms.map((platform) => (
            <Button key={platform.name} variant="outline" className="w-full justify-start" asChild>
              <a href={platform.url} target="_blank" rel="noopener noreferrer">
                <span className="text-lg mr-3">{platform.icon}</span>
                <span className={platform.color}>{platform.name}</span>
                <ExternalLink className="h-4 w-4 ml-auto" />
              </a>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )

  if (loading) {
    return (
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">Media Vault</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-[300px] rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">Media Vault</h1>
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300">
          <p className="font-medium">Error loading media</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    )
  }

  const userTier = profile?.tier || "grassroot"

  return (
    <DashboardLayout>
      <TierDashboardWrapper>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Media Vault</h1>
            <p className="text-muted-foreground">Access exclusive Erigga content based on your tier</p>
          </div>
          <MediaDisplay />
        </div>
      </TierDashboardWrapper>
    </DashboardLayout>
  )
}
