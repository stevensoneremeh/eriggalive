"use client"

import { useState, useRef, useEffect } from "react"
import { Volume2, VolumeX, Play, Pause, X, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"

const SAMPLE_LYRICS = [
  "Lyric 1",
  "Lyric 2",
  "Lyric 3",
  // Add more lyrics here
]

interface EriggaRadioProps {
  className?: string
}

export function EriggaRadio({ className = "" }: EriggaRadioProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [isAnimationPaused, setIsAnimationPaused] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [currentLyricIndex, setCurrentLyricIndex] = useState(0)
  const [showControls, setShowControls] = useState(false)
  const [audioLoaded, setAudioLoaded] = useState(false)

  const audioRef = useRef<HTMLAudioElement>(null)
  const lyricIntervalRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleCanPlay = () => {
      setAudioLoaded(true)
      // Auto-start playing (muted) when audio is ready
      audio.play().catch(console.error)
      setIsPlaying(true)
    }

    const handleError = () => {
      console.error("Audio failed to load")
      setAudioLoaded(false)
    }

    const handleEnded = () => {
      setIsPlaying(false)
    }

    audio.addEventListener("canplay", handleCanPlay)
    audio.addEventListener("error", handleError)
    audio.addEventListener("ended", handleEnded)

    return () => {
      audio.removeEventListener("canplay", handleCanPlay)
      audio.removeEventListener("error", handleError)
      audio.removeEventListener("ended", handleEnded)
    }
  }, [])

  useEffect(() => {
    if (isPlaying && audioLoaded) {
      lyricIntervalRef.current = setInterval(() => {
        setCurrentLyricIndex((prev) => (prev + 1) % SAMPLE_LYRICS.length)
      }, 4000) // Change lyrics every 4 seconds
    } else {
      if (lyricIntervalRef.current) {
        clearInterval(lyricIntervalRef.current)
      }
    }

    return () => {
      if (lyricIntervalRef.current) {
        clearInterval(lyricIntervalRef.current)
      }
    }
  }, [isPlaying, audioLoaded])

  const togglePlay = async () => {
    const audio = audioRef.current
    if (!audio || !audioLoaded) return

    try {
      if (isPlaying) {
        await audio.pause()
        setIsPlaying(false)
      } else {
        await audio.play()
        setIsPlaying(true)
      }
    } catch (error) {
      console.error("Error toggling audio:", error)
    }
  }

  const toggleMute = () => {
    const audio = audioRef.current
    if (!audio) return

    audio.muted = !isMuted
    setIsMuted(!isMuted)
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
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      {/* Radio Container */}
      <div
        className={`relative group transition-all duration-300 hover:scale-105 ${
          isAnimationPaused ? "" : "animate-bounce"
        }`}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
        onTouchStart={() => setShowControls(true)}
      >
        {/* Radio GIF */}
        <div className="relative w-20 h-20 md:w-24 md:h-24">
          <Image
            src="/images/radio-man.gif"
            alt="Erigga Radio"
            fill
            className="object-contain rounded-lg shadow-lg"
            priority
            unoptimized // Allow GIF animation
          />

          {/* Status Indicator */}
          <div className="absolute -top-1 -right-1">
            <div className={`w-3 h-3 rounded-full ${isPlaying ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
          </div>
        </div>

        {/* Controls Overlay */}
        <div
          className={`absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center gap-1 transition-opacity duration-200 ${
            showControls ? "opacity-100" : "opacity-0"
          }`}
        >
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-white hover:bg-white/20"
            onClick={togglePlay}
            disabled={!audioLoaded}
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
            <RotateCcw className="h-3 w-3" />
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
      {isPlaying && audioLoaded && (
        <div className="mt-2 bg-black/80 text-white px-3 py-1 rounded-full text-xs max-w-xs overflow-hidden">
          <div className="animate-pulse">
            <div
              className="whitespace-nowrap animate-scroll"
              style={{
                animation: "scroll 15s linear infinite",
              }}
            >
              {SAMPLE_LYRICS[currentLyricIndex]}
            </div>
          </div>
        </div>
      )}

      {/* Audio Element */}
      <audio ref={audioRef} loop muted={isMuted} preload="auto" className="hidden">
        <source src="/audio/erigga-radio-sample.mp3" type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>

      {/* Custom CSS for scrolling animation */}
      <style jsx>{`
        @keyframes scroll {
          0% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(-100%);
          }
        }
        .animate-scroll {
          animation: scroll 15s linear infinite;
        }
      `}</style>
    </div>
  )
}

export default EriggaRadio
