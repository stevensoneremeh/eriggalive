"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { getOptimizedVideoSources, getVideoFallbackImage, tryPlayVideo } from "@/utils/video-utils"

interface SafeHeroVideoCarouselProps {
  images: string[]
  videoUrl?: string
  className?: string
}

export function SafeHeroVideoCarousel({ images, videoUrl, className }: SafeHeroVideoCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const [isVideoLoaded, setIsVideoLoaded] = useState(false)
  const [isVideoError, setIsVideoError] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const videoSources = getOptimizedVideoSources()
  const fallbackImage = getVideoFallbackImage()

  // Handle video loading and errors
  useEffect(() => {
    if (!videoUrl || !videoRef.current) return

    const video = videoRef.current

    const handleCanPlay = () => {
      setIsVideoLoaded(true)
      tryPlayVideo(video).then((success) => {
        setIsVideoPlaying(success)
        if (!success) {
          console.warn("Video autoplay was prevented. Using image carousel instead.")
        }
      })
    }

    const handleError = (e: Event) => {
      console.error("Video error:", e)
      setIsVideoError(true)
    }

    video.addEventListener("canplay", handleCanPlay)
    video.addEventListener("error", handleError)

    // Try to load the video
    video.load()

    return () => {
      video.removeEventListener("canplay", handleCanPlay)
      video.removeEventListener("error", handleError)
    }
  }, [videoUrl])

  // Auto-advance carousel if video is not playing
  useEffect(() => {
    if (isVideoPlaying) return

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [images.length, isVideoPlaying])

  // Handle manual navigation
  const goToSlide = (index: number) => {
    if (isVideoPlaying && videoRef.current) {
      // Stop video and switch to images
      videoRef.current.pause()
      setIsVideoPlaying(false)
    }
    setCurrentIndex(index)
  }

  // Toggle video playback
  const toggleVideo = () => {
    if (!videoRef.current || isVideoError) return

    if (videoRef.current.paused) {
      tryPlayVideo(videoRef.current).then((success) => {
        setIsVideoPlaying(success)
      })
    } else {
      videoRef.current.pause()
      setIsVideoPlaying(false)
    }
  }

  return (
    <div className={cn("relative w-full h-full overflow-hidden", className)}>
      {/* Video Background (if available and playing) */}
      {videoUrl && !isVideoError && (
        <div className={cn("absolute inset-0 w-full h-full", isVideoPlaying ? "opacity-100" : "opacity-0")}>
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
            loop
            autoPlay
            poster={fallbackImage}
          >
            {videoSources.map((source, index) => (
              <source key={index} src={source.src} type={source.type} />
            ))}
            Your browser does not support the video tag.
          </video>
        </div>
      )}

      {/* Image Carousel (fallback or when video is not playing) */}
      <div className={cn("absolute inset-0 w-full h-full", isVideoPlaying ? "opacity-0" : "opacity-100")}>
        {images.map((image, index) => (
          <div
            key={index}
            className={cn(
              "absolute inset-0 w-full h-full transition-opacity duration-1000",
              index === currentIndex ? "opacity-100" : "opacity-0",
            )}
          >
            <Image
              src={image || "/placeholder.svg"}
              alt={`Hero image ${index + 1}`}
              fill
              priority={index === 0}
              className="object-cover"
              sizes="100vw"
            />
          </div>
        ))}
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />

      {/* Navigation Dots */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={cn(
              "w-2 h-2 rounded-full transition-all",
              index === currentIndex && !isVideoPlaying ? "bg-white w-4" : "bg-white/50",
            )}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
        {videoUrl && !isVideoError && (
          <button
            onClick={toggleVideo}
            className={cn("w-2 h-2 rounded-full transition-all", isVideoPlaying ? "bg-white w-4" : "bg-white/50")}
            aria-label="Toggle video"
          >
            <span className="sr-only">Video</span>
          </button>
        )}
      </div>
    </div>
  )
}
