"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Archive,
  Search,
  Play,
  Download,
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
}

const mockMediaItems: MediaItem[] = [
  {
    id: "1",
    title: "Behind the Scenes - Studio Session",
    description: "Exclusive footage from the latest recording session",
    type: "video",
    url: "/placeholder.mp4",
    thumbnail: "/images/hero/erigga1.jpeg",
    duration: 180,
    tier_required: "pro",
    unlock_price_coins: 500,
    unlock_price_naira: 250,
    is_premium: true,
    views: 1250,
    likes: 89,
    created_at: "2024-01-15T10:00:00Z",
    tags: ["studio", "behind-scenes", "exclusive"],
  },
  {
    id: "2",
    title: "Unreleased Track - 'Street Dreams'",
    description: "Brand new unreleased track for Enterprise members",
    type: "audio",
    url: "/placeholder.mp3",
    duration: 240,
    tier_required: "enterprise",
    unlock_price_coins: 1000,
    unlock_price_naira: 500,
    is_premium: true,
    views: 890,
    likes: 156,
    created_at: "2024-01-10T15:30:00Z",
    tags: ["unreleased", "exclusive", "new-music"],
  },
  {
    id: "3",
    title: "Concert Photos - Lagos Show",
    description: "High-quality photos from the recent Lagos concert",
    type: "image",
    url: "/images/hero/erigga2.jpeg",
    tier_required: "free",
    is_premium: false,
    views: 2100,
    likes: 234,
    created_at: "2024-01-05T20:00:00Z",
    tags: ["concert", "photos", "lagos"],
  },
  {
    id: "4",
    title: "Lyrics Sheet - 'Paper Boi'",
    description: "Official handwritten lyrics for Paper Boi",
    type: "document",
    url: "/placeholder.pdf",
    tier_required: "pro",
    unlock_price_coins: 300,
    unlock_price_naira: 150,
    is_premium: true,
    views: 567,
    likes: 78,
    created_at: "2024-01-01T12:00:00Z",
    tags: ["lyrics", "paper-boi", "handwritten"],
  },
]

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
  const [sortBy, setSortBy] = useState<string>("newest")
  const [unlockModal, setUnlockModal] = useState<{ item: MediaItem; isOpen: boolean }>({
    item: {} as MediaItem,
    isOpen: false,
  })

  useEffect(() => {
    const timer = setTimeout(() => {
      setMediaItems(mockMediaItems)
      setLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

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

    return matchesSearch && matchesType && matchesTier
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
          Exclusive content, unreleased tracks, behind-the-scenes footage, and more
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

                          {/* Overlay */}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-t-lg">
                            {hasAccess ? (
                              <Button size="sm" className="bg-white/20 hover:bg-white/30 text-white">
                                <Play className="h-4 w-4 mr-2" />
                                Play
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                className="bg-orange-500 hover:bg-orange-600 text-white"
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
                                <Button size="sm" variant="outline">
                                  <Play className="h-3 w-3 mr-1" />
                                  Play
                                </Button>
                                <Button size="sm" variant="outline">
                                  <Download className="h-3 w-3" />
                                </Button>
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
