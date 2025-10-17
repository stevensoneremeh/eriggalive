"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Play,
  Music,
  Video,
  ImageIcon,
  ExternalLink,
  Search,
  Grid,
  List,
  Heart,
  Share2,
  Download,
  Eye,
} from "lucide-react"
import Image from "next/image"

interface MediaContent {
  id: string
  title: string
  description?: string
  thumbnail: string
  url: string
  platform: string
  duration?: string
  views?: number
  likes?: number
  uploadDate: string
  tags: string[]
}

const videosData: MediaContent[] = [
  {
    id: "1",
    title: "Paper Boi (Official Music Video)",
    description: "The official music video for Paper Boi",
    thumbnail: "/images/hero/erigga1.jpeg",
    url: "https://youtube.com/watch?v=example1",
    platform: "YouTube",
    duration: "3:45",
    views: 2500000,
    likes: 45000,
    uploadDate: "2024-01-15",
    tags: ["music video", "paper boi", "official"],
  },
  {
    id: "2",
    title: "Behind The Scenes - Studio Session",
    description: "Exclusive behind the scenes footage",
    thumbnail: "/images/hero/erigga2.jpeg",
    url: "https://youtube.com/watch?v=example2",
    platform: "YouTube",
    duration: "8:20",
    views: 150000,
    likes: 8500,
    uploadDate: "2024-01-10",
    tags: ["behind the scenes", "studio", "exclusive"],
  },
  {
    id: "3",
    title: "Live Performance - Lagos Concert",
    description: "Live performance from Lagos concert",
    thumbnail: "/images/hero/erigga3.jpeg",
    url: "https://youtube.com/watch?v=example3",
    platform: "YouTube",
    duration: "15:30",
    views: 890000,
    likes: 25000,
    uploadDate: "2024-01-05",
    tags: ["live", "concert", "lagos"],
  },
]

const photosData: MediaContent[] = [
  {
    id: "1",
    title: "Studio Session Photos",
    description: "High-quality photos from recent studio sessions",
    thumbnail: "/images/hero/erigga1.jpeg",
    url: "/images/hero/erigga1.jpeg",
    platform: "Gallery",
    views: 5000,
    likes: 450,
    uploadDate: "2024-01-15",
    tags: ["studio", "photography", "behind the scenes"],
  },
  {
    id: "2",
    title: "Concert Photography",
    description: "Professional photos from live performances",
    thumbnail: "/images/hero/erigga2.jpeg",
    url: "/images/hero/erigga2.jpeg",
    platform: "Gallery",
    views: 8500,
    likes: 720,
    uploadDate: "2024-01-10",
    tags: ["concert", "live", "photography"],
  },
  {
    id: "3",
    title: "Portrait Session",
    description: "Professional portrait photography",
    thumbnail: "/images/hero/erigga3.jpeg",
    url: "/images/hero/erigga3.jpeg",
    platform: "Gallery",
    views: 3200,
    likes: 280,
    uploadDate: "2024-01-05",
    tags: ["portrait", "professional", "photography"],
  },
]

const musicData: MediaContent[] = [
  {
    id: "1",
    title: "Paper Boi",
    description: "Latest hit single",
    thumbnail: "/erigga/albums/TheGoat2025.jpg",
    url: "https://open.spotify.com/track/example1",
    platform: "Spotify",
    duration: "3:45",
    views: 1200000,
    likes: 35000,
    uploadDate: "2024-01-15",
    tags: ["single", "hip hop", "latest"],
  },
  {
    id: "2",
    title: "Street Dreams",
    description: "From the latest album",
    thumbnail: "/erigga/albums/heErigmaII2019.jpg",
    url: "https://music.apple.com/track/example2",
    platform: "Apple Music",
    duration: "4:12",
    views: 850000,
    likes: 22000,
    uploadDate: "2024-01-10",
    tags: ["album", "street", "dreams"],
  },
  {
    id: "3",
    title: "Lagos Anthem",
    description: "City anthem for Lagos",
    thumbnail: "/erigga/albums/FamilyTime2023.jpg",
    url: "https://audiomack.com/track/example3",
    platform: "Audiomack",
    duration: "3:28",
    views: 650000,
    likes: 18500,
    uploadDate: "2024-01-05",
    tags: ["lagos", "anthem", "city"],
  },
]

interface MediaCardProps {
  item: MediaContent
  type: "video" | "photo" | "music"
  viewMode: "grid" | "list"
}

function MediaCard({ item, type, viewMode }: MediaCardProps) {
  const [isLiked, setIsLiked] = useState(false)

  const getIcon = () => {
    switch (type) {
      case "video":
        return Video
      case "photo":
        return ImageIcon
      case "music":
        return Music
      default:
        return Video
    }
  }

  const Icon = getIcon()

  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "youtube":
        return "bg-red-500"
      case "spotify":
        return "bg-green-500"
      case "apple music":
        return "bg-gray-800"
      case "audiomack":
        return "bg-orange-500"
      default:
        return "bg-blue-500"
    }
  }

  if (viewMode === "list") {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{ scale: 1.02 }}
        className="flex items-center gap-4 p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-all"
      >
        <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
          <Image src={item.thumbnail || "/placeholder.svg"} alt={item.title} fill className="object-cover" />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <Play className="w-6 h-6 text-white" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{item.title}</h3>
          <p className="text-sm text-gray-600 truncate">{item.description}</p>
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {item.views?.toLocaleString()}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="w-3 h-3" />
              {item.likes?.toLocaleString()}
            </span>
            {item.duration && <span>{item.duration}</span>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge className={`${getPlatformColor(item.platform)} text-white text-xs`}>{item.platform}</Badge>
          <Button size="sm" variant="outline">
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -5 }} className="group">
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300">
        <div className="relative aspect-video">
          <Image
            src={item.thumbnail || "/placeholder.svg"}
            alt={item.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />

          {/* Overlay */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Button size="sm" className="bg-white/20 hover:bg-white/30 text-white">
              <Play className="w-4 h-4 mr-2" />
              Play
            </Button>
          </div>

          {/* Duration */}
          {item.duration && (
            <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
              {item.duration}
            </div>
          )}

          {/* Platform Badge */}
          <div className="absolute top-2 right-2">
            <Badge className={`${getPlatformColor(item.platform)} text-white`}>{item.platform}</Badge>
          </div>

          {/* Type Icon */}
          <div className="absolute top-2 left-2">
            <div className="bg-black/50 p-2 rounded-full">
              <Icon className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>

        <CardContent className="p-4">
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{item.title}</h3>

          {item.description && <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>}

          {/* Tags */}
          <div className="flex flex-wrap gap-1 mb-3">
            {item.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {item.views?.toLocaleString()}
              </span>
              <span className="flex items-center gap-1">
                <Heart className={`w-3 h-3 ${isLiked ? "text-red-500 fill-current" : ""}`} />
                {item.likes?.toLocaleString()}
              </span>
            </div>
            <span className="text-xs">{new Date(item.uploadDate).toLocaleDateString()}</span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button size="sm" variant="outline" asChild>
                <a href={item.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Open
                </a>
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setIsLiked(!isLiked)}>
                <Heart className={`w-3 h-3 ${isLiked ? "text-red-500 fill-current" : ""}`} />
              </Button>
            </div>

            <div className="flex gap-1">
              <Button size="sm" variant="ghost">
                <Share2 className="w-3 h-3" />
              </Button>
              <Button size="sm" variant="ghost">
                <Download className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default function MediaPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [activeTab, setActiveTab] = useState("videos")

  const getFilteredData = (data: MediaContent[]) => {
    return data.filter(
      (item) =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())),
    )
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Media Gallery</h1>
        <p className="text-muted-foreground text-lg">
          Explore videos, photos, and music from Erigga across all platforms
        </p>
      </motion.div>

      {/* Search and Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search media..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabs */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="videos" className="flex items-center gap-2">
              <Video className="w-4 h-4" />
              Videos
            </TabsTrigger>
            <TabsTrigger value="photos" className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Photos
            </TabsTrigger>
            <TabsTrigger value="music" className="flex items-center gap-2">
              <Music className="w-4 h-4" />
              Music
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <TabsContent value="videos" className="mt-0">
              <motion.div
                key="videos"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}
              >
                {getFilteredData(videosData).map((video) => (
                  <MediaCard key={video.id} item={video} type="video" viewMode={viewMode} />
                ))}
              </motion.div>
            </TabsContent>

            <TabsContent value="photos" className="mt-0">
              <motion.div
                key="photos"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" : "space-y-4"}
              >
                {getFilteredData(photosData).map((photo) => (
                  <MediaCard key={photo.id} item={photo} type="photo" viewMode={viewMode} />
                ))}
              </motion.div>
            </TabsContent>

            <TabsContent value="music" className="mt-0">
              <motion.div
                key="music"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}
              >
                {getFilteredData(musicData).map((track) => (
                  <MediaCard key={track.id} item={track} type="music" viewMode={viewMode} />
                ))}
              </motion.div>
            </TabsContent>
          </AnimatePresence>
        </Tabs>
      </motion.div>
    </div>
  )
}
