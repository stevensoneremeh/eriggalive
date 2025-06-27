"use client"

import { useState, useRef, useEffect } from "react"
import { Play, Pause, Volume2, VolumeX, Minimize2, Maximize2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { usePathname } from "next/navigation"
import Image from "next/image"

const RADIO_LYRICS = [
  "🎵 Welcome to Erigga Radio - Your home for the hottest beats",
  "🔥 Now playing the latest from the Paper Boi himself",
  "📻 Stay tuned for exclusive tracks and behind-the-scenes content",
  "🎤 Erigga Radio - Where the streets meet the beats",
  "⚡ Non-stop music from Warri's finest",
  "🎶 Your daily dose of authentic Nigerian hip-hop",
  "🌟 Erigga Radio - Broadcasting live from the heart of the streets",
]

export function EriggaRadio() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [currentLyric, setCurrentLyric] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const pathname = usePathname()

  // Only show on home page
  const shouldShow = pathname === "/" && isVisible

  // Rotate lyrics every 8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentLyric((prev) => (prev + 1) % RADIO_LYRICS.length)
    }, 8000)
    return () => clearInterval(interval)
  }, [])

  // Auto-play when component mounts (with user interaction)
  useEffect(() => {
    if (shouldShow && audioRef.current) {
      // Set volume to 70%
      audioRef.current.volume = 0.7

      // Try to auto-play (will only work after user interaction)
      const playPromise = audioRef.current.play()
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true)
          })
          .catch(() => {
            // Auto-play failed, user needs to click play
            setIsPlaying(false)
          })
      }
    }
  }, [shouldShow])

  const togglePlay = async () => {
    if (!audioRef.current) return

    setIsLoading(true)
    try {
      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
      } else {
        await audioRef.current.play()
        setIsPlaying(true)
      }
    } catch (error) {
      console.error("Audio playback error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleMute = () => {
    if (!audioRef.current) return

    audioRef.current.muted = !isMuted
    setIsMuted(!isMuted)
  }

  const closeRadio = () => {
    if (audioRef.current) {
      audioRef.current.pause()
    }
    setIsVisible(false)
    setIsPlaying(false)
  }

  if (!shouldShow) return null

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-sm">
      <Card className="bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-2xl border-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-3 bg-black/20">
          <div className="flex items-center gap-2">
            <div className="relative w-8 h-8 rounded-full overflow-hidden">
              <Image src="/images/radio-man.gif" alt="Radio DJ" fill className="object-cover" unoptimized />
            </div>
            <span className="font-bold text-sm">Erigga Radio</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="h-6 w-6 p-0 text-white hover:bg-white/20"
            >
              {isMinimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={closeRadio} className="h-6 w-6 p-0 text-white hover:bg-white/20">
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Main Content */}
        {!isMinimized && (
          <div className="p-4 space-y-3">
            {/* Scrolling Lyrics */}
            <div className="h-12 overflow-hidden bg-black/20 rounded-lg flex items-center px-3">
              <div className="whitespace-nowrap animate-marquee text-sm font-medium">{RADIO_LYRICS[currentLyric]}</div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMute}
                className="h-10 w-10 p-0 text-white hover:bg-white/20 rounded-full"
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </Button>

              <Button
                variant="ghost"
                size="lg"
                onClick={togglePlay}
                disabled={isLoading}
                className="h-12 w-12 p-0 text-white hover:bg-white/20 rounded-full bg-white/10"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isLoading ? (
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : isPlaying ? (
                  <Pause className="h-6 w-6" />
                ) : (
                  <Play className="h-6 w-6 ml-0.5" />
                )}
              </Button>
            </div>

            {/* Live Indicator */}
            <div className="flex items-center justify-center gap-2 text-xs">
              <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
              <span className="font-medium">LIVE</span>
            </div>
          </div>
        )}

        {/* Minimized View */}
        {isMinimized && (
          <div className="p-2 flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={togglePlay}
              className="h-8 w-8 p-0 text-white hover:bg-white/20 rounded-full"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
          </div>
        )}
      </Card>

      {/* Audio Element */}
      <audio
        ref={audioRef}
        loop
        preload="metadata"
        onLoadStart={() => setIsLoading(true)}
        onCanPlay={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false)
          console.error("Audio failed to load")
        }}
      >
        <source src="/audio/erigga-radio-stream.mp3" type="audio/mpeg" />
        <source src="/placeholder.svg?height=1&width=1" type="audio/wav" />
        Your browser does not support the audio element.
      </audio>

      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          animation: marquee 15s linear infinite;
        }
      `}</style>
    </div>
  )
}
