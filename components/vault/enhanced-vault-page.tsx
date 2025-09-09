"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "react-toastify"
import {
  Archive,
  Search,
  Play,
  Heart,
  Share2,
  Music,
  Video,
  ImageIcon,
  FileText,
  Calendar,
  Eye,
  Lock,
  Crown,
  Loader2,
  Coins,
  CreditCard,
  Unlock,
  ExternalLink,
  Minimize,
  Maximize,
  Pause,
  Volume2,
  VolumeX,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"
import Link from "next/link"
import Image from "next/image"

interface MediaItem {
  id: string
  title: string
  description?: string
  type: "video" | "audio" | "image" | "document"
  url: string
  youtube_url?: string
  thumbnail?: string
  duration?: number
  size?: number
  tier_required: "free" | "pro" | "enterprise"
  unlock_price_coins?: number
  unlock_price_naira?: number
  is_premium: boolean
  views: number
  likes: number
  created_at: string
  tags: string[]
  category?: "video" | "music"
}

const videoGalleryData: MediaItem[] = [
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
    tier_required: "pro",
    is_premium: true,
    unlock_price_coins: 500,
    unlock_price_naira: 250,
    views: 22300,
    likes: 1756,
    created_at: "2024-01-12T14:20:00Z",
    tags: ["music-video", "warri", "welcome"],
  },
  {
    id: "v5",
    title: "Erigga - Street King",
    description: "Official music video",
    type: "video",
    url: "https://www.youtube.com/watch?v=mHsv-Q4_9Jk",
    youtube_url: "https://www.youtube.com/watch?v=mHsv-Q4_9Jk",
    thumbnail: `https://img.youtube.com/vi/mHsv-Q4_9Jk/maxresdefault.jpg`,
    tier_required: "free",
    is_premium: false,
    views: 16890,
    likes: 1423,
    created_at: "2024-01-10T19:45:00Z",
    tags: ["music-video", "street-king", "official"],
  },
  {
    id: "v6",
    title: "Erigga - Motivation",
    description: "Official music video",
    type: "video",
    url: "https://www.youtube.com/watch?v=O99w7tFnQRI",
    youtube_url: "https://www.youtube.com/watch?v=O99w7tFnQRI",
    thumbnail: `https://img.youtube.com/vi/O99w7tFnQRI/maxresdefault.jpg`,
    tier_required: "free",
    is_premium: false,
    views: 28900,
    likes: 2100,
    created_at: "2024-01-08T16:30:00Z",
    tags: ["music-video", "motivation", "official"],
  },
  {
    id: "v7",
    title: "Erigga - Area Father",
    description: "Official music video",
    type: "video",
    url: "https://www.youtube.com/watch?v=yd1GIyHsvEI",
    youtube_url: "https://www.youtube.com/watch?v=yd1GIyHsvEI",
    thumbnail: `https://img.youtube.com/vi/yd1GIyHsvEI/maxresdefault.jpg`,
    tier_required: "pro",
    is_premium: true,
    unlock_price_coins: 750,
    unlock_price_naira: 400,
    views: 19500,
    likes: 1650,
    created_at: "2024-01-06T11:15:00Z",
    tags: ["music-video", "area-father", "exclusive"],
  },
  {
    id: "v8",
    title: "Erigga - Before the Fame",
    description: "Official music video",
    type: "video",
    url: "https://www.youtube.com/watch?v=hjzM6hY3AkY",
    youtube_url: "https://www.youtube.com/watch?v=hjzM6hY3AkY",
    thumbnail: `https://img.youtube.com/vi/hjzM6hY3AkY/maxresdefault.jpg`,
    tier_required: "free",
    is_premium: false,
    views: 31200,
    likes: 2450,
    created_at: "2024-01-04T14:00:00Z",
    tags: ["music-video", "before-fame", "story"],
  },
  {
    id: "v9",
    title: "Erigga - Paper Boi Anthem",
    description: "Official music video",
    type: "video",
    url: "https://www.youtube.com/watch?v=w8DTEJVQPa4",
    youtube_url: "https://www.youtube.com/watch?v=w8DTEJVQPa4",
    thumbnail: `https://img.youtube.com/vi/w8DTEJVQPa4/maxresdefault.jpg`,
    tier_required: "free",
    is_premium: false,
    views: 45600,
    likes: 3200,
    created_at: "2024-01-02T10:30:00Z",
    tags: ["music-video", "paper-boi", "anthem"],
  },
  {
    id: "v10",
    title: "Erigga - Street Credibility",
    description: "Official music video",
    type: "video",
    url: "https://www.youtube.com/watch?v=J8OFAc9EQwA",
    youtube_url: "https://www.youtube.com/watch?v=J8OFAc9EQwA",
    thumbnail: `https://img.youtube.com/vi/J8OFAc9EQwA/maxresdefault.jpg`,
    tier_required: "pro",
    is_premium: true,
    unlock_price_coins: 600,
    unlock_price_naira: 300,
    views: 21800,
    likes: 1890,
    created_at: "2023-12-30T15:45:00Z",
    tags: ["music-video", "street-credibility", "premium"],
  },
  {
    id: "v11",
    title: "Erigga - Area Code",
    description: "Official music video",
    type: "video",
    url: "https://www.youtube.com/watch?v=au_GxclJs18",
    youtube_url: "https://www.youtube.com/watch?v=au_GxclJs18",
    thumbnail: `https://img.youtube.com/vi/au_GxclJs18/maxresdefault.jpg`,
    tier_required: "free",
    is_premium: false,
    views: 27300,
    likes: 2150,
    created_at: "2023-12-28T12:20:00Z",
    tags: ["music-video", "area-code", "official"],
  },
  {
    id: "v12",
    title: "Erigga - Warri Anthem",
    description: "Official music video",
    type: "video",
    url: "https://www.youtube.com/watch?v=iKzcjnSyD7M",
    youtube_url: "https://www.youtube.com/watch?v=iKzcjnSyD7M",
    thumbnail: `https://img.youtube.com/vi/iKzcjnSyD7M/maxresdefault.jpg`,
    tier_required: "free",
    is_premium: false,
    views: 38900,
    likes: 2890,
    created_at: "2023-12-26T09:15:00Z",
    tags: ["music-video", "warri", "anthem"],
  },
  {
    id: "v13",
    title: "Erigga - Street Philosophy",
    description: "Official music video",
    type: "video",
    url: "https://www.youtube.com/watch?v=2Qe1IT9DOMG",
    youtube_url: "https://www.youtube.com/watch?v=2Qe1IT9DOMG",
    thumbnail: `https://img.youtube.com/vi/2Qe1IT9DOMG/maxresdefault.jpg`,
    tier_required: "enterprise",
    is_premium: true,
    unlock_price_coins: 1000,
    unlock_price_naira: 500,
    views: 15600,
    likes: 1234,
    created_at: "2023-12-24T18:00:00Z",
    tags: ["music-video", "philosophy", "exclusive"],
  },
  {
    id: "v14",
    title: "Erigga - Paper Boi Legacy",
    description: "Official music video",
    type: "video",
    url: "https://www.youtube.com/watch?v=OBX222XuhlQ",
    youtube_url: "https://www.youtube.com/watch?v=OBX222XuhlQ",
    thumbnail: `https://img.youtube.com/vi/OBX222XuhlQ/maxresdefault.jpg`,
    tier_required: "free",
    is_premium: false,
    views: 42100,
    likes: 3450,
    created_at: "2023-12-22T13:30:00Z",
    tags: ["music-video", "legacy", "paper-boi"],
  },
  {
    id: "v15",
    title: "Erigga - Street Dreams",
    description: "Official music video",
    type: "video",
    url: "https://www.youtube.com/watch?v=f7iD9wdn_g4",
    youtube_url: "https://www.youtube.com/watch?v=f7iD9wdn_g4",
    thumbnail: `https://img.youtube.com/vi/f7iD9wdn_g4/maxresdefault.jpg`,
    tier_required: "pro",
    is_premium: true,
    unlock_price_coins: 650,
    unlock_price_naira: 350,
    views: 19800,
    likes: 1567,
    created_at: "2023-12-20T16:45:00Z",
    tags: ["music-video", "dreams", "street"],
  },
  {
    id: "v16",
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
  },
  {
    id: "v17",
    title: "Erigga - Area Scatter",
    description: "Official music video",
    type: "video",
    url: "https://www.youtube.com/watch?v=ZmCjtgjAwvo",
    youtube_url: "https://www.youtube.com/watch?v=ZmCjtgjAwvo",
    thumbnail: `https://img.youtube.com/vi/ZmCjtgjAwvo/maxresdefault.jpg`,
    tier_required: "free",
    is_premium: false,
    views: 29400,
    likes: 2100,
    created_at: "2023-12-16T14:15:00Z",
    tags: ["music-video", "area-scatter", "official"],
  },
  {
    id: "v18",
    title: "Erigga - Street Soldier",
    description: "Official music video",
    type: "video",
    url: "https://www.youtube.com/watch?v=5MljpczOEvQ",
    youtube_url: "https://www.youtube.com/watch?v=5MljpczOEvQ",
    thumbnail: `https://img.youtube.com/vi/5MljpczOEvQ/maxresdefault.jpg`,
    tier_required: "pro",
    is_premium: true,
    unlock_price_coins: 700,
    unlock_price_naira: 375,
    views: 17900,
    likes: 1456,
    created_at: "2023-12-14T10:30:00Z",
    tags: ["music-video", "soldier", "street"],
  },
  {
    id: "v19",
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
    id: "v20",
    title: "Erigga - Area Legend",
    description: "Official music video",
    type: "video",
    url: "https://www.youtube.com/watch?v=A5yU5XqsZa8",
    youtube_url: "https://www.youtube.com/watch?v=A5yU5XqsZa8",
    thumbnail: `https://img.youtube.com/vi/A5yU5XqsZa8/maxresdefault.jpg`,
    tier_required: "enterprise",
    is_premium: true,
    unlock_price_coins: 1200,
    unlock_price_naira: 600,
    views: 13500,
    likes: 1089,
    created_at: "2023-12-10T12:45:00Z",
    tags: ["music-video", "legend", "exclusive"],
  },
  {
    id: "v21",
    title: "Erigga - Street Testimony",
    description: "Official music video",
    type: "video",
    url: "https://www.youtube.com/watch?v=1jxzqPWTSlk",
    youtube_url: "https://www.youtube.com/watch?v=1jxzqPWTSlk",
    thumbnail: `https://img.youtube.com/vi/1jxzqPWTSlk/maxresdefault.jpg`,
    tier_required: "free",
    is_premium: false,
    views: 33800,
    likes: 2650,
    created_at: "2023-12-08T17:00:00Z",
    tags: ["music-video", "testimony", "street"],
  },
  {
    id: "v22",
    title: "Erigga - Paper Boi Forever",
    description: "Official music video",
    type: "video",
    url: "https://www.youtube.com/watch?v=WBv6eGHFQQk",
    youtube_url: "https://www.youtube.com/watch?v=WBv6eGHFQQk",
    thumbnail: `https://img.youtube.com/vi/WBv6eGHFQQk/maxresdefault.jpg`,
    tier_required: "pro",
    is_premium: true,
    unlock_price_coins: 800,
    unlock_price_naira: 425,
    views: 24600,
    likes: 1980,
    created_at: "2023-12-06T13:15:00Z",
    tags: ["music-video", "forever", "paper-boi"],
  },
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
  },
]

const allMediaItems = [
  ...videoGalleryData.map((item) => ({ ...item, category: "video" as const })),
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
  const [isPlaying, setIsPlaying] = useState(true)
  const [isMuted, setIsMuted] = useState(false)

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
                <div className="flex items-center space-x-4">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-white hover:bg-white/20"
                    onClick={() => setIsPlaying(!isPlaying)}
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-white hover:bg-white/20"
                    onClick={() => setIsMuted(!isMuted)}
                  >
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </Button>
                </div>
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

interface UnlockModalProps {
  item: MediaItem
  isOpen: boolean
  onClose: () => void
  onUnlock: (method: "coins" | "paystack") => void
}

function UnlockModal({ item, isOpen, onClose, onUnlock }: UnlockModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-lg p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-6">
              <Lock className="h-12 w-12 mx-auto text-orange-500 mb-4" />
              <h3 className="text-xl font-bold mb-2">Unlock Premium Content</h3>
              <p className="text-gray-600">{item.title}</p>
            </div>

            <div className="space-y-4">
              {item.unlock_price_coins && (
                <Button
                  onClick={() => onUnlock("coins")}
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-white"
                >
                  <Coins className="w-4 h-4 mr-2" />
                  Unlock with {item.unlock_price_coins} Coins
                </Button>
              )}

              {item.unlock_price_naira && (
                <Button
                  onClick={() => onUnlock("paystack")}
                  className="w-full bg-green-500 hover:bg-green-600 text-white"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Pay ₦{item.unlock_price_naira}
                </Button>
              )}

              <Button onClick={onClose} variant="outline" className="w-full bg-transparent">
                Cancel
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function EnhancedVaultPage() {
  const { profile, isAuthenticated } = useAuth()
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [selectedTier, setSelectedTier] = useState<string>("all")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("newest")
  const [currentPlayer, setCurrentPlayer] = useState<{ videoId: string; title: string; isFullscreen: boolean } | null>(
    null,
  )
  const [unlockModal, setUnlockModal] = useState<{ item: MediaItem; isOpen: boolean }>({
    item: {} as MediaItem,
    isOpen: false,
  })

  useEffect(() => {
    const timer = setTimeout(() => {
      setMediaItems(allMediaItems)
      setLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  const playVideo = (item: MediaItem) => {
    if (!isAuthenticated || !profile) {
      toast.error("Please sign in to watch videos")
      return
    }

    if (!canAccessContent(item.tier_required)) {
      toast.error(`This video requires ${item.tier_required} tier or higher`)
      return
    }

    if (item.youtube_url) {
      const videoId = getYouTubeVideoId(item.youtube_url)
      setCurrentPlayer({ videoId, title: item.title, isFullscreen: false })
    }
  }

  const redirectToYouTube = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer")
  }

  const getTierColor = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case "enterprise":
        return "bg-purple-500"
      case "pro":
        return "bg-orange-500"
      case "free":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  const getTierDisplayName = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case "enterprise":
        return "Enterprise"
      case "pro":
        return "Pro"
      case "free":
        return "Free"
      default:
        return "Unknown"
    }
  }

  const canAccessContent = (requiredTier: string) => {
    if (!isAuthenticated || !profile) return false

    const tierHierarchy = {
      free: 1,
      grassroot: 1,
      pro: 2,
      pioneer: 2,
      enterprise: 3,
      elder: 3,
      blood_brotherhood: 3,
      blood: 3,
    }

    const userTierLevel = tierHierarchy[profile.tier?.toLowerCase() as keyof typeof tierHierarchy] || 0
    const requiredTierLevel = tierHierarchy[requiredTier?.toLowerCase() as keyof typeof tierHierarchy] || 0

    return userTierLevel >= requiredTierLevel
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "video":
        return Video
      case "audio":
        return Music
      case "image":
        return ImageIcon
      case "document":
        return FileText
      default:
        return Archive
    }
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const handleUnlock = async (item: MediaItem, method: "coins" | "paystack") => {
    // Implement unlock logic here
    console.log(`Unlocking ${item.title} with ${method}`)
    setUnlockModal({ item: {} as MediaItem, isOpen: false })

    // You would integrate with your payment system here
    if (method === "paystack") {
      // Initialize Paystack payment
    } else {
      // Deduct coins from user account
    }
  }

  const filteredItems = mediaItems.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesType = selectedType === "all" || item.type === selectedType
    const matchesTier = selectedTier === "all" || item.tier_required === selectedTier
    const matchesCategory = selectedCategory === "all" || (item as any).category === selectedCategory

    return matchesSearch && matchesType && matchesTier && matchesCategory
  })

  const sortedItems = [...filteredItems].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      case "oldest":
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      case "popular":
        return b.views - a.views
      case "liked":
        return b.likes - a.likes
      default:
        return 0
    }
  })

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <Archive className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Media Vault</h1>
        </div>
        <p className="text-muted-foreground">
          Exclusive content, music videos, audio tracks, and behind-the-scenes footage
        </p>
      </motion.div>

      {/* Authentication Check */}
      {!isAuthenticated ? (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <Card>
            <CardContent className="text-center py-12">
              <Lock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Access Required</h3>
              <p className="text-muted-foreground mb-4">Sign in to access exclusive content in the media vault</p>
              <div className="space-x-2">
                <Button asChild>
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/signup">Sign Up</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <>
          {/* Filters */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search media..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-full lg:w-48">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="video">Video Gallery</SelectItem>
                      <SelectItem value="music">Music</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger className="w-full lg:w-48">
                      <SelectValue placeholder="Content Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="video">Videos</SelectItem>
                      <SelectItem value="audio">Audio</SelectItem>
                      <SelectItem value="image">Images</SelectItem>
                      <SelectItem value="document">Documents</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={selectedTier} onValueChange={setSelectedTier}>
                    <SelectTrigger className="w-full lg:w-48">
                      <SelectValue placeholder="Tier Level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tiers</SelectItem>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="pro">Pro</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-full lg:w-48">
                      <SelectValue placeholder="Sort By" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest</SelectItem>
                      <SelectItem value="oldest">Oldest</SelectItem>
                      <SelectItem value="popular">Most Viewed</SelectItem>
                      <SelectItem value="liked">Most Liked</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Content Grid */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {sortedItems.length === 0 ? (
              <div className="col-span-full">
                <Card>
                  <CardContent className="text-center py-12">
                    <Archive className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No content found</h3>
                    <p className="text-muted-foreground">
                      {searchQuery ? "Try adjusting your search terms" : "No media available at the moment"}
                    </p>
                  </CardContent>
                </Card>
              </div>
            ) : (
              sortedItems.map((item, index) => {
                const TypeIcon = getTypeIcon(item.type)
                const hasAccess = canAccessContent(item.tier_required)
                const videoId = item.youtube_url ? getYouTubeVideoId(item.youtube_url) : ""

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -5 }}
                  >
                    <Card className="group hover:shadow-lg transition-all duration-300 h-full">
                      <div className="relative">
                        {/* Thumbnail */}
                        <div className="aspect-video bg-muted rounded-t-lg overflow-hidden relative">
                          {item.thumbnail ? (
                            <Image
                              src={item.thumbnail || "/placeholder.svg"}
                              alt={item.title}
                              fill
                              className={`object-cover transition-transform duration-300 ${
                                hasAccess ? "group-hover:scale-105" : "blur-sm"
                              }`}
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <TypeIcon className="h-12 w-12 text-muted-foreground" />
                            </div>
                          )}

                          {/* Blur overlay for locked content */}
                          {!hasAccess && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="absolute inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center"
                            >
                              <div className="text-center text-white">
                                <Lock className="h-8 w-8 mx-auto mb-2" />
                                <p className="text-sm font-medium">Locked Content</p>
                              </div>
                            </motion.div>
                          )}

                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-t-lg">
                            {hasAccess ? (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  className="bg-red-600 hover:bg-red-700 text-white shadow-lg"
                                  onClick={() => playVideo(item)}
                                >
                                  <Play className="h-4 w-4 mr-2" />
                                  Play
                                </Button>
                                {item.youtube_url && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
                                    onClick={() => redirectToYouTube(item.youtube_url!)}
                                  >
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    YouTube
                                  </Button>
                                )}
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                className="bg-orange-500 hover:bg-orange-600 text-white shadow-lg"
                                onClick={() => setUnlockModal({ item, isOpen: true })}
                              >
                                <Unlock className="h-4 w-4 mr-2" />
                                Unlock
                              </Button>
                            )}
                          </div>

                          {/* Duration */}
                          {item.duration && (
                            <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                              {formatDuration(item.duration)}
                            </div>
                          )}

                          {/* Premium Badge */}
                          {item.is_premium && (
                            <div className="absolute top-2 left-2">
                              <Badge className="bg-yellow-500 text-black">
                                <Crown className="h-3 w-3 mr-1" />
                                Premium
                              </Badge>
                            </div>
                          )}

                          {/* Tier Badge */}
                          <div className="absolute top-2 right-2">
                            <Badge className={cn("text-white", getTierColor(item.tier_required))}>
                              {getTierDisplayName(item.tier_required)}
                            </Badge>
                          </div>
                        </div>

                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-medium line-clamp-2 flex-1">{item.title}</h3>
                            <TypeIcon className="h-4 w-4 text-muted-foreground ml-2 flex-shrink-0" />
                          </div>

                          {item.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{item.description}</p>
                          )}

                          {/* Unlock pricing for locked content */}
                          {!hasAccess && (item.unlock_price_coins || item.unlock_price_naira) && (
                            <div className="mb-3 p-2 bg-orange-50 rounded-lg">
                              <p className="text-xs text-orange-700 font-medium">Unlock Options:</p>
                              <div className="flex gap-2 mt-1">
                                {item.unlock_price_coins && (
                                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                                    {item.unlock_price_coins} coins
                                  </span>
                                )}
                                {item.unlock_price_naira && (
                                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                    ₦{item.unlock_price_naira}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Tags */}
                          {item.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-3">
                              {item.tags.slice(0, 3).map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}

                          {/* Stats */}
                          <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                            <div className="flex items-center space-x-3">
                              <div className="flex items-center">
                                <Eye className="h-3 w-3 mr-1" />
                                {item.views}
                              </div>
                              <div className="flex items-center">
                                <Heart className="h-3 w-3 mr-1" />
                                {item.likes}
                              </div>
                            </div>
                            <div className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center justify-between">
                            {hasAccess ? (
                              <div className="flex space-x-2">
                                <Button size="sm" variant="outline" onClick={() => playVideo(item)}>
                                  <Play className="h-3 w-3 mr-1" />
                                  Play
                                </Button>
                                {item.youtube_url && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-red-600 border-red-200 hover:bg-red-50 bg-transparent"
                                    onClick={() => redirectToYouTube(item.youtube_url!)}
                                  >
                                    <ExternalLink className="h-3 w-3 mr-1" />
                                    YouTube
                                  </Button>
                                )}
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setUnlockModal({ item, isOpen: true })}
                              >
                                <Unlock className="h-3 w-3 mr-1" />
                                Unlock
                              </Button>
                            )}

                            <Button size="sm" variant="ghost">
                              <Share2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </div>
                    </Card>
                  </motion.div>
                )
              })
            )}
          </motion.div>
        </>
      )}

      {currentPlayer && (
        <YouTubePlayer
          videoId={currentPlayer.videoId}
          title={currentPlayer.title}
          isFullscreen={currentPlayer.isFullscreen}
          onToggleFullscreen={() =>
            setCurrentPlayer((prev) => (prev ? { ...prev, isFullscreen: !prev.isFullscreen } : null))
          }
          onClose={() => setCurrentPlayer(null)}
        />
      )}

      {/* Unlock Modal */}
      <UnlockModal
        item={unlockModal.item}
        isOpen={unlockModal.isOpen}
        onClose={() => setUnlockModal({ item: {} as MediaItem, isOpen: false })}
        onUnlock={(method) => handleUnlock(unlockModal.item, method)}
      />
    </div>
  )
}
