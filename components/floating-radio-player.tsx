"use client"

import { useState, useRef, useEffect } from "react"
import { Play, Pause, Volume2, VolumeX, Radio, Minimize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"

interface RadioStation {
  id: string
  name: string
  url: string
  genre: string
  description: string
  image: string
}

const radioStations: RadioStation[] = [
  {
    id: "erigga-live",
    name: "Erigga Live Radio",
    url: "https://stream.zeno.fm/your-stream-url",
    genre: "Hip Hop",
    description: "24/7 Erigga hits and Nigerian hip hop",
    image: "/images/radio-man.gif",
  },
  {
    id: "naija-hits",
    name: "Naija Hits",
    url: "https://stream.zeno.fm/naija-hits",
    genre: "Afrobeats",
    description: "Latest Nigerian hits",
    image: "/placeholder.jpg",
  },
]

export function FloatingRadioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState([70])
  const [currentStation, setCurrentStation] = useState(radioStations[0])
  const [isMinimized, setIsMinimized] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    audio.volume = volume[0] / 100

    const handleLoadStart = () => setIsLoading(true)
    const handleCanPlay = () => {
      setIsLoading(false)
      setError(null)
    }
    const handleError = () => {
      setIsLoading(false)
      setError("Failed to load radio stream")
      setIsPlaying(false)
    }

    audio.addEventListener("loadstart", handleLoadStart)
    audio.addEventListener("canplay", handleCanPlay)
    audio.addEventListener("error", handleError)

    return () => {
      audio.removeEventListener("loadstart", handleLoadStart)
      audio.removeEventListener("canplay", handleCanPlay)
      audio.removeEventListener("error", handleError)
    }
  }, [volume])

  const togglePlay = async () => {
    const audio = audioRef.current
    if (!audio) return

    try {
      if (isPlaying) {
        audio.pause()
        setIsPlaying(false)
      } else {
        setIsLoading(true)
        await audio.play()
        setIsPlaying(true)
        setIsLoading(false)
      }
    } catch (err) {
      console.error("Error playing audio:", err)
      setError("Failed to play radio stream")
      setIsPlaying(false)
      setIsLoading(false)
    }
  }

  const toggleMute = () => {
    const audio = audioRef.current
    if (!audio) return

    audio.muted = !isMuted
    setIsMuted(!isMuted)
  }

  const handleVolumeChange = (newVolume: number[]) => {
    setVolume(newVolume)
    const audio = audioRef.current
    if (audio) {
      audio.volume = newVolume[0] / 100
    }
  }

  const changeStation = (station: RadioStation) => {
    const audio = audioRef.current
    if (!audio) return

    const wasPlaying = isPlaying

    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
    }

    setCurrentStation(station)
    audio.src = station.url

    if (wasPlaying) {
      setTimeout(() => {
        togglePlay()
      }, 500)
    }
  }

  return (
    <>
      {/* Audio Element */}
      <audio ref={audioRef} src={currentStation.url} preload="none" crossOrigin="anonymous" />

      {/* Floating Radio Widget */}
      <div className="fixed bottom-4 right-4 z-50">
        <Card
          className={`transition-all duration-300 ${
            isMinimized ? "w-16 h-16" : "w-80 h-auto"
          } bg-background/95 backdrop-blur-sm border shadow-lg`}
        >
          {isMinimized ? (
            <div className="p-4 flex items-center justify-center">
              <Button variant="ghost" size="icon" onClick={() => setIsMinimized(false)} className="h-8 w-8">
                <Radio className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Radio className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-sm">Erigga Radio</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsMinimized(true)} className="h-6 w-6">
                  <Minimize2 className="h-3 w-3" />
                </Button>
              </div>

              {/* Current Station */}
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-muted">
                  <Image
                    src={currentStation.image || "/placeholder.svg"}
                    alt={currentStation.name}
                    fill
                    className="object-cover"
                    unoptimized={currentStation.image.endsWith(".gif")}
                  />
                  {isPlaying && (
                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm truncate">{currentStation.name}</h3>
                  <p className="text-xs text-muted-foreground truncate">{currentStation.description}</p>
                  <Badge variant="secondary" className="text-xs mt-1">
                    {currentStation.genre}
                  </Badge>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={togglePlay}
                  disabled={isLoading}
                  className="h-8 w-8 bg-transparent"
                >
                  {isLoading ? (
                    <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : isPlaying ? (
                    <Pause className="h-3 w-3" />
                  ) : (
                    <Play className="h-3 w-3" />
                  )}
                </Button>

                <Button variant="ghost" size="icon" onClick={toggleMute} className="h-8 w-8">
                  {isMuted ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                </Button>

                <div className="flex-1 px-2">
                  <Slider value={volume} onValueChange={handleVolumeChange} max={100} step={1} className="w-full" />
                </div>
              </div>

              {/* Station List */}
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Stations</p>
                {radioStations.map((station) => (
                  <button
                    key={station.id}
                    onClick={() => changeStation(station)}
                    className={`w-full text-left p-2 rounded-md text-xs transition-colors ${
                      currentStation.id === station.id ? "bg-primary/10 text-primary" : "hover:bg-muted"
                    }`}
                  >
                    <div className="font-medium">{station.name}</div>
                    <div className="text-muted-foreground">{station.genre}</div>
                  </button>
                ))}
              </div>

              {/* Error Message */}
              {error && <div className="text-xs text-destructive bg-destructive/10 p-2 rounded-md">{error}</div>}

              {/* Live Indicator */}
              {isPlaying && !error && (
                <div className="flex items-center gap-2 text-xs text-primary">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span>LIVE</span>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </>
  )
}
