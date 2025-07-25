"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Volume2, VolumeX, Play, Pause } from "lucide-react"
import Image from "next/image"

interface HeroVideoProps {
  src: string
  fallbackImage?: string
  className?: string
}

export function HeroVideo({ src, fallbackImage, className = "" }: HeroVideoProps) {
  const [isMuted, setIsMuted] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [showFallback, setShowFallback] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  // Initialize video on mount
  useEffect(() => {
    const video = videoRef.current
    if (!video || !src) {
      setShowFallback(true)
      return
    }

    // Set up event listeners
    const handleLoadedData = () => {
      console.log("✅ Video loaded successfully")
      setIsLoaded(true)
      setShowFallback(false)
      // Try to play the video automatically
      playVideo()
    }

    const handlePlay = () => {
      setIsPlaying(true)
      setShowFallback(false)
    }

    const handlePause = () => setIsPlaying(false)

    const handleError = (e: any) => {
      console.error("❌ Video failed to load:", e)
      setHasError(true)
      setShowFallback(true)
    }

    const handleLoadStart = () => {
      console.log("🔄 Video loading started")
      setShowFallback(false)
    }

    video.addEventListener("loadeddata", handleLoadedData)
    video.addEventListener("loadstart", handleLoadStart)
    video.addEventListener("play", handlePlay)
    video.addEventListener("pause", handlePause)
    video.addEventListener("error", handleError)

    // Preload the video
    video.load()

    // If video fails to load within 5 seconds, show fallback
    const timeout = setTimeout(() => {
      if (!isLoaded && !hasError) {
        console.warn("⚠️ Video load timeout - showing fallback")
        setShowFallback(true)
      }
    }, 5000)

    return () => {
      video.removeEventListener("loadeddata", handleLoadedData)
      video.removeEventListener("loadstart", handleLoadStart)
      video.removeEventListener("play", handlePlay)
      video.removeEventListener("pause", handlePause)
      video.removeEventListener("error", handleError)
      clearTimeout(timeout)
    }
  }, [src, isLoaded, hasError])

  // Function to safely attempt to play the video
  const playVideo = () => {
    if (!videoRef.current) return

    // Always mute before attempting to play (to avoid autoplay restrictions)
    videoRef.current.muted = true
    setIsMuted(true)

    // Attempt to play with error handling
    const playPromise = videoRef.current.play()

    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log("✅ Video playing")
          setIsPlaying(true)
          setShowFallback(false)
        })
        .catch((err) => {
          console.error("❌ Video play failed:", err)
          setIsPlaying(false)
          setShowFallback(true)
        })
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        playVideo()
      }
    }
  }

  // If there's an error or we should show fallback and we have a fallback image, show it
  if ((hasError || showFallback) && fallbackImage) {
    return (
      <div className={`relative ${className}`}>
        <Image
          src={fallbackImage || "/placeholder.svg"}
          alt="Hero fallback image"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40" />
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      {/* Video Element */}
      <video
        ref={videoRef}
        playsInline
        muted={isMuted}
        loop
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          filter: "brightness(0.8) contrast(1.1) saturate(1.1)",
        }}
        poster={fallbackImage}
        preload="metadata"
      >
        <source src={src} type="video/mp4" />
        <source src={src.replace(".mp4", ".webm")} type="video/webm" />
        Your browser does not support the video tag.
      </video>

      {/* Video Controls */}
      {!showFallback && !hasError && (
        <div className="absolute top-4 right-4 flex gap-2 z-10">
          {/* Quality Badge */}
          <div className="bg-black/50 rounded-full px-3 py-1 text-xs text-white/80 backdrop-blur-sm border border-white/10">
            {isLoaded ? "HD" : "LOADING..."}
          </div>

          {/* Play/Pause Button */}
          <Button
            variant="ghost"
            size="icon"
            className="bg-black/50 hover:bg-black/70 text-white border border-white/20 backdrop-blur-sm"
            onClick={togglePlay}
            disabled={!isLoaded}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>

          {/* Mute/Unmute Button */}
          <Button
            variant="ghost"
            size="icon"
            className="bg-black/50 hover:bg-black/70 text-white border border-white/20 backdrop-blur-sm"
            onClick={toggleMute}
            disabled={!isLoaded}
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
        </div>
      )}

      {/* Loading State */}
      {!isLoaded && !hasError && !showFallback && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
          <div className="text-white text-lg flex items-center gap-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            Loading video...
          </div>
        </div>
      )}

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40 pointer-events-none" />
    </div>
  )
}
