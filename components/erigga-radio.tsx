"use client"

import { useState, useRef, useEffect } from "react"
import { usePathname } from "next/navigation"
import { Play, Pause, Volume2, VolumeX, X, Radio } from "lucide-react"
import { cn } from "@/lib/utils"

interface RadioLyrics {
  id: string
  text: string
  song_title: string
  artist: string
}

const defaultLyrics: RadioLyrics[] = [
  {
    id: "1",
    text: "Welcome to Erigga Radio - Your home for the best Afrobeats and Nigerian hip-hop",
    song_title: "Station ID",
    artist: "Erigga Radio",
  },
  {
    id: "2",
    text: "Paper Boi dey here, we dey run the streets with pure fire lyrics",
    song_title: "Paper Boi",
    artist: "Erigga",
  },
  {
    id: "3",
    text: "From Warri to Lagos, we bringing you that authentic street sound",
    song_title: "Street Anthem",
    artist: "Erigga",
  },
  {
    id: "4",
    text: "Erigga Radio - Where the streets meet the beats, 24/7 non-stop music",
    song_title: "Station Promo",
    artist: "Erigga Radio",
  },
]

export default function EriggaRadio() {
  const pathname = usePathname()
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [currentLyricIndex, setCurrentLyricIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Only show on home page
  const shouldShow = pathname === "/" && isVisible

  // Rotate lyrics every 8 seconds
  useEffect(() => {
    if (!shouldShow) return

    const interval = setInterval(() => {
      setCurrentLyricIndex((prev) => (prev + 1) % defaultLyrics.length)
    }, 8000)

    return () => clearInterval(interval)
  }, [shouldShow])

  // Auto-play audio when component mounts (only on home page)
  useEffect(() => {
    if (shouldShow && audioRef.current) {
      const audio = audioRef.current
      audio.volume = 0.7 // Set default volume to 70%

      // Try to auto-play (may be blocked by browser)
      const playPromise = audio.play()
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true)
            setIsLoading(false)
          })
          .catch(() => {
            // Auto-play was prevented
            setIsPlaying(false)
            setIsLoading(false)
          })
      }
    }
  }, [shouldShow])

  const togglePlayPause = async () => {
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
      setIsPlaying(false)
    }
    setIsVisible(false)
  }

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed)
  }

  if (!shouldShow) return null

  const currentLyric = defaultLyrics[currentLyricIndex]

  return (
    <>
      {/* Audio element */}
      <audio
        ref={audioRef}
        loop
        preload="none"
        onLoadStart={() => setIsLoading(true)}
        onCanPlay={() => setIsLoading(false)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onError={() => {
          setIsLoading(false)
          setIsPlaying(false)
        }}
      >
        <source
          src="https://yor5bfsajnljnrjg.public.blob.vercel-storage.com/erigga-radio-stream-qGVtALspqbLlH9VQJgg93RVa3Qs7Kb.mp3"
          type="audio/mpeg"
        />
        Your browser does not support the audio element.
      </audio>

      {/* Radio Widget */}
      <div
        className={cn(
          "fixed bottom-4 left-4 z-50 transition-all duration-500 ease-in-out",
          "transform hover:scale-105",
          isCollapsed ? "translate-y-16" : "translate-y-0",
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Main Radio Container */}
        <div
          className={cn(
            "relative bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl shadow-2xl",
            "border-4 border-orange-700 overflow-hidden",
            "transition-all duration-300 ease-in-out",
            isCollapsed ? "w-16 h-16" : "w-80 h-24 md:w-96 md:h-28",
          )}
        >
          {/* Radio GIF */}
          <div
            className={cn("absolute left-2 top-2 transition-all duration-300", isCollapsed ? "w-12 h-12" : "w-20 h-20")}
          >
            <img
              src="/images/radio-man.gif"
              alt="Erigga Radio"
              className="w-full h-full object-contain rounded-lg"
              loading="lazy"
            />
          </div>

          {/* Radio Content */}
          {!isCollapsed && (
            <div className="ml-24 pr-4 py-2 h-full flex flex-col justify-between">
              {/* Station Info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Radio className="w-4 h-4 text-white" />
                  <span className="text-white font-bold text-sm">Erigga Radio</span>
                </div>

                {/* Controls - Show on hover or mobile */}
                <div
                  className={cn(
                    "flex items-center space-x-1 transition-opacity duration-200",
                    isHovered || window.innerWidth < 768 ? "opacity-100" : "opacity-0 md:opacity-0",
                  )}
                >
                  <button
                    onClick={togglePlayPause}
                    disabled={isLoading}
                    className="p-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                    aria-label={isPlaying ? "Pause radio" : "Play radio"}
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : isPlaying ? (
                      <Pause className="w-4 h-4 text-white" />
                    ) : (
                      <Play className="w-4 h-4 text-white" />
                    )}
                  </button>

                  <button
                    onClick={toggleMute}
                    className="p-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                    aria-label={isMuted ? "Unmute radio" : "Mute radio"}
                  >
                    {isMuted ? <VolumeX className="w-4 h-4 text-white" /> : <Volume2 className="w-4 h-4 text-white" />}
                  </button>

                  <button
                    onClick={closeRadio}
                    className="p-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                    aria-label="Close radio"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>

              {/* Scrolling Lyrics */}
              <div className="relative overflow-hidden bg-black/20 rounded-lg px-2 py-1">
                <div
                  className="whitespace-nowrap animate-marquee text-white text-xs font-medium"
                  key={currentLyricIndex} // Force re-render for animation restart
                >
                  <span className="inline-block">
                    ♪ {currentLyric.text} - {currentLyric.song_title} by {currentLyric.artist} ♪
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Collapse/Expand Button */}
          <button
            onClick={toggleCollapse}
            className={cn(
              "absolute -top-2 -right-2 w-6 h-6 bg-orange-600 rounded-full",
              "flex items-center justify-center text-white text-xs font-bold",
              "hover:bg-orange-700 transition-colors shadow-lg border-2 border-white",
            )}
            aria-label={isCollapsed ? "Expand radio" : "Collapse radio"}
          >
            {isCollapsed ? "+" : "−"}
          </button>

          {/* Playing Indicator */}
          {isPlaying && !isCollapsed && (
            <div className="absolute top-1 right-1">
              <div className="flex space-x-1">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 bg-green-400 rounded-full animate-pulse"
                    style={{
                      height: "8px",
                      animationDelay: `${i * 0.2}s`,
                      animationDuration: "1s",
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Mobile-specific controls */}
        <div className="md:hidden mt-2 flex justify-center space-x-2">
          {!isCollapsed && (
            <>
              <button
                onClick={togglePlayPause}
                disabled={isLoading}
                className="p-2 rounded-full bg-orange-600 hover:bg-orange-700 transition-colors shadow-lg"
                aria-label={isPlaying ? "Pause radio" : "Play radio"}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-5 h-5 text-white" />
                ) : (
                  <Play className="w-5 h-5 text-white" />
                )}
              </button>

              <button
                onClick={toggleMute}
                className="p-2 rounded-full bg-orange-600 hover:bg-orange-700 transition-colors shadow-lg"
                aria-label={isMuted ? "Unmute radio" : "Mute radio"}
              >
                {isMuted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  )
}
