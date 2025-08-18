"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Play, Pause, Volume2, VolumeX, X, Radio, Lock } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"

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
  const router = useRouter()
  const { isAuthenticated, loading: authLoading } = useAuth()
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [currentLyricIndex, setCurrentLyricIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isLive, setIsLive] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  // Only show on home page
  const shouldShow = pathname === "/" && isVisible

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [])

  // Rotate lyrics every 8 seconds
  useEffect(() => {
    if (!shouldShow || !isAuthenticated) return

    const interval = setInterval(() => {
      setCurrentLyricIndex((prev) => (prev + 1) % defaultLyrics.length)
    }, 8000)

    return () => clearInterval(interval)
  }, [shouldShow, isAuthenticated])

  // Auto-play audio when component mounts (only for authenticated users)
  useEffect(() => {
    if (shouldShow && isAuthenticated && audioRef.current) {
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
  }, [shouldShow, isAuthenticated])

  const handleRadioClick = () => {
    if (!isAuthenticated) {
      router.push("/login?redirect=" + encodeURIComponent(pathname))
      return
    }
    // For authenticated users, toggle collapse or navigate to radio page
    router.push("/radio")
  }

  const togglePlayPause = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isAuthenticated || !audioRef.current) return

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

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isAuthenticated || !audioRef.current) return

    audioRef.current.muted = !isMuted
    setIsMuted(!isMuted)
  }

  const closeRadio = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
    }
    setIsVisible(false)
  }

  const toggleCollapse = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isAuthenticated) return
    setIsCollapsed(!isCollapsed)
  }

  if (!shouldShow || authLoading) return null

  const currentLyric = defaultLyrics[currentLyricIndex]

  return (
    <>
      {/* Audio element - only for authenticated users */}
      {isAuthenticated && (
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
      )}

      {/* Radio Widget */}
      <motion.div
        className={cn("fixed bottom-4 left-4 z-50 cursor-pointer", isCollapsed ? "translate-y-16" : "translate-y-0")}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleRadioClick}
        onMouseEnter={() => {
          setIsHovered(true)
          if (!isAuthenticated) setShowTooltip(true)
        }}
        onMouseLeave={() => {
          setIsHovered(false)
          setShowTooltip(false)
        }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20,
          duration: prefersReducedMotion ? 0 : undefined,
        }}
        whileHover={
          prefersReducedMotion
            ? {}
            : {
                scale: 1.05,
                transition: { duration: 0.2 },
              }
        }
        whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
      >
        {/* Live Pulse Ring - shows when radio is live */}
        <AnimatePresence>
          {isLive && isAuthenticated && (
            <motion.div
              className="absolute inset-0 rounded-2xl border-4 border-red-500"
              initial={{ scale: 1, opacity: 1 }}
              animate={{
                scale: prefersReducedMotion ? 1 : [1, 1.1, 1],
                opacity: prefersReducedMotion ? 0.8 : [1, 0.5, 1],
              }}
              exit={{ scale: 1, opacity: 0 }}
              transition={{
                duration: prefersReducedMotion ? 0 : 2,
                repeat: prefersReducedMotion ? 0 : Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            />
          )}
        </AnimatePresence>

        {/* Main Radio Container */}
        <div
          className={cn(
            "relative rounded-2xl shadow-2xl border-4 overflow-hidden transition-all duration-300 ease-in-out",
            isAuthenticated
              ? "bg-gradient-to-br from-orange-400 to-orange-600 border-orange-700"
              : "bg-gradient-to-br from-gray-400 to-gray-600 border-gray-700",
            isCollapsed ? "w-16 h-16" : "w-80 h-24 md:w-96 md:h-28",
          )}
        >
          {/* Lock Overlay for Unauthenticated Users */}
          {!isAuthenticated && (
            <motion.div
              className="absolute inset-0 bg-black/50 flex items-center justify-center z-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
            >
              <motion.div
                animate={
                  prefersReducedMotion
                    ? {}
                    : {
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0],
                      }
                }
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
              >
                <Lock className="w-8 h-8 text-white" />
              </motion.div>
            </motion.div>
          )}

          {/* Radio GIF */}
          <div
            className={cn("absolute left-2 top-2 transition-all duration-300", isCollapsed ? "w-12 h-12" : "w-20 h-20")}
          >
            <img
              src="/images/radio-man.gif"
              alt="Erigga Radio"
              className={cn(
                "w-full h-full object-contain rounded-lg transition-all duration-300",
                !isAuthenticated && "grayscale opacity-60",
              )}
              loading="lazy"
            />
          </div>

          {/* Radio Content - Only show for authenticated users when not collapsed */}
          {!isCollapsed && isAuthenticated && (
            <div className="ml-24 pr-4 py-2 h-full flex flex-col justify-between">
              {/* Station Info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Radio className="w-4 h-4 text-white" />
                  <span className="text-white font-bold text-sm">
                    Erigga Radio {isLive && <span className="text-red-300">• LIVE</span>}
                  </span>
                </div>

                {/* Controls - Show on hover or mobile */}
                <div
                  className={cn(
                    "flex items-center space-x-1 transition-opacity duration-200",
                    isHovered || (typeof window !== "undefined" && window.innerWidth < 768)
                      ? "opacity-100"
                      : "opacity-0 md:opacity-0",
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
                <motion.div
                  className="whitespace-nowrap text-white text-xs font-medium"
                  key={currentLyricIndex}
                  initial={{ x: "100%" }}
                  animate={{ x: "-100%" }}
                  transition={{
                    duration: prefersReducedMotion ? 0 : 15,
                    ease: "linear",
                    repeat: Number.POSITIVE_INFINITY,
                  }}
                >
                  <span className="inline-block">
                    ♪ {currentLyric.text} - {currentLyric.song_title} by {currentLyric.artist} ♪
                  </span>
                </motion.div>
              </div>
            </div>
          )}

          {/* Unauthenticated User Content */}
          {!isCollapsed && !isAuthenticated && (
            <div className="ml-24 pr-4 py-2 h-full flex flex-col justify-center">
              <div className="text-center">
                <p className="text-white font-bold text-sm mb-1">Erigga Radio</p>
                <p className="text-white/80 text-xs">Sign in to listen</p>
              </div>
            </div>
          )}

          {/* Collapse/Expand Button - Only for authenticated users */}
          {isAuthenticated && (
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
          )}

          {/* Playing Indicator - Only for authenticated users */}
          {isPlaying && !isCollapsed && isAuthenticated && (
            <div className="absolute top-1 right-1">
              <div className="flex space-x-1">
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-1 bg-green-400 rounded-full"
                    style={{ height: "8px" }}
                    animate={
                      prefersReducedMotion
                        ? {}
                        : {
                            scaleY: [1, 2, 1],
                            opacity: [0.5, 1, 0.5],
                          }
                    }
                    transition={{
                      duration: 1,
                      repeat: Number.POSITIVE_INFINITY,
                      delay: i * 0.2,
                      ease: "easeInOut",
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Mobile-specific controls - Only for authenticated users */}
        {isAuthenticated && (
          <div className="md:hidden mt-2 flex justify-center space-x-2">
            {!isCollapsed && (
              <>
                <motion.button
                  onClick={togglePlayPause}
                  disabled={isLoading}
                  className="p-2 rounded-full bg-orange-600 hover:bg-orange-700 transition-colors shadow-lg"
                  aria-label={isPlaying ? "Pause radio" : "Play radio"}
                  whileTap={prefersReducedMotion ? {} : { scale: 0.9 }}
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : isPlaying ? (
                    <Pause className="w-5 h-5 text-white" />
                  ) : (
                    <Play className="w-5 h-5 text-white" />
                  )}
                </motion.button>

                <motion.button
                  onClick={toggleMute}
                  className="p-2 rounded-full bg-orange-600 hover:bg-orange-700 transition-colors shadow-lg"
                  aria-label={isMuted ? "Unmute radio" : "Mute radio"}
                  whileTap={prefersReducedMotion ? {} : { scale: 0.9 }}
                >
                  {isMuted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
                </motion.button>
              </>
            )}
          </div>
        )}

        {/* Tooltip for unauthenticated users */}
        <AnimatePresence>
          {showTooltip && !isAuthenticated && (
            <motion.div
              className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black text-white text-sm rounded-lg shadow-lg whitespace-nowrap z-50"
              initial={{ opacity: 0, y: 10, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.8 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
            >
              Sign in to listen
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  )
}
