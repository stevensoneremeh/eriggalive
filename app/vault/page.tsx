"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Play,
  Heart,
  Share2,
  ExternalLink,
  Clock,
  Eye,
  Music,
  Video,
  Camera,
  Search,
  Filter,
  Crown,
  Headphones,
  PlayCircle,
  Youtube,
  Disc3,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import Link from "next/link"

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
  const [activeTab, setActiveTab] = useState("albums")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedAlbum, setSelectedAlbum] = useState<any>(null)
  const [selectedTrack, setSelectedTrack] = useState<any>(null)
  const [selectedVideo, setSelectedVideo] = useState<any>(null)
  const [showStreamingLinks, setShowStreamingLinks] = useState<any>(null)
  const { user, profile } = useAuth()

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

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-street text-4xl md:text-6xl text-gradient mb-4">MEDIA VAULT</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            The complete collection of Erigga's music, videos, and exclusive content. Stream, download, and experience
            the Paper Boi's journey.
          </p>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search albums, tracks, videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background/50 border-orange-500/20"
            />
          </div>
          <Button variant="outline" className="border-orange-500/40 text-orange-500">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          {profile?.tier !== "street_rep" && (
            <Link href="/admin/upload">
              <Button className="bg-orange-500 hover:bg-orange-600 text-black">Upload Content</Button>
            </Link>
          )}
        </div>

        {/* Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-card/50 border border-orange-500/20 mb-8">
            <TabsTrigger value="albums" className="data-[state=active]:bg-orange-500 data-[state=active]:text-black">
              <Music className="h-4 w-4 mr-2" />
              Albums
            </TabsTrigger>
            <TabsTrigger value="singles" className="data-[state=active]:bg-orange-500 data-[state=active]:text-black">
              <Disc3 className="h-4 w-4 mr-2" />
              Singles
            </TabsTrigger>
            <TabsTrigger value="videos" className="data-[state=active]:bg-orange-500 data-[state=active]:text-black">
              <Video className="h-4 w-4 mr-2" />
              Videos
            </TabsTrigger>
            <TabsTrigger value="gallery" className="data-[state=active]:bg-orange-500 data-[state=active]:text-black">
              <Camera className="h-4 w-4 mr-2" />
              Gallery
            </TabsTrigger>
          </TabsList>

          {/* Albums Tab */}
          <TabsContent value="albums" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {albums.map((album) => (
                <Card
                  key={album.id}
                  className={`bg-card/50 border-orange-500/20 hover:border-orange-500/40 transition-all group cursor-pointer ${!canAccess(album) ? "opacity-60" : ""}`}
                  onClick={() => canAccess(album) && setSelectedAlbum(album)}
                >
                  <CardHeader className="p-0">
                    <div className="relative">
                      <img
                        src={album.cover_url || "/placeholder.svg?height=300&width=300"}
                        alt={album.title}
                        className="w-full aspect-square object-cover rounded-t-lg"
                      />

                      {/* Premium Badge */}
                      {album.is_premium && (
                        <Badge className="absolute top-2 right-2 bg-gold-400 text-black">
                          <Crown className="h-3 w-3 mr-1" />
                          PREMIUM
                        </Badge>
                      )}

                      {/* Album Type Badge */}
                      <Badge className="absolute top-2 left-2 bg-orange-500 text-black">
                        {album.type.toUpperCase()}
                      </Badge>

                      {/* Play Overlay */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-t-lg">
                        <div className="bg-orange-500 rounded-full p-4">
                          <Play className="h-8 w-8 text-black fill-black" />
                        </div>
                      </div>

                      {!canAccess(album) && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-t-lg">
                          <div className="text-center text-white">
                            <Crown className="h-8 w-8 mx-auto mb-2" />
                            <p className="text-sm font-medium">Premium Only</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="p-6">
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-bold text-xl text-gradient">{album.title}</h3>
                        <p className="text-sm text-muted-foreground">{album.description}</p>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {album.total_tracks} tracks • {album.duration}
                        </span>
                        <span className="text-orange-500 font-semibold">
                          {new Date(album.release_date).getFullYear()}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Headphones className="h-3 w-3" />
                          {formatNumber(album.play_count)} plays
                        </span>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              setShowStreamingLinks(album)
                            }}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-500 border-red-500">
                            <Heart className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Singles Tab */}
          <TabsContent value="singles" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {singles.map((single) => (
                <Card
                  key={single.id}
                  className={`bg-card/50 border-orange-500/20 hover:border-orange-500/40 transition-all group ${!canAccess(single) ? "opacity-60" : ""}`}
                >
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      <div className="relative flex-shrink-0">
                        <img
                          src={single.cover_url || "/placeholder.svg?height=100&width=100"}
                          alt={single.title}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-colors flex items-center justify-center rounded-lg">
                          <PlayCircle className="h-8 w-8 text-white" />
                        </div>
                      </div>

                      <div className="flex-1 space-y-2">
                        <div>
                          <h3 className="font-bold text-lg">{single.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {single.artist}
                            {single.featuring && ` feat. ${single.featuring}`}
                          </p>
                        </div>

                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {single.duration}
                          </span>
                          <span className="flex items-center gap-1">
                            <Headphones className="h-3 w-3" />
                            {formatNumber(single.play_count)}
                          </span>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="bg-orange-500 hover:bg-orange-600 text-black flex-1"
                            disabled={!canAccess(single)}
                          >
                            <Play className="h-3 w-3 mr-1" />
                            Play
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setShowStreamingLinks(single)}>
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {single.is_premium && (
                        <Badge className="bg-gold-400 text-black h-fit">
                          <Crown className="h-3 w-3 mr-1" />
                          PREMIUM
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Videos Tab */}
          <TabsContent value="videos" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {musicVideos.map((video) => (
                <Card
                  key={video.id}
                  className={`bg-card/50 border-orange-500/20 hover:border-orange-500/40 transition-all group cursor-pointer ${!canAccess(video) ? "opacity-60" : ""}`}
                  onClick={() => canAccess(video) && setSelectedVideo(video)}
                >
                  <CardHeader className="p-0">
                    <div className="relative">
                      <img
                        src={video.thumbnail_url || "/placeholder.svg?height=200&width=300"}
                        alt={video.title}
                        className="w-full h-48 object-cover rounded-t-lg"
                      />

                      {/* Play Button */}
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-colors flex items-center justify-center rounded-t-lg">
                        <div className="bg-orange-500 rounded-full p-4">
                          <Play className="h-8 w-8 text-black fill-black" />
                        </div>
                      </div>

                      {/* Duration */}
                      <Badge className="absolute bottom-2 right-2 bg-black/80 text-white">{video.duration}</Badge>

                      {video.is_premium && (
                        <Badge className="absolute top-2 right-2 bg-gold-400 text-black">
                          <Crown className="h-3 w-3 mr-1" />
                          PREMIUM
                        </Badge>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <h3 className="font-bold">{video.title}</h3>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {formatNumber(video.views)} views
                        </span>
                        <span>{new Date(video.release_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Gallery Tab */}
          <TabsContent value="gallery" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {galleryItems.map((item) => (
                <Card
                  key={item.id}
                  className={`bg-card/50 border-orange-500/20 hover:border-orange-500/40 transition-all group cursor-pointer ${!canAccess(item) ? "opacity-60" : ""}`}
                >
                  <CardHeader className="p-0">
                    <div className="relative">
                      <img
                        src={item.image_url || "/placeholder.svg?height=250&width=300"}
                        alt={item.title}
                        className="w-full h-64 object-cover rounded-t-lg"
                      />

                      {item.is_premium && (
                        <Badge className="absolute top-2 right-2 bg-gold-400 text-black">
                          <Crown className="h-3 w-3 mr-1" />
                          PREMIUM
                        </Badge>
                      )}

                      <Badge className="absolute bottom-2 left-2 bg-black/80 text-white">{item.category}</Badge>

                      {!canAccess(item) && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-t-lg">
                          <Crown className="h-8 w-8 text-white" />
                        </div>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="p-4">
                    <h3 className="font-semibold text-sm">{item.title}</h3>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Streaming Links Modal */}
        <StreamingLinksModal item={showStreamingLinks} onClose={() => setShowStreamingLinks(null)} />

        {/* Album Detail Modal */}
        {selectedAlbum && (
          <Dialog open={!!selectedAlbum} onOpenChange={() => setSelectedAlbum(null)}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl font-street text-gradient">{selectedAlbum.title}</DialogTitle>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <img
                    src={selectedAlbum.cover_url || "/placeholder.svg"}
                    alt={selectedAlbum.title}
                    className="w-full aspect-square object-cover rounded-lg"
                  />

                  <div className="flex gap-2">
                    <Button className="flex-1 bg-orange-500 hover:bg-orange-600 text-black">
                      <Play className="h-4 w-4 mr-2" />
                      Play Album
                    </Button>
                    <Button variant="outline">
                      <Heart className="h-4 w-4" />
                    </Button>
                    <Button variant="outline">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-bold mb-2">Album Info</h3>
                    <p className="text-muted-foreground mb-4">{selectedAlbum.description}</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Release Date:</span>
                        <span>{new Date(selectedAlbum.release_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Tracks:</span>
                        <span>{selectedAlbum.total_tracks}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Duration:</span>
                        <span>{selectedAlbum.duration}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Plays:</span>
                        <span>{formatNumber(selectedAlbum.play_count)}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold mb-4">Stream On</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {streamingPlatforms.slice(0, 4).map((platform) => (
                        <Button key={platform.name} variant="outline" size="sm" className="justify-start" asChild>
                          <a href={platform.url} target="_blank" rel="noopener noreferrer">
                            <span className="mr-2">{platform.icon}</span>
                            {platform.name}
                          </a>
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Video Player Modal */}
        {selectedVideo && (
          <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>{selectedVideo.title}</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
                  <div className="text-center text-white">
                    <Youtube className="h-16 w-16 mx-auto mb-4" />
                    <p className="text-lg">Video Player</p>
                    <p className="text-sm text-gray-400">Duration: {selectedVideo.duration}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg">{selectedVideo.title}</h3>
                    <p className="text-muted-foreground">
                      {formatNumber(selectedVideo.views)} views •{" "}
                      {new Date(selectedVideo.release_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Heart className="h-4 w-4 mr-1" />
                      Like
                    </Button>
                    <Button variant="outline" size="sm">
                      <Share2 className="h-4 w-4 mr-1" />
                      Share
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  )
}
