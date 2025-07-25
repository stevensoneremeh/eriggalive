"use client"

import { useState, useRef, useEffect } from "react"
import { Play, Pause, Volume2, VolumeX } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"

interface HeroVideoProps {
  src: string
  poster?: string
  alt?: string
  className?: string
}

export function HeroVideo({ src, poster, alt = "Hero video", className = "" }: HeroVideoProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleLoadStart = () => setIsLoading(true)
    const handleCanPlay = () => {
      setIsLoading(false)
      setHasError(false)
    }
    const handleError = () => {
      setIsLoading(false)
      setHasError(true)
    }
    const handleLoadedData = () => {
      setIsLoading(false)
    }

    video.addEventListener("loadstart", handleLoadStart)
    video.addEventListener("canplay", handleCanPlay)
    video.addEventListener("error", handleError)
    video.addEventListener("loadeddata", handleLoadedData)

    return () => {
      video.removeEventListener("loadstart", handleLoadStart)
      video.removeEventListener("canplay", handleCanPlay)
      video.removeEventListener("error", handleError)
      video.removeEventListener("loadeddata", handleLoadedData)
    }
  }, [])

  const togglePlay = async () => {
    const video = videoRef.current
    if (!video || hasError) return

    try {
      if (isPlaying) {
        video.pause()
        setIsPlaying(false)
      } else {
        await video.play()
        setIsPlaying(true)
      }
    } catch (error) {
      console.error("Error playing video:", error)
      setHasError(true)
    }
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (!video || hasError) return

    video.muted = !isMuted
    setIsMuted(!isMuted)
  }

  if (hasError && poster) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <Image src={poster || "/placeholder.svg"} alt={alt} fill className="object-cover" priority />
        <div className="absolute inset-0 bg-black/20" />
      </div>
    )
  }

  if (hasError) {
    return (
      <div className={`relative overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20 ${className}`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            <h3 className="text-2xl font-bold mb-2">Welcome to Erigga's World</h3>
            <p className="text-lg opacity-90">Experience the music, join the community</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        poster={poster}
        muted={isMuted}
        loop
        playsInline
        preload="metadata"
      >
        <source src={src} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Controls overlay */}
      <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity duration-300">
        <div className="absolute bottom-4 left-4 flex items-center gap-2">
          <Button
            variant="secondary"
            size="icon"
            onClick={togglePlay}
            className="bg-white/20 hover:bg-white/30 text-white border-0"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button
            variant="secondary"
            size="icon"
            onClick={toggleMute}
            className="bg-white/20 hover:bg-white/30 text-white border-0"
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Fallback content overlay */}
      {!isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center text-white">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">Welcome to Erigga's World</h1>
            <p className="text-xl md:text-2xl opacity-90">Experience the music, join the community</p>
          </div>
        </div>
      )}
    </div>
  )
}
