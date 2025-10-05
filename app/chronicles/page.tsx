"use client"

<<<<<<< HEAD
import { AuthGuard } from "@/components/auth-guard"
import { useAuth } from "@/contexts/auth-context"
import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Play, Clock, Star, Calendar, MapPin, Music, Camera, Mic } from "lucide-react"

interface ChronicleItem {
  id: string
  title: string
  description: string
  content: string
  type: "story" | "documentary" | "interview" | "behind_scenes"
  thumbnail_url: string
  duration?: number
  date: string
  location?: string
  featured: boolean
  tags: string[]
}

export default function ChroniclesPage() {
  const { user, profile } = useAuth()
  const [chronicles, setChronicles] = useState<ChronicleItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedType, setSelectedType] = useState<string>("all")

  useEffect(() => {
    // Mock data for chronicles
    const mockChronicles: ChronicleItem[] = [
      {
        id: "1",
        title: "The Beginning: From Warri to Lagos",
        description: "Erigga's journey from the streets of Warri to becoming a household name in Nigerian hip-hop.",
        content: "Born and raised in Warri, Delta State, Erigga's story is one of determination and raw talent...",
        type: "story",
        thumbnail_url: "/erigga/early-career/erigga-airport-journey.jpeg",
        date: "2012-01-15",
        location: "Warri, Delta State",
        featured: true,
        tags: ["origin", "warri", "early-career"],
      },
      {
        id: "2",
        title: "Studio Sessions: Creating The Erigma",
        description: "Behind the scenes footage of recording the breakthrough album 'The Erigma'.",
        content: "The making of The Erigma was a pivotal moment in Erigga's career...",
        type: "behind_scenes",
        thumbnail_url: "/erigga/studio/erigga-recording-studio.jpeg",
        duration: 1800,
        date: "2012-06-20",
        location: "Lagos, Nigeria",
        featured: false,
        tags: ["studio", "album", "the-erigma"],
      },
      {
        id: "3",
        title: "Award Night: Recognition and Success",
        description: "Erigga's first major award win and what it meant for his career.",
        content: "The night everything changed - receiving recognition from the industry...",
        type: "documentary",
        thumbnail_url: "/erigga/awards/erigga-award-ceremony.jpeg",
        duration: 2400,
        date: "2015-12-10",
        location: "Lagos, Nigeria",
        featured: true,
        tags: ["awards", "recognition", "success"],
      },
      {
        id: "4",
        title: "Radio Interview: The Real Erigga",
        description: "An intimate conversation about life, music, and staying authentic.",
        content: "In this candid interview, Erigga opens up about his journey...",
        type: "interview",
        thumbnail_url: "/erigga/media/erigga-radio-interview.jpeg",
        duration: 3600,
        date: "2019-03-15",
        location: "Lagos, Nigeria",
        featured: false,
        tags: ["interview", "personal", "authentic"],
      },
      {
        id: "5",
        title: "Live Performance: Energy and Connection",
        description: "Capturing the electric atmosphere of Erigga's live performances.",
        content: "The stage is where Erigga truly comes alive, connecting with fans...",
        type: "documentary",
        thumbnail_url: "/erigga/performances/erigga-live-performance.jpeg",
        duration: 1200,
        date: "2020-08-22",
        location: "Port Harcourt, Nigeria",
        featured: false,
        tags: ["live", "performance", "fans"],
      },
    ]

    setChronicles(mockChronicles)
    setLoading(false)
  }, [])

  const filteredChronicles = chronicles.filter((item) => {
    return selectedType === "all" || item.type === selectedType
  })

  const featuredChronicles = chronicles.filter((item) => item.featured)

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "story":
        return <BookOpen className="w-4 h-4" />
      case "documentary":
        return <Camera className="w-4 h-4" />
      case "interview":
        return <Mic className="w-4 h-4" />
      case "behind_scenes":
        return <Music className="w-4 h-4" />
      default:
        return <BookOpen className="w-4 h-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "story":
        return "bg-blue-100 text-blue-800"
      case "documentary":
        return "bg-green-100 text-green-800"
      case "interview":
        return "bg-purple-100 text-purple-800"
      case "behind_scenes":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    return `${mins} min`
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Erigga Chronicles</h1>
            <p className="text-gray-600 dark:text-gray-300">
              Follow Erigga's journey through exclusive stories, documentaries, and behind-the-scenes content
            </p>
          </div>

          {/* Featured Section */}
          {featuredChronicles.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Featured Stories</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {featuredChronicles.map((item) => (
                  <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="relative">
                      <div className="aspect-video bg-gray-200 dark:bg-gray-700">
                        <img
                          src={item.thumbnail_url || "/placeholder.svg"}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-yellow-100 text-yellow-800">
                          <Star className="w-3 h-3 mr-1" />
                          Featured
                        </Badge>
                      </div>
                      {item.duration && (
                        <div className="absolute bottom-4 right-4 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {formatDuration(item.duration)}
                        </div>
                      )}
                    </div>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getTypeColor(item.type)}>
                          {getTypeIcon(item.type)}
                          <span className="ml-1 capitalize">{item.type.replace("_", " ")}</span>
                        </Badge>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{item.title}</h3>
                      <p className="text-gray-600 dark:text-gray-300 mb-4">{item.description}</p>
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {new Date(item.date).toLocaleDateString()}
                        </span>
                        {item.location && (
                          <span className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {item.location}
                          </span>
                        )}
                      </div>
                      <Button className="w-full">
                        <Play className="w-4 h-4 mr-2" />
                        {item.duration ? "Watch" : "Read"} Story
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* All Chronicles */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">All Chronicles</h2>
              <div className="flex gap-2">
                <Button
                  variant={selectedType === "all" ? "default" : "outline"}
                  onClick={() => setSelectedType("all")}
                  size="sm"
                >
                  All
                </Button>
                <Button
                  variant={selectedType === "story" ? "default" : "outline"}
                  onClick={() => setSelectedType("story")}
                  size="sm"
                >
                  <BookOpen className="w-4 h-4 mr-1" />
                  Stories
                </Button>
                <Button
                  variant={selectedType === "documentary" ? "default" : "outline"}
                  onClick={() => setSelectedType("documentary")}
                  size="sm"
                >
                  <Camera className="w-4 h-4 mr-1" />
                  Documentaries
                </Button>
                <Button
                  variant={selectedType === "interview" ? "default" : "outline"}
                  onClick={() => setSelectedType("interview")}
                  size="sm"
                >
                  <Mic className="w-4 h-4 mr-1" />
                  Interviews
                </Button>
                <Button
                  variant={selectedType === "behind_scenes" ? "default" : "outline"}
                  onClick={() => setSelectedType("behind_scenes")}
                  size="sm"
                >
                  <Music className="w-4 h-4 mr-1" />
                  Behind Scenes
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                <p className="text-gray-600 dark:text-gray-300 mt-2">Loading chronicles...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredChronicles.map((item) => (
                  <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="relative">
                      <div className="aspect-video bg-gray-200 dark:bg-gray-700">
                        <img
                          src={item.thumbnail_url || "/placeholder.svg"}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="absolute top-2 left-2">
                        <Badge className={getTypeColor(item.type)}>
                          {getTypeIcon(item.type)}
                          <span className="ml-1 capitalize">{item.type.replace("_", " ")}</span>
                        </Badge>
                      </div>
                      {item.duration && (
                        <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {formatDuration(item.duration)}
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">{item.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">{item.description}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                        <span className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {new Date(item.date).toLocaleDateString()}
                        </span>
                        {item.location && (
                          <span className="flex items-center">
                            <MapPin className="w-3 h-3 mr-1" />
                            {item.location}
                          </span>
                        )}
                      </div>
                      <Button size="sm" className="w-full">
                        <Play className="w-4 h-4 mr-2" />
                        {item.duration ? "Watch" : "Read"}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
=======
import { useAuth } from "@/contexts/auth-context"

interface SeriesWithEpisodes {
  id: string
  title: string
  episodes: any[]
}

export default function ChroniclesPage() {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Please log in to view the chronicles.</p>
        </div>
      </div>
    )
  }

  // Replace with your real chronicles data logic
  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Chronicles</h1>
      <p>Welcome, {profile?.full_name || user.email}! Here you will see exclusive chronicles content.</p>
      {/* Render chronicles here */}
    </div>
>>>>>>> new
  )
}
