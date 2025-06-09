"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Volume2, VolumeX, Play, Pause } from "lucide-react"

interface HeroVideoProps {
  src: string
  fallbackImage?: string
  className?: string
}

export function HeroVideo({ src, fallbackImage, className = "" }: HeroVideoProps) {
  const [isMuted, setIsMuted] = useState(true)
  const [isPlaying, setIsPlaying] = useState(true)
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleLoadedData = () => setIsLoaded(true)
    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleError = () => {
      console.error("Video failed to load")
      setHasError(true)
    }

    video.addEventListener("loadeddata", handleLoadedData)
    video.addEventListener("play", handlePlay)
    video.addEventListener("pause", handlePause)
    video.addEventListener("error", handleError)

    // If video fails to load within 5 seconds, show fallback
    const timeout = setTimeout(() => {
      if (!isLoaded) {
        setHasError(true)
      }
    }, 5000)

    return () => {
      video.removeEventListener("loadeddata", handleLoadedData)
      video.removeEventListener("play", handlePlay)
      video.removeEventListener("pause", handlePause)
      video.removeEventListener("error", handleError)
      clearTimeout(timeout)
    }
  }, [isLoaded])

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
        videoRef.current.play().catch((err) => {
          console.error("Video play failed:", err)
          setHasError(true)
        })
      }
    }
  }

  if (hasError && fallbackImage) {
    return (
      <div
        className={`absolute inset-0 bg-cover bg-center ${className}`}
        style={{
          backgroundImage: `url(${fallbackImage})`,
          filter: "brightness(0.8) contrast(1.1) saturate(1.1)",
        }}
      />
    )
  }

  return (
    <div className={`relative ${className}`}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isMuted}
        loop
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          filter: "brightness(0.8) contrast(1.1) saturate(1.1)",
        }}
        poster={fallbackImage}
        onError={() => setHasError(true)}
      >
        <source src={src} type="video/mp4" />
        {/* Fallback */}
        {fallbackImage && (
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${fallbackImage})` }} />
        )}
      </video>

      {/* Video Controls */}
      {!hasError && (
        <div className="absolute top-4 right-4 flex gap-2">
          {/* Quality Badge */}
          <div className="bg-black/50 rounded-full px-3 py-1 text-xs text-white/80 backdrop-blur-sm border border-white/10">
            LIVE PERFORMANCE
          </div>

          {/* Play/Pause Button */}
          <Button
            variant="ghost"
            size="icon"
            className="bg-black/50 hover:bg-black/70 text-white border border-white/20 backdrop-blur-sm"
            onClick={togglePlay}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>

          {/* Mute/Unmute Button */}
          <Button
            variant="ghost"
            size="icon"
            className="bg-black/50 hover:bg-black/70 text-white border border-white/20 backdrop-blur-sm"
            onClick={toggleMute}
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
        </div>
      )}

      {/* Loading State */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="text-white text-lg">Loading video...</div>
        </div>
      )}
    </div>
  )
}
