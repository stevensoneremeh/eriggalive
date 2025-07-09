"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Play, Pause, Volume2, VolumeX, Radio, X } from "lucide-react"
import { cn } from "@/lib/utils"

export default function EriggaRadio() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [currentTrack, setCurrentTrack] = useState("Erigga Live Radio - 24/7 Hits")
  const audioRef = useRef<HTMLAudioElement>(null)

  // Simulated radio stream URL (replace with actual stream)
  const radioStreamUrl = "/audio/erigga-radio-stream.mp3"

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const closeRadio = () => {
    if (audioRef.current) {
      audioRef.current.pause()
    }
    setIsPlaying(false)
    setIsMinimized(true)
  }

  useEffect(() => {
    // Simulate track changes
    const trackNames = [
      "Erigga - Paper Boi",
      "Erigga - The Erigma",
      "Erigga - Before The Fame",
      "Erigga - Area To The World",
      "Erigga Live Radio - 24/7 Hits",
    ]

    const interval = setInterval(() => {
      if (isPlaying) {
        const randomTrack = trackNames[Math.floor(Math.random() * trackNames.length)]
        setCurrentTrack(randomTrack)
      }
    }, 30000) // Change track name every 30 seconds

    return () => clearInterval(interval)
  }, [isPlaying])

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsMinimized(false)}
          className="rounded-full w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg"
        >
          <Radio className="h-5 w-5" />
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-80 bg-gradient-to-r from-gray-900 to-black border-orange-500/30 shadow-2xl">
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Radio className="h-5 w-5 text-orange-500" />
                {isPlaying && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                )}
              </div>
              <span className="text-white font-semibold text-sm">Erigga Radio</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={closeRadio}
              className="text-gray-400 hover:text-white h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Now Playing */}
          <div className="mb-4">
            <div className="text-xs text-gray-400 mb-1">NOW PLAYING</div>
            <div className="text-white text-sm font-medium truncate">{currentTrack}</div>
            {isPlaying && (
              <div className="flex items-center gap-1 mt-1">
                <div className="flex gap-1">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "w-1 bg-orange-500 rounded-full animate-pulse",
                        i === 0 ? "h-2" : i === 1 ? "h-3" : i === 2 ? "h-4" : "h-2",
                      )}
                      style={{ animationDelay: `${i * 0.1}s` }}
                    />
                  ))}
                </div>
                <span className="text-xs text-orange-400 ml-2">LIVE</span>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4">
            <Button variant="ghost" size="sm" onClick={toggleMute} className="text-gray-400 hover:text-white">
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>

            <Button
              onClick={togglePlay}
              className={cn(
                "rounded-full w-12 h-12 transition-all",
                isPlaying
                  ? "bg-orange-500 hover:bg-orange-600"
                  : "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600",
              )}
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(true)}
              className="text-gray-400 hover:text-white"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </Button>
          </div>

          {/* Audio Element */}
          <audio
            ref={audioRef}
            loop
            preload="none"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          >
            <source src={radioStreamUrl} type="audio/mpeg" />
            Your browser does not support the audio element.
          </audio>
        </div>
      </Card>
    </div>
  )
}
