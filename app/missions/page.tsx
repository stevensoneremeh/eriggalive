"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Search,
  Play,
  Heart,
  Share2,
  Music,
  Video,
  Calendar,
  Eye,
  Pause,
  ExternalLink,
  Minimize,
  Maximize,
  Volume2,
  VolumeX,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface MediaItem {
  id: string
  title: string
  description?: string
  type: "video" | "audio"
  url: string
  youtube_url?: string
  thumbnail?: string
  duration?: number
  size?: number
  tier_required: "free" | "pro" | "enterprise"
  is_premium: boolean
  views: number
  likes: number
  created_at: string
  tags: string[]
  category?: "video" | "music"
}

const videoData: MediaItem[] = [
  {
    id: "v1",
    title: "Erigga - Street Motivation",
    description: "Official music video",
    type: "video",
    url: "https://www.youtube.com/watch?v=7YgnTu2YJ50",
    youtube_url: "https://www.youtube.com/watch?v=7YgnTu2YJ50",
    thumbnail: `https://img.youtube.com/vi/7YgnTu2YJ50/maxresdefault.jpg`,
    tier_required: "free",
    is_premium: false,
    views: 25420,
    likes: 1892,
    created_at: "2024-01-20T10:00:00Z",
    tags: ["music-video", "street-motivation", "official"],
  },
  {
    id: "v2",
    title: "Erigga - Paper Boi Chronicles",
    description: "Official music video",
    type: "video",
    url: "https://www.youtube.com/watch?v=bfNkqu-GMw0",
    youtube_url: "https://www.youtube.com/watch?v=bfNkqu-GMw0",
    thumbnail: `https://img.youtube.com/vi/bfNkqu-GMw0/maxresdefault.jpg`,
    tier_required: "free",
    is_premium: false,
    views: 33150,
    likes: 2340,
    created_at: "2024-01-18T15:30:00Z",
    tags: ["music-video", "paper-boi", "chronicles"],
  },
  {
    id: "v3",
    title: "Erigga - Area to the World",
    description: "Official music video",
    type: "video",
    url: "https://www.youtube.com/watch?v=ylsUpP7ey9Q",
    youtube_url: "https://www.youtube.com/watch?v=ylsUpP7ey9Q",
    thumbnail: `https://img.youtube.com/vi/ylsUpP7ey9Q/maxresdefault.jpg`,
    tier_required: "free",
    is_premium: false,
    views: 18750,
    likes: 1567,
    created_at: "2024-01-15T12:00:00Z",
    tags: ["music-video", "area-to-world", "official"],
  },
  {
    id: "v4",
    title: "Erigga - Welcome to Warri",
    description: "Official music video",
    type: "video",
    url: "https://www.youtube.com/watch?v=n9gNGNCrxGA",
    youtube_url: "https://www.youtube.com/watch?v=n9gNGNCrxGA",
    thumbnail: `https://img.youtube.com/vi/n9gNGNCrxGA/maxresdefault.jpg`,
    tier_required: "free",
    is_premium: false,
    views: 22300,
    likes: 1756,
    created_at: "2024-01-12T14:20:00Z",
    tags: ["music-video", "warri", "welcome"],
  },
  {
    id: "v5",
    title: "Erigga - Paper Boi Story",
    description: "Official music video",
    type: "video",
    url: "https://www.youtube.com/watch?v=nNsWsJzOon0",
    youtube_url: "https://www.youtube.com/watch?v=nNsWsJzOon0",
    thumbnail: `https://img.youtube.com/vi/nNsWsJzOon0/maxresdefault.jpg`,
    tier_required: "free",
    is_premium: false,
    views: 51200,
    likes: 4100,
    created_at: "2023-12-12T15:20:00Z",
    tags: ["music-video", "story", "paper-boi"],
  },
  {
    id: "v6",
    title: "Erigga - Ayeme",
    description: "Official music video",
    type: "video",
    url: "https://www.youtube.com/watch?v=ag5x6M99pmA",
    youtube_url: "https://www.youtube.com/watch?v=ag5x6M99pmA",
    thumbnail: `https://img.youtube.com/vi/ag5x6M99pmA/maxresdefault.jpg`,
    tier_required: "free",
    is_premium: false,
    views: 35700,
    likes: 2780,
    created_at: "2023-12-18T11:00:00Z",
    tags: ["music-video", "ayeme", "official"],
  }
]

const musicData: MediaItem[] = [
  {
    id: "m1",
    title: "PTSD feat. Odumodublvck",
    description: "Audio track",
    type: "audio",
    url: "https://www.youtube.com/watch?v=PQSHohH5Pgo",
    youtube_url: "https://www.youtube.com/watch?v=PQSHohH5Pgo",
    thumbnail: `https://img.youtube.com/vi/PQSHohH5Pgo/maxresdefault.jpg`,
    tier_required: "free",
    is_premium: false,
    views: 45230,
    likes: 2890,
    created_at: "2024-01-18T15:30:00Z",
    tags: ["audio", "ptsd", "collaboration"],
  },
  {
    id: "m2",
    title: "Good Loving",
    description: "Audio track",
    type: "audio",
    url: "https://www.youtube.com/watch?v=iakjkSyo-J4",
    youtube_url: "https://www.youtube.com/watch?v=iakjkSyo-J4",
    thumbnail: `https://img.youtube.com/vi/iakjkSyo-J4/maxresdefault.jpg`,
    tier_required: "free",
    is_premium: false,
    views: 32100,
    likes: 1950,
    created_at: "2024-01-16T10:00:00Z",
    tags: ["audio", "good-loving", "love-song"],
  },
  {
    id: "m3",
    title: "Paper Boi Anthem",
    description: "Street classic audio",
    type: "audio",
    url: "https://www.youtube.com/watch?v=ScMzIvxBSi4",
    youtube_url: "https://www.youtube.com/watch?v=ScMzIvxBSi4",
    thumbnail: `https://img.youtube.com/vi/ScMzIvxBSi4/maxresdefault.jpg`,
    tier_required: "free",
    is_premium: false,
    views: 67890,
    likes: 4230,
    created_at: "2024-01-14T11:15:00Z",
    tags: ["audio", "paper-boi", "street-classic"],
  }
]

const allMediaItems = [
  ...videoData.map((item) => ({ ...item, category: "video" as const })),
  ...musicData.map((item) => ({ ...item, category: "music" as const })),
]

interface YouTubePlayerProps {
  videoId: string
  title: string
  isFullscreen: boolean
  onToggleFullscreen: () => void
  onClose: () => void
}

function YouTubePlayer({ videoId, title, isFullscreen, onToggleFullscreen, onClose }: YouTubePlayerProps) {
  return (
    <AnimatePresence>
      {isFullscreen ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black z-50 flex items-center justify-center"
        >
          <div className="relative w-full h-full">
            <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <h3 className="text-white font-medium text-lg truncate max-w-md">{title}</h3>
                  <Badge className="bg-red-600 text-white">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-2" />
                    LIVE
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={onToggleFullscreen}
                    size="sm"
                    variant="ghost"
                    className="text-white hover:bg-white/20"
                  >
                    <Minimize className="h-5 w-5" />
                  </Button>
                  <Button onClick={onClose} size="sm" variant="ghost" className="text-white hover:bg-white/20">
                    ✕
                  </Button>
                </div>
              </div>
            </div>
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&controls=1`}
              title={title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            className="bg-black rounded-xl overflow-hidden shadow-2xl max-w-4xl w-full max-h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-gray-900 to-black p-4 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                  <h3 className="text-white font-medium text-lg truncate">{title}</h3>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={onToggleFullscreen}
                    size="sm"
                    variant="ghost"
                    className="text-white hover:bg-white/20"
                  >
                    <Maximize className="h-4 w-4" />
                  </Button>
                  <Button onClick={onClose} size="sm" variant="ghost" className="text-white hover:bg-white/20">
                    ✕
                  </Button>
                </div>
              </div>
            </div>

            <div className="relative aspect-video bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&controls=1`}
                title={title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            <div className="bg-gradient-to-r from-gray-900 to-black p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-red-600 hover:bg-red-700 text-white border-red-600"
                    onClick={() => window.open(`https://www.youtube.com/watch?v=${videoId}`, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Watch on YouTube
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function getYouTubeVideoId(url: string): string {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)
  return match ? match[1] : ""
}

export default function MediaPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("newest")
  const [currentVideo, setCurrentVideo] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Filter and sort media items
  const filteredMedia = allMediaItems
    .filter((item) => {
      if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }
      if (selectedCategory !== "all" && item.category !== selectedCategory) {
        return false
      }
      if (selectedType !== "all" && item.type !== selectedType) {
        return false
      }
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case "most_viewed":
          return b.views - a.views
        case "most_liked":
          return b.likes - a.likes
        case "newest":
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })

  const openVideo = (item: MediaItem) => {
    const videoId = getYouTubeVideoId(item.url)
    if (videoId) {
      setCurrentVideo(videoId)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-black/80 via-gray-900/80 to-black/80 backdrop-blur-md border-b border-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <motion.h1
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl font-bold bg-gradient-to-r from-red-500 via-yellow-400 to-orange-500 bg-clip-text text-transparent mb-4"
            >
              Erigga Media Gallery
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-gray-300"
            >
              Official videos, tracks, and exclusive content from the Paper Boi himself
            </motion.p>
          </div>

          {/* Search and Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col md:flex-row gap-4 justify-center items-center"
          >
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search videos and music..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-800/50 border-gray-700 text-white placeholder-gray-400"
              />
            </div>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-40 bg-gray-800/50 border-gray-700 text-white">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="all" className="text-white hover:bg-gray-700">All</SelectItem>
                <SelectItem value="video" className="text-white hover:bg-gray-700">Videos</SelectItem>
                <SelectItem value="music" className="text-white hover:bg-gray-700">Music</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40 bg-gray-800/50 border-gray-700 text-white">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="newest" className="text-white hover:bg-gray-700">Newest</SelectItem>
                <SelectItem value="oldest" className="text-white hover:bg-gray-700">Oldest</SelectItem>
                <SelectItem value="most_viewed" className="text-white hover:bg-gray-700">Most Viewed</SelectItem>
                <SelectItem value="most_liked" className="text-white hover:bg-gray-700">Most Liked</SelectItem>
              </SelectContent>
            </Select>
          </motion.div>
        </div>
      </div>

      {/* Media Grid */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMedia.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="bg-gray-800/50 border-gray-700 hover:bg-gray-700/50 transition-all duration-300 group overflow-hidden">
                <div className="relative aspect-video overflow-hidden">
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-all duration-300" />
                  
                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Button
                      onClick={() => openVideo(item)}
                      size="lg"
                      className="bg-red-600/80 hover:bg-red-600 text-white rounded-full w-16 h-16 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300"
                    >
                      <Play className="h-6 w-6 ml-1" />
                    </Button>
                  </div>

                  {/* Category Badge */}
                  <div className="absolute top-3 left-3">
                    <Badge className={`${item.type === "video" ? "bg-blue-600" : "bg-purple-600"} text-white`}>
                      {item.type === "video" ? <Video className="h-3 w-3 mr-1" /> : <Music className="h-3 w-3 mr-1" />}
                      {item.type}
                    </Badge>
                  </div>

                  {/* Duration Badge */}
                  <div className="absolute bottom-3 right-3">
                    <Badge className="bg-black/70 text-white">
                      <Calendar className="h-3 w-3 mr-1" />
                      {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-6">
                  <h3 className="font-bold text-lg mb-2 text-white group-hover:text-yellow-400 transition-colors line-clamp-2">
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">{item.description}</p>
                  )}

                  <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {item.views.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="h-4 w-4" />
                        {item.likes.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {item.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-gray-400 border-gray-600 text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => openVideo(item)}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Play Now
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-gray-600 text-gray-400 hover:bg-gray-700"
                      onClick={() => window.open(item.url, "_blank")}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {filteredMedia.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="text-6xl mb-4">🎵</div>
            <h3 className="text-xl font-semibold mb-2 text-white">No media found</h3>
            <p className="text-gray-400">Try adjusting your search or filter criteria</p>
          </motion.div>
        )}
      </div>

      {/* YouTube Player Modal */}
      {currentVideo && (
        <YouTubePlayer
          videoId={currentVideo}
          title={filteredMedia.find(item => getYouTubeVideoId(item.url) === currentVideo)?.title || ""}
          isFullscreen={isFullscreen}
          onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
          onClose={() => {
            setCurrentVideo(null)
            setIsFullscreen(false)
          }}
        />
      )}
    </div>
  )
}
