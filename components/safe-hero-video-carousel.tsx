"use client"

import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight, Play, Pause } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SafeHeroVideoCarouselProps {
  images: string[]
  videoUrl?: string
  className?: string
}

export function SafeHeroVideoCarousel({ images, videoUrl, className }: SafeHeroVideoCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showVideo, setShowVideo] = useState(false)
  const [mounted, setMounted] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!showVideo) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % images.length)
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [images.length, showVideo])

  const handleVideoToggle = () => {
    if (!videoRef.current) return

    if (isPlaying) {
      videoRef.current.pause()
      setIsPlaying(false)
    } else {
      videoRef.current.play()
      setIsPlaying(true)
    }
  }

  const handleVideoClick = () => {
    setShowVideo(true)
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.play()
        setIsPlaying(true)
      }
    }, 100)
  }

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length)
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  if (!mounted) {
    return (
      <div className={cn("relative w-full h-full bg-gray-900", className)}>
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />
      </div>
    )
  }

  return (
    <div className={cn("relative w-full h-full overflow-hidden", className)}>
      {/* Background Images */}
      {!showVideo && (
        <div className="absolute inset-0">
          {images.map((image, index) => (
            <div
              key={index}
              className={cn(
                "absolute inset-0 transition-opacity duration-1000",
                index === currentIndex ? "opacity-100" : "opacity-0",
              )}
            >
              <img
                src={image || "/placeholder.svg"}
                alt={`Hero ${index + 1}`}
                className="w-full h-full object-cover"
                loading={index === 0 ? "eager" : "lazy"}
              />
            </div>
          ))}
        </div>
      )}

      {/* Video */}
      {showVideo && videoUrl && (
        <div className="absolute inset-0">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            loop
            muted
            playsInline
            onEnded={() => setIsPlaying(false)}
          >
            <source src={videoUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      )}

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />

      {/* Navigation Controls */}
      {!showVideo && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 z-20"
            onClick={prevSlide}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 z-20"
            onClick={nextSlide}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </>
      )}

      {/* Video Controls */}
      {videoUrl && (
        <div className="absolute bottom-4 right-4 z-20 flex gap-2">
          {!showVideo ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleVideoClick}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              <Play className="h-4 w-4 mr-2" />
              Watch Video
            </Button>
          ) : (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleVideoToggle}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setShowVideo(false)
                  setIsPlaying(false)
                  if (videoRef.current) {
                    videoRef.current.pause()
                  }
                }}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                Back to Images
              </Button>
            </>
          )}
        </div>
      )}

      {/* Indicators */}
      {!showVideo && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {images.map((_, index) => (
            <button
              key={index}
              className={cn("w-2 h-2 rounded-full transition-all", index === currentIndex ? "bg-white" : "bg-white/50")}
              onClick={() => setCurrentIndex(index)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
