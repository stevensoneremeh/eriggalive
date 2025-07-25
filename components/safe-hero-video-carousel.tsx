"use client"

import { useState, useEffect, useRef } from "react"
import { ChevronLeft, ChevronRight, Play, Pause, Volume2, VolumeX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"

interface MediaItem {
  id: number
  type: "video" | "image"
  src: string
  title: string
  description: string
  category: string
}

const mediaItems: MediaItem[] = [
  {
    id: 1,
    type: "image",
    src: "/images/hero/erigga1.jpeg",
    title: "Welcome to Erigga Live",
    description: "Join the official fan community and connect with fellow fans worldwide",
    category: "Community",
  },
  {
    id: 2,
    type: "image",
    src: "/images/hero/erigga2.jpeg",
    title: "Exclusive Content",
    description: "Access behind-the-scenes content, unreleased tracks, and exclusive interviews",
    category: "Exclusive",
  },
  {
    id: 3,
    type: "image",
    src: "/images/hero/erigga3.jpeg",
    title: "Live Events",
    description: "Get priority access to concerts, meet & greets, and virtual events",
    category: "Events",
  },
  {
    id: 4,
    type: "image",
    src: "/images/hero/erigga4.jpeg",
    title: "Fan Community",
    description: "Connect with other fans, share your thoughts, and be part of the movement",
    category: "Social",
  },
]

export function SafeHeroVideoCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const currentItem = mediaItems[currentIndex]

  // Auto-advance slides
  useEffect(() => {
    if (isAutoPlaying && !isTransitioning) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % mediaItems.length)
      }, 5000)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isAutoPlaying, isTransitioning])

  // Handle video play/pause
  useEffect(() => {
    const video = videoRef.current
    if (!video || currentItem.type !== "video") return

    if (isPlaying) {
      video.play().catch((error) => {
        console.error("Video play failed:", error)
        setIsPlaying(false)
      })
    } else {
      video.pause()
    }
  }, [isPlaying, currentItem.type])

  // Handle video mute/unmute
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.muted = isMuted
  }, [isMuted])

  const goToSlide = (index: number) => {
    if (isTransitioning) return

    setIsTransitioning(true)
    setCurrentIndex(index)
    setIsAutoPlaying(false)

    setTimeout(() => {
      setIsTransitioning(false)
      // Resume auto-play after 10 seconds
      setTimeout(() => setIsAutoPlaying(true), 10000)
    }, 500)
  }

  const goToPrevious = () => {
    if (isTransitioning) return

    setIsTransitioning(true)
    setCurrentIndex((prev) => (prev - 1 + mediaItems.length) % mediaItems.length)
    setIsAutoPlaying(false)

    setTimeout(() => {
      setIsTransitioning(false)
      setTimeout(() => setIsAutoPlaying(true), 10000)
    }, 500)
  }

  const goToNext = () => {
    if (isTransitioning) return

    setIsTransitioning(true)
    setCurrentIndex((prev) => (prev + 1) % mediaItems.length)
    setIsAutoPlaying(false)

    setTimeout(() => {
      setIsTransitioning(false)
      setTimeout(() => setIsAutoPlaying(true), 10000)
    }, 500)
  }

  const togglePlayPause = () => {
    if (currentItem.type === "video") {
      setIsPlaying(!isPlaying)
    }
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  return (
    <section className="relative h-screen w-full overflow-hidden">
      {/* Media Container */}
      <div className="absolute inset-0">
        {currentItem.type === "video" ? (
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            src={currentItem.src}
            muted={isMuted}
            loop
            playsInline
            poster="/images/hero/erigga1.jpeg"
            onLoadedData={() => {
              if (isPlaying) {
                videoRef.current?.play().catch(console.error)
              }
            }}
            onError={(e) => {
              console.error("Video error:", e)
              setIsPlaying(false)
            }}
          />
        ) : (
          <div className="relative h-full w-full">
            <Image
              src={currentItem.src || "/placeholder.svg"}
              alt={currentItem.title}
              fill
              className="object-cover transition-opacity duration-500"
              priority={currentIndex === 0}
              sizes="100vw"
              quality={90}
            />
          </div>
        )}
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Content */}
      <div className="relative z-10 flex h-full items-center justify-center">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center text-white">
            <Badge variant="secondary" className="mb-4 bg-white/20 text-white border-white/30">
              {currentItem.category}
            </Badge>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">{currentItem.title}</h1>
            <p className="text-lg md:text-xl lg:text-2xl mb-8 text-white/90 max-w-2xl mx-auto">
              {currentItem.description}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-white text-black hover:bg-white/90">
                Join Community
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-black bg-transparent"
              >
                Explore Content
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20">
        <Button
          variant="ghost"
          size="icon"
          onClick={goToPrevious}
          disabled={isTransitioning}
          className="h-12 w-12 rounded-full bg-black/20 text-white hover:bg-black/40 backdrop-blur-sm disabled:opacity-50"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
      </div>

      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20">
        <Button
          variant="ghost"
          size="icon"
          onClick={goToNext}
          disabled={isTransitioning}
          className="h-12 w-12 rounded-full bg-black/20 text-white hover:bg-black/40 backdrop-blur-sm disabled:opacity-50"
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
      </div>

      {/* Video Controls */}
      {currentItem.type === "video" && (
        <div className="absolute bottom-20 left-4 z-20 flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={togglePlayPause}
            className="h-10 w-10 rounded-full bg-black/20 text-white hover:bg-black/40 backdrop-blur-sm"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMute}
            className="h-10 w-10 rounded-full bg-black/20 text-white hover:bg-black/40 backdrop-blur-sm"
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
        </div>
      )}

      {/* Slide Indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
        <div className="flex gap-2">
          {mediaItems.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              disabled={isTransitioning}
              className={`h-2 w-8 rounded-full transition-all duration-300 disabled:opacity-50 ${
                index === currentIndex ? "bg-white" : "bg-white/40 hover:bg-white/60"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-20">
        <div
          className="h-full bg-white transition-all duration-300 ease-linear"
          style={{
            width: `${((currentIndex + 1) / mediaItems.length) * 100}%`,
          }}
        />
      </div>
    </section>
  )
}
