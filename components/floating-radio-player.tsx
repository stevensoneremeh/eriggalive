"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Play,
  Pause,
  X,
  Minimize2,
  Maximize2,
  Volume2,
  Radio,
  Heart,
  Zap,
  Target,
  Eye,
  Briefcase,
  MapPin,
} from "lucide-react"
import { useRadio } from "@/contexts/radio-context"
import { cn } from "@/lib/utils"

const MOOD_ICONS = {
  hustle: Briefcase,
  street: MapPin,
  love: Heart,
  pain: Target,
  victory: Zap,
  reality: Eye,
}

const MOOD_COLORS = {
  hustle: "from-green-500 to-emerald-600",
  street: "from-red-500 to-orange-600",
  love: "from-pink-500 to-rose-600",
  pain: "from-purple-500 to-indigo-600",
  victory: "from-yellow-500 to-amber-600",
  reality: "from-blue-500 to-cyan-600",
}

const MOOD_EMBEDS = {
  hustle: "https://open.spotify.com/embed/playlist/37i9dQZF1DZ06evO1P96bA?utm_source=generator&theme=0",
  street: "https://open.spotify.com/embed/playlist/37i9dQZF1DZ06evO1P96bA?utm_source=generator&theme=0",
  love: "https://open.spotify.com/embed/playlist/37i9dQZF1DZ06evO1P96bA?utm_source=generator&theme=0",
  pain: "https://open.spotify.com/embed/playlist/37i9dQZF1DZ06evO1P96bA?utm_source=generator&theme=0",
  victory: "https://open.spotify.com/embed/playlist/37i9dQZF1DZ06evO1P96bA?utm_source=generator&theme=0",
  reality: "https://open.spotify.com/embed/playlist/37i9dQZF1DZ06evO1P96bA?utm_source=generator&theme=0",
}

export function FloatingRadioPlayer() {
  const { currentMood, isPlaying, setIsPlaying, isMinimized, setIsMinimized, setCurrentMood } = useRadio()

  const [isVisible, setIsVisible] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState({ x: 20, y: 20 })

  // Show player when music is playing
  useEffect(() => {
    setIsVisible(currentMood !== null && isPlaying)
  }, [currentMood, isPlaying])

  // Don't render if not visible
  if (!isVisible || !currentMood) return null

  const MoodIcon = MOOD_ICONS[currentMood as keyof typeof MOOD_ICONS] || Radio
  const moodColor = MOOD_COLORS[currentMood as keyof typeof MOOD_COLORS] || "from-green-500 to-emerald-600"
  const embedUrl = MOOD_EMBEDS[currentMood as keyof typeof MOOD_EMBEDS]

  const handleClose = () => {
    setIsPlaying(false)
    setCurrentMood(null)
    setIsVisible(false)
  }

  const handleMinimize = () => {
    setIsMinimized(!isMinimized)
  }

  return (
    <div
      className={cn(
        "fixed z-50 transition-all duration-300 ease-in-out",
        isMinimized ? "bottom-4 right-4" : "bottom-4 right-4",
        isDragging ? "cursor-grabbing" : "cursor-grab",
      )}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
      }}
    >
      <Card
        className={cn(
          "bg-black/95 backdrop-blur-md border-green-500/30 shadow-2xl transition-all duration-300",
          isMinimized ? "w-16 h-16" : "w-80 h-auto",
        )}
      >
        {isMinimized ? (
          // Minimized View
          <CardContent className="p-0 w-full h-full flex items-center justify-center relative">
            <div
              className={cn("w-full h-full rounded-lg bg-gradient-to-br flex items-center justify-center", moodColor)}
            >
              <MoodIcon className="h-8 w-8 text-white" />
            </div>

            {/* Expand Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute -top-2 -right-2 h-6 w-6 bg-green-500 hover:bg-green-600 text-black rounded-full"
              onClick={handleMinimize}
            >
              <Maximize2 className="h-3 w-3" />
            </Button>

            {/* Playing Indicator */}
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          </CardContent>
        ) : (
          // Expanded View
          <CardContent className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div
                  className={cn("w-8 h-8 rounded-full bg-gradient-to-br flex items-center justify-center", moodColor)}
                >
                  <MoodIcon className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm">{currentMood.toUpperCase()} MODE</h3>
                  <Badge className="bg-green-500 text-black text-xs">LIVE</Badge>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-gray-400 hover:text-white"
                  onClick={handleMinimize}
                >
                  <Minimize2 className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-gray-400 hover:text-red-500"
                  onClick={handleClose}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Spotify Embed */}
            <div className="w-full h-32 rounded-lg overflow-hidden bg-gray-900 mb-4">
              <iframe
                src={embedUrl}
                width="100%"
                height="100%"
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                className="rounded-lg"
                title={`Erigga Radio - ${currentMood} Mood`}
              />
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-green-500 hover:bg-green-500/20"
                  onClick={() => setIsPlaying(!isPlaying)}
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white">
                  <Volume2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-1 text-xs text-gray-400">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                Erigga Radio
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
