"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Music, Video, Image, Lock, Play, Download, Crown, Coins } from 'lucide-react'
import { BlurredContent } from "@/components/blurred-content"
import { LoginPromptModal } from "@/components/auth/login-prompt-modal"
import { useAuthAction } from "@/hooks/use-auth-action"
import Link from "next/link"

interface MediaItem {
  id: string
  title: string
  type: "audio" | "video" | "image"
  thumbnail: string
  duration?: string
  size?: string
  tier: "free" | "pioneer" | "elder" | "blood_brotherhood"
  description: string
  releaseDate: string
  isExclusive?: boolean
}

const mockMediaItems: MediaItem[] = [
  {
    id: "1",
    title: "The Erigma - Full Album",
    type: "audio",
    thumbnail: "/erigga/albums/the-erigma-cover.jpeg",
    duration: "45:32",
    tier: "free",
    description: "Erigga's breakthrough album that put him on the map",
    releaseDate: "2012",
  },
  {
    id: "2",
    title: "Behind the Scenes: Studio Sessions",
    type: "video",
    thumbnail: "/erigga/studio/erigga-recording-studio.jpeg",
    duration: "12:45",
    tier: "pioneer",
    description: "Exclusive footage from Erigga's recording sessions",
    releaseDate: "2024",
    isExclusive: true,
  },
  {
    id: "3",
    title: "The Erigma II - Deluxe Edition",
    type: "audio",
    thumbnail: "/erigga/albums/the-erigma-ii-cover.jpeg",
    duration: "52:18",
    tier: "elder",
    description: "Extended version with bonus tracks and unreleased material",
    releaseDate: "2019",
    isExclusive: true,
  },
  {
    id: "4",
    title: "Personal Photo Collection",
    type: "image",
    thumbnail: "/erigga/photoshoots/erigga-professional-shoot.jpeg",
    size: "50 photos",
    tier: "blood_brotherhood",
    description: "Rare and personal photos from Erigga's journey",
    releaseDate: "2024",
    isExclusive: true,
  },
  {
    id: "5",
    title: "Live Performance - Warri Again",
    type: "video",
    thumbnail: "/erigga/performances/erigga-live-performance.jpeg",
    duration: "25:30",
    tier: "free",
    description: "Full live performance from Warri homecoming concert",
    releaseDate: "2023",
  },
  {
    id: "6",
    title: "Unreleased Freestyle Collection",
    type: "audio",
    thumbnail: "/erigga/studio/erigga-recording-studio.jpg",
    duration: "18:45",
    tier: "blood_brotherhood",
    description: "Exclusive unreleased freestyles and demos",
    releaseDate: "2024",
    isExclusive: true,
  },
]

const tierColors = {
  free: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  pioneer: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  elder: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  blood_brotherhood: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
}

const tierNames = {
  free: "Free",
  pioneer: "Pioneer",
  elder: "Elder",
  blood_brotherhood: "Blood Brotherhood",
}

export default function VaultPage() {
  const { user, profile, loading } = useAuth()
  const [selectedTab, setSelectedTab] = useState("all")
  const [mounted, setMounted] = useState(false)
  const { executeWithAuth, showLoginPrompt, handleLoginSuccess, handleLoginCancel } = useAuthAction()

  useEffect(() => {
    setMounted(true)
  }, [])

  const canAccessContent = (item: MediaItem) => {
    if (!user) return item.tier === "free"
    if (!profile) return item.tier === "free"
    
    const userTier = profile.subscription_tier || "grassroot"
    const tierHierarchy = ["free", "grassroot", "pioneer", "elder", "blood_brotherhood"]
    const userTierIndex = tierHierarchy.indexOf(userTier)
    const itemTierIndex = tierHierarchy.indexOf(item.tier)
    
    return userTierIndex >= itemTierIndex
  }

  const handleContentAccess = (item: MediaItem) => {
    if (canAccessContent(item)) {
      // User can access this content
      console.log("Accessing content:", item.title)
      // Here you would implement the actual content access logic
    } else {
      executeWithAuth(
        () => {
          // After login, check again if they can access
          if (canAccessContent(item)) {
            console.log("Accessing content after login:", item.title)
          } else {
            // Redirect to upgrade page
            window.location.href = "/premium"
          }
        },
        {
          title: "Premium Content",
          description: `This content requires ${tierNames[item.tier]} tier or higher. Sign in to check your access level.`,
          showToast: true
        }
      )
    }
  }

  const filteredItems = selectedTab === "all" 
    ? mockMediaItems 
    : mockMediaItems.filter(item => item.type === selectedTab)

  const freeItems = mockMediaItems.filter(item => item.tier === "free")
  const premiumItems = mockMediaItems.filter(item => item.tier !== "free")

  if (loading || !mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
              <Music className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Erigga Media Vault
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
            Access Erigga's complete collection of music, videos, and exclusive content. 
            {user ? (
              <>Your current tier: <Badge className={tierColors[profile?.subscription_tier as keyof typeof tierColors] || tierColors.free}>
                {tierNames[profile?.subscription_tier as keyof typeof tierNames] || "Grassroot"}
              </Badge></>
            ) : (
              "Sign in to unlock premium content."
            )}
          </p>

          {!user && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button asChild size="lg">
                <Link href="/signup">
                  <Crown className="mr-2 h-5 w-5" />
                  Create Account
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/login">
                  Sign In
                </Link>
              </Button>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="text-center">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{freeItems.length}</div>
              <div className="text-sm text-muted-foreground">Free Content</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{premiumItems.length}</div>
              <div className="text-sm text-muted-foreground">Premium Content</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {mockMediaItems.filter(item => item.type === "audio").length}
              </div>
              <div className="text-sm text-muted-foreground">Audio Tracks</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {mockMediaItems.filter(item => item.type === "video").length}
              </div>
              <div className="text-sm text-muted-foreground">Videos</div>
            </CardContent>
          </Card>
        </div>

        {/* Content Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="mb-8">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All Content</TabsTrigger>
            <TabsTrigger value="audio">Music</TabsTrigger>
            <TabsTrigger value="video">Videos</TabsTrigger>
            <TabsTrigger value="image">Photos</TabsTrigger>
          </TabsList>

          <TabsContent value={selectedTab} className="mt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map((item) => {
                const hasAccess = canAccessContent(item)
                
                return (
                  <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="relative">
                      {hasAccess ? (
                        <img
                          src={item.thumbnail || "/placeholder.svg"}
                          alt={item.title}
                          className="w-full h-48 object-cover"
                        />
                      ) : (
                        <BlurredContent
                          src={item.thumbnail}
                          alt={item.title}
                          className="w-full h-48 object-cover"
                          tier={item.tier}
                        />
                      )}
                      
                      <div className="absolute top-2 left-2 flex gap-2">
                        <Badge className={tierColors[item.tier]}>
                          {tierNames[item.tier]}
                        </Badge>
                        {item.isExclusive && (
                          <Badge variant="secondary">
                            <Crown className="w-3 h-3 mr-1" />
                            Exclusive
                          </Badge>
                        )}
                      </div>

                      <div className="absolute top-2 right-2">
                        {item.type === "audio" && <Music className="w-5 h-5 text-white bg-black/50 rounded p-1" />}
                        {item.type === "video" && <Video className="w-5 h-5 text-white bg-black/50 rounded p-1" />}
                        {item.type === "image" && <Image className="w-5 h-5 text-white bg-black/50 rounded p-1" />}
                      </div>

                      {!hasAccess && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <Lock className="w-8 h-8 text-white" />
                        </div>
                      )}
                    </div>

                    <CardHeader>
                      <CardTitle className="text-lg">{item.title}</CardTitle>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{item.releaseDate}</span>
                        <span>{item.duration || item.size}</span>
                      </div>
                    </CardHeader>

                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">{item.description}</p>
                      
                      <div className="flex gap-2">
                        {hasAccess ? (
                          <>
                            <Button 
                              size="sm" 
                              className="flex-1"
                              onClick={() => handleContentAccess(item)}
                            >
                              <Play className="w-4 h-4 mr-2" />
                              {item.type === "image" ? "View" : "Play"}
                            </Button>
                            <Button size="sm" variant="outline">
                              <Download className="w-4 h-4" />
                            </Button>
                          </>
                        ) : (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => handleContentAccess(item)}
                          >
                            <Lock className="w-4 h-4 mr-2" />
                            {user ? "Upgrade to Access" : "Sign In to Access"}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>
        </Tabs>

        {/* Upgrade CTA for non-premium users */}
        {user && profile?.subscription_tier === "grassroot" && (
          <Card className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">
            <CardContent className="p-8 text-center">
              <Crown className="w-12 h-12 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">Unlock Premium Content</h3>
              <p className="mb-6 opacity-90">
                Upgrade your tier to access exclusive music, behind-the-scenes videos, and rare content.
              </p>
              <Button asChild size="lg" variant="secondary">
                <Link href="/premium">
                  <Coins className="mr-2 h-5 w-5" />
                  Upgrade Now
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Sign up CTA for non-users */}
        {!user && (
          <Card className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">
            <CardContent className="p-8 text-center">
              <Crown className="w-12 h-12 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">Join the Erigga Community</h3>
              <p className="mb-6 opacity-90">
                Create your account to access exclusive content and connect with other fans.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" variant="secondary">
                  <Link href="/signup">
                    Create Free Account
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="text-white border-white hover:bg-white/10">
                  <Link href="/premium">
                    View Premium Tiers
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Login Prompt Modal */}
      <LoginPromptModal
        isOpen={showLoginPrompt}
        onClose={handleLoginCancel}
        onSuccess={handleLoginSuccess}
        title="Access Premium Content"
        description="Sign in to check your tier access and unlock exclusive content."
      />
    </div>
  )
}
