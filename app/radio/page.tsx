"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Radio, Music, Heart, Zap, Target, Eye, Briefcase, MapPin } from "lucide-react"
import { useRadio } from "@/contexts/radio-context"
import { cn } from "@/lib/utils"

interface Mood {
  id: string
  name: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  color: string
  spotifyUrl: string
  embedUrl: string
}

const MOODS: Mood[] = [
  {
    id: "hustle",
    name: "Hustle",
    icon: Briefcase,
    description: "Grind mode activated - motivation tracks",
    color: "from-green-500 to-emerald-600",
    spotifyUrl: "https://open.spotify.com/playlist/37i9dQZF1DZ06evO1P96bA?si=Zx4F2QfyR-y3IAtlP_Do2g",
    embedUrl: "https://open.spotify.com/embed/playlist/37i9dQZF1DZ06evO1P96bA?utm_source=generator&theme=0",
  },
  {
    id: "street",
    name: "Street",
    icon: MapPin,
    description: "Raw street anthems and hood classics",
    color: "from-red-500 to-orange-600",
    spotifyUrl: "https://open.spotify.com/playlist/37i9dQZF1DZ06evO1P96bA?si=Zx4F2QfyR-y3IAtlP_Do2g",
    embedUrl: "https://open.spotify.com/embed/playlist/37i9dQZF1DZ06evO1P96bA?utm_source=generator&theme=0",
  },
  {
    id: "love",
    name: "Love",
    icon: Heart,
    description: "Smooth vibes for the heart",
    color: "from-pink-500 to-rose-600",
    spotifyUrl: "https://open.spotify.com/playlist/37i9dQZF1DZ06evO1P96bA?si=Zx4F2QfyR-y3IAtlP_Do2g",
    embedUrl: "https://open.spotify.com/embed/playlist/37i9dQZF1DZ06evO1P96bA?utm_source=generator&theme=0",
  },
  {
    id: "pain",
    name: "Pain",
    icon: Target,
    description: "Deep cuts that hit different",
    color: "from-purple-500 to-indigo-600",
    spotifyUrl: "https://open.spotify.com/playlist/37i9dQZF1DZ06evO1P96bA?si=Zx4F2QfyR-y3IAtlP_Do2g",
    embedUrl: "https://open.spotify.com/embed/playlist/37i9dQZF1DZ06evO1P96bA?utm_source=generator&theme=0",
  },
  {
    id: "victory",
    name: "Victory",
    icon: Zap,
    description: "Celebration anthems and winning tracks",
    color: "from-yellow-500 to-amber-600",
    spotifyUrl: "https://open.spotify.com/playlist/37i9dQZF1DZ06evO1P96bA?si=Zx4F2QfyR-y3IAtlP_Do2g",
    embedUrl: "https://open.spotify.com/embed/playlist/37i9dQZF1DZ06evO1P96bA?utm_source=generator&theme=0",
  },
  {
    id: "reality",
    name: "Reality",
    icon: Eye,
    description: "Truth talks and conscious rap",
    color: "from-blue-500 to-cyan-600",
    spotifyUrl: "https://open.spotify.com/playlist/37i9dQZF1DZ06evO1P96bA?si=Zx4F2QfyR-y3IAtlP_Do2g",
    embedUrl: "https://open.spotify.com/embed/playlist/37i9dQZF1DZ06evO1P96bA?utm_source=generator&theme=0",
  },
]

export default function RadioPage() {
  const { currentMood, setCurrentMood, isPlaying, setIsPlaying } = useRadio()
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null)

  useEffect(() => {
    if (currentMood) {
      const mood = MOODS.find((m) => m.id === currentMood)
      setSelectedMood(mood || null)
    }
  }, [currentMood])

  const handleMoodSelect = (mood: Mood) => {
    setSelectedMood(mood)
    setCurrentMood(mood.id)
    setIsPlaying(true)
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Radio className="h-12 w-12 text-green-500" />
              <h1 className="text-5xl font-black bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                ERIGGA RADIO
              </h1>
            </div>
            <h2 className="text-2xl font-bold text-green-500 mb-2">🎧 Pick Your Mood – Erigga Radio</h2>
            <p className="text-gray-400 text-lg">
              Street sounds for every feeling. Choose your vibe and let the music speak.
            </p>
            <Badge variant="secondary" className="mt-4 bg-red-600 text-white animate-pulse px-4 py-2">
              🔴 LIVE NOW
            </Badge>
          </div>

          {/* Mood Selector */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-12">
            {MOODS.map((mood) => {
              const Icon = mood.icon
              const isSelected = selectedMood?.id === mood.id

              return (
                <Card
                  key={mood.id}
                  className={cn(
                    "relative overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 border-2",
                    isSelected
                      ? "border-green-500 bg-green-500/10 shadow-lg shadow-green-500/20"
                      : "border-gray-800 bg-gray-900/50 hover:border-gray-600",
                  )}
                  onClick={() => handleMoodSelect(mood)}
                >
                  <CardContent className="p-6 text-center">
                    <div
                      className={cn(
                        "w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center",
                        isSelected ? "bg-green-500" : "bg-gray-800",
                      )}
                    >
                      <Icon className={cn("h-8 w-8", isSelected ? "text-black" : "text-white")} />
                    </div>

                    <h3 className={cn("text-xl font-bold mb-2", isSelected ? "text-green-500" : "text-white")}>
                      {mood.name.toUpperCase()}
                    </h3>

                    <p className="text-gray-400 text-sm">{mood.description}</p>

                    {isSelected && (
                      <div className="mt-4">
                        <Badge className="bg-green-500 text-black font-bold">NOW PLAYING</Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Spotify Player */}
          {selectedMood && (
            <Card className="bg-gray-900/80 border-green-500/30 backdrop-blur-sm">
              <CardHeader className="text-center">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br",
                      selectedMood.color,
                    )}
                  >
                    <selectedMood.icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-green-500">
                      {selectedMood.name.toUpperCase()} MODE
                    </CardTitle>
                    <CardDescription className="text-gray-400">{selectedMood.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6">
                <div className="relative w-full h-96 rounded-lg overflow-hidden bg-black">
                  <iframe
                    src={selectedMood.embedUrl}
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                    className="rounded-lg"
                    title={`Erigga Radio - ${selectedMood.name} Mood`}
                  />
                </div>

                <div className="mt-6 flex items-center justify-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-green-500 text-green-500 hover:bg-green-500 hover:text-black bg-transparent"
                    onClick={() => window.open(selectedMood.spotifyUrl, "_blank")}
                  >
                    <Music className="h-4 w-4 mr-2" />
                    Open in Spotify
                  </Button>

                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    Streaming live from the streets
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Info Cards */}
          <div className="grid md:grid-cols-2 gap-6 mt-12">
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="text-green-500">About Erigga Radio</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 mb-4">
                  Experience the raw, unfiltered sound of Nigerian street hop. From Warri to the world, Erigga Radio
                  brings you authentic vibes for every mood and moment.
                </p>
                <div className="space-y-2 text-sm text-gray-400">
                  <div>🎵 Curated playlists for every emotion</div>
                  <div>🔥 Fresh tracks updated weekly</div>
                  <div>🌍 Streaming worldwide, 24/7</div>
                  <div>💯 100% authentic street sound</div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="text-green-500">How It Works</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-gray-300">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-500 text-black rounded-full flex items-center justify-center text-sm font-bold">
                      1
                    </div>
                    <div>
                      <div className="font-semibold">Pick Your Mood</div>
                      <div className="text-sm text-gray-400">Choose from 6 carefully curated vibes</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-500 text-black rounded-full flex items-center justify-center text-sm font-bold">
                      2
                    </div>
                    <div>
                      <div className="font-semibold">Stream Instantly</div>
                      <div className="text-sm text-gray-400">High-quality Spotify integration</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-500 text-black rounded-full flex items-center justify-center text-sm font-bold">
                      3
                    </div>
                    <div>
                      <div className="font-semibold">Vibe Anywhere</div>
                      <div className="text-sm text-gray-400">Mini-player follows you across the site</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
