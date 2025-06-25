"use client"

import { useState, useEffect, useRef } from "react"
import { Volume2, VolumeX, Pause, Play, X, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface EriggaRadioProps {
  className?: string
}

const sampleLyrics = [
  "🎵 Welcome to Erigga Radio - Your home for the hottest beats",
  "🔥 Paper Boi in the building with that street wisdom",
  "💯 From Warri to the world - we keep it real",
  "🎤 Erigga Live bringing you exclusive content 24/7",
  "⚡ The movement never stops - join the community",
  "🌟 New music, behind the scenes, and more coming soon",
  "🎶 This is your soundtrack to the streets",
]

export function EriggaRadio({ className }: EriggaRadioProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [isMuted, setIsMuted] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isAnimationPaused, setIsAnimationPaused] = useState(false)
  const [currentLyricIndex, setCurrentLyricIndex] = useState(0)
  const [audioLoaded, setAudioLoaded] = useState(false)
  const [showControls, setShowControls] = useState(false)

  const audioRef = useRef<HTMLAudioElement>(null)
  const lyricIntervalRef = useRef<NodeJS.Timeout>()

  // Initialize audio
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleCanPlay = () => {
      setAudioLoaded(true)
      // Auto-start playing (muted for browser compliance)
      audio.play().catch(console.error)
      setIsPlaying(true)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      // Loop the audio
      audio.currentTime = 0
      audio.play().catch(console.error)
      setIsPlaying(true)
    }

    const handleError = () => {
      setAudioLoaded(false)
      setIsPlaying(false)
    }

    audio.addEventListener("canplay", handleCanPlay)
    audio.addEventListener("ended", handleEnded)
    audio.addEventListener("error", handleError)

    return () => {
      audio.removeEventListener("canplay", handleCanPlay)
      audio.removeEventListener("ended", handleEnded)
      audio.removeEventListener("error", handleError)
    }
  }, [])

  // Lyrics rotation
  useEffect(() => {
    if (!audioLoaded || !isPlaying) {
      if (lyricIntervalRef.current) {
        clearInterval(lyricIntervalRef.current)
      }
      return
    }

    lyricIntervalRef.current = setInterval(() => {
      setCurrentLyricIndex((prev) => (prev + 1) % sampleLyrics.length)
    }, 4000) // Change lyrics every 4 seconds

    return () => {
      if (lyricIntervalRef.current) {
        clearInterval(lyricIntervalRef.current)
      }
    }
  }, [audioLoaded, isPlaying])

  const toggleMute = () => {
    const audio = audioRef.current
    if (!audio) return

    const newMutedState = !isMuted
    setIsMuted(newMutedState)
    audio.muted = newMutedState
  }

  const togglePlayPause = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
    } else {
      audio.play().catch(console.error)
      setIsPlaying(true)
    }
  }

  const toggleAnimation = () => {
    setIsAnimationPaused(!isAnimationPaused)
  }

  const hideRadio = () => {
    setIsVisible(false)
    const audio = audioRef.current
    if (audio) {
      audio.pause()
      setIsPlaying(false)
    }
  }

  if (!isVisible) return null

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50 transition-all duration-300 ease-in-out",
        "hover:scale-105 group",
        className,
      )}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Audio Element */}
      <audio ref={audioRef} src="/audio/erigga-radio-sample.mp3" muted={isMuted} loop preload="auto" />

      {/* Main Radio Container */}
      <div className="relative">
        {/* Radio GIF */}
        <div
          className={cn(
            "relative w-24 h-24 md:w-32 md:h-32 transition-all duration-300",
            isAnimationPaused && "animate-pulse",
            !isAnimationPaused && isPlaying && "animate-bounce",
          )}
        >
          <img
            src="/images/radio-man.gif"
            alt="Erigga Radio"
            className={cn("w-full h-full object-contain rounded-lg shadow-lg", isAnimationPaused && "grayscale")}
            style={{
              animationPlayState: isAnimationPaused ? "paused" : "running",
            }}
          />

          {/* Status Indicator */}
          <div
            className={cn(
              "absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white",
              isPlaying && !isMuted ? "bg-green-500 animate-pulse" : "bg-red-500",
            )}
          />
        </div>

        {/* Controls Overlay */}
        <div
          className={cn(
            "absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center gap-1 transition-opacity duration-200",
            showControls ? "opacity-100" : "opacity-0 pointer-events-none",
          )}
        >
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-white hover:bg-white/20"
            onClick={togglePlayPause}
            aria-label={isPlaying ? "Pause radio" : "Play radio"}
          >
            {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
          </Button>

          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-white hover:bg-white/20"
            onClick={toggleMute}
            aria-label={isMuted ? "Unmute radio" : "Mute radio"}
          >
            {isMuted ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
          </Button>

          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-white hover:bg-white/20"
            onClick={toggleAnimation}
            aria-label={isAnimationPaused ? "Resume animation" : "Pause animation"}
          >
            <Settings className="h-3 w-3" />
          </Button>

          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-white hover:bg-white/20"
            onClick={hideRadio}
            aria-label="Close radio"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Lyrics Scroll Bar */}
      {audioLoaded && isPlaying && (
        <div
          className={cn(
            "absolute -left-2 top-1/2 -translate-y-1/2 -translate-x-full",
            "w-48 md:w-64 bg-gradient-to-r from-brand-teal to-brand-lime",
            "text-white text-xs md:text-sm font-medium py-2 px-3 rounded-l-full",
            "shadow-lg border border-white/20",
            "transition-all duration-300 ease-in-out",
          )}
        >
          <div
            className="whitespace-nowrap animate-pulse"
            key={currentLyricIndex} // Force re-render for animation
          >
            <div className="animate-marquee">{sampleLyrics[currentLyricIndex]}</div>
          </div>
        </div>
      )}

      {/* Mobile-specific adjustments */}
      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        
        .animate-marquee {
          animation: marquee 8s linear infinite;
        }
        
        @media (max-width: 768px) {
          .animate-marquee {
            animation-duration: 6s;
          }
        }
      `}</style>
    </div>
  )
}
