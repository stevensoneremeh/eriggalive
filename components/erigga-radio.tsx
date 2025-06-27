"use client"

import { useState, useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Play, Pause, Volume2, VolumeX, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface EriggaRadioProps {
  className?: string
}

const radioLyrics = [
  "🎵 Paper Boi in the building, Warri to the world! 🎵",
  "🎤 Street Chronicles playing live on Erigga Radio 🎤",
  "🔥 The Erigma himself bringing you the hottest tracks 🔥",
  "📻 Your number one source for authentic street music 📻",
  "🎶 From the streets to your speakers - Erigga Radio 🎶",
  "⚡ Non-stop bangers, 24/7 on your favorite station ⚡",
  "🎯 Real music for real people - Stay tuned! 🎯",
]

export function EriggaRadio({ className }: EriggaRadioProps) {
  const pathname = usePathname()
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [currentLyric, setCurrentLyric] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [volume, setVolume] = useState(0.7)
  const [showControls, setShowControls] = useState(false)

  // Only show on home page
  const shouldShow = pathname === "/" && isVisible

  // Rotate lyrics every 8 seconds
  useEffect(() => {
    if (!shouldShow) return

    const interval = setInterval(() => {
      setCurrentLyric((prev) => (prev + 1) % radioLyrics.length)
    }, 8000)

    return () => clearInterval(interval)
  }, [shouldShow])

  // Auto-play when component mounts (respects browser policies)
  useEffect(() => {
    if (!shouldShow || !audioRef.current) return

    const audio = audioRef.current
    audio.volume = volume

    const handleCanPlay = () => {
      setIsLoading(false)
      // Try to auto-play (may be blocked by browser)
      audio
        .play()
        .then(() => {
          setIsPlaying(true)
        })
        .catch(() => {
          // Auto-play blocked, user needs to interact first
          setIsPlaying(false)
        })
    }

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleError = () => {
      setIsLoading(false)
      setIsPlaying(false)
    }

    audio.addEventListener("canplay", handleCanPlay)
    audio.addEventListener("play", handlePlay)
    audio.addEventListener("pause", handlePause)
    audio.addEventListener("error", handleError)

    return () => {
      audio.removeEventListener("canplay", handleCanPlay)
      audio.removeEventListener("play", handlePlay)
      audio.removeEventListener("pause", handlePause)
      audio.removeEventListener("error", handleError)
    }
  }, [shouldShow, volume])

  const togglePlay = async () => {
    if (!audioRef.current) return

    try {
      if (isPlaying) {
        await audioRef.current.pause()
      } else {
        await audioRef.current.play()
      }
    } catch (error) {
      console.error("Audio playback error:", error)
    }
  }

  const toggleMute = () => {
    if (!audioRef.current) return

    const newMutedState = !isMuted
    audioRef.current.muted = newMutedState
    setIsMuted(newMutedState)
  }

  const handleClose = () => {
    if (audioRef.current) {
      audioRef.current.pause()
    }
    setIsVisible(false)
  }

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized)
  }

  if (!shouldShow) return null

  return (
    <div
      className={cn(
        "fixed bottom-4 left-4 z-50 transition-all duration-300 ease-in-out",
        isMinimized ? "w-20 h-20" : "w-80 h-24",
        className,
      )}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
      role="region"
      aria-label="Erigga Radio Player"
    >
      {/* Audio Element */}
      <audio ref={audioRef} loop preload="auto" crossOrigin="anonymous">
        <source src="/audio/erigga-radio-stream.mp3" type="audio/mpeg" />
        <source src="https://www.soundjay.com/misc/sounds/bell-ringing-05.wav" type="audio/wav" />
        Your browser does not support the audio element.
      </audio>

      {/* Radio Widget */}
      <div
        className={cn(
          "relative bg-gradient-to-br from-orange-500/20 to-red-500/20 backdrop-blur-sm",
          "border border-orange-500/30 rounded-2xl shadow-2xl overflow-hidden",
          "transition-all duration-300 ease-in-out hover:shadow-orange-500/20",
          isMinimized ? "p-2" : "p-4",
        )}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-transparent" />

        {/* Main Content */}
        <div className="relative flex items-center space-x-3">
          {/* Radio GIF */}
          <div className="relative flex-shrink-0">
            <img
              src="/images/radio-man.gif"
              alt="Erigga Radio"
              className={cn(
                "rounded-lg transition-all duration-300",
                isMinimized ? "w-12 h-12" : "w-16 h-16",
                isPlaying && "animate-pulse",
              )}
            />

            {/* Playing Indicator */}
            {isPlaying && !isMinimized && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse">
                <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-75" />
              </div>
            )}
          </div>

          {/* Content Area */}
          {!isMinimized && (
            <div className="flex-1 min-w-0">
              {/* Title */}
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-bold text-orange-500 truncate">Erigga Radio</h3>
                {isLoading && <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />}
              </div>

              {/* Scrolling Lyrics */}
              <div className="relative h-5 overflow-hidden bg-black/20 rounded-md">
                <div
                  className="absolute whitespace-nowrap text-xs text-white/90 animate-marquee"
                  style={{
                    animation: "marquee 15s linear infinite",
                  }}
                >
                  {radioLyrics[currentLyric]}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div
          className={cn(
            "absolute top-2 right-2 flex items-center space-x-1 transition-all duration-200",
            showControls || isMinimized ? "opacity-100" : "opacity-0 md:opacity-0",
            "md:opacity-0 md:group-hover:opacity-100",
          )}
        >
          {/* Mobile always shows controls, desktop shows on hover */}
          <div className="flex items-center space-x-1 md:hidden">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-white/80 hover:text-white hover:bg-white/20"
              onClick={togglePlay}
              aria-label={isPlaying ? "Pause radio" : "Play radio"}
            >
              {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-white/80 hover:text-white hover:bg-white/20"
              onClick={toggleMute}
              aria-label={isMuted ? "Unmute radio" : "Mute radio"}
            >
              {isMuted ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
            </Button>
          </div>

          {/* Desktop controls (show on hover) */}
          <div className="hidden md:flex items-center space-x-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-white/80 hover:text-white hover:bg-white/20"
              onClick={togglePlay}
              aria-label={isPlaying ? "Pause radio" : "Play radio"}
            >
              {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-white/80 hover:text-white hover:bg-white/20"
              onClick={toggleMute}
              aria-label={isMuted ? "Unmute radio" : "Mute radio"}
            >
              {isMuted ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-white/80 hover:text-red-400 hover:bg-red-500/20"
              onClick={handleClose}
              aria-label="Close radio"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Click to expand when minimized */}
      {isMinimized && (
        <button className="absolute inset-0 w-full h-full" onClick={toggleMinimize} aria-label="Expand Erigga Radio" />
      )}
    </div>
  )
}

// Add custom CSS for marquee animation
const style = `
  @keyframes marquee {
    0% { transform: translateX(100%); }
    100% { transform: translateX(-100%); }
  }
  
  .animate-marquee {
    animation: marquee 15s linear infinite;
  }
`

// Inject styles
if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style")
  styleSheet.textContent = style
  document.head.appendChild(styleSheet)
}
