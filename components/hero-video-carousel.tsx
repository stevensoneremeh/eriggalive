"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface HeroVideoCarouselProps {
  images: string[]
  videoUrl: string
  autoScrollInterval?: number
  className?: string
}

export function HeroVideoCarousel({ images, videoUrl, autoScrollInterval = 5000, className }: HeroVideoCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [videoEnded, setVideoEnded] = useState(false)
  const [videoError, setVideoError] = useState(false)
  const [videoLoaded, setVideoLoaded] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const totalSlides = images.length + 1

  // Handle video loading and events
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleVideoEnd = () => {
      console.log("✅ Video ended, moving to images")
      setVideoEnded(true)
      setCurrentIndex(1) // Move to first image
    }

    const handleError = (e: any) => {
      console.error("❌ Video error:", e)
      setVideoError(true)
      setCurrentIndex(1) // Move to first image on error
    }

    const handleCanPlay = () => {
      console.log("✅ Video can play")
      setVideoLoaded(true)
      playVideo()
    }

    // Set up event listeners with error handling
    try {
      video.addEventListener("ended", handleVideoEnd)
      video.addEventListener("error", handleError)
      video.addEventListener("canplay", handleCanPlay)
    } catch (err) {
      console.error("❌ Error setting up video event listeners:", err)
      setVideoError(true)
    }

    // Set a timeout to check if video is playing
    const timeout = setTimeout(() => {
      if (video.paused && !videoEnded && !videoLoaded) {
        console.log("⚠️ Video still paused after timeout, showing images instead")
        setVideoError(true)
        setCurrentIndex(1)
      }
    }, 3000)

    return () => {
      try {
        clearTimeout(timeout)
        video.removeEventListener("ended", handleVideoEnd)
        video.removeEventListener("error", handleError)
        video.removeEventListener("canplay", handleCanPlay)
      } catch (err) {
        console.error("❌ Error cleaning up video event listeners:", err)
      }
    }
  }, [videoEnded, videoLoaded])

  // Function to safely attempt to play the video
  const playVideo = () => {
    if (!videoRef.current) return

    // Always mute before attempting to play (to avoid autoplay restrictions)
    videoRef.current.muted = true

    // Attempt to play with error handling
    videoRef.current
      .play()
      .then(() => {
        console.log("✅ Video playing")
      })
      .catch((err) => {
        console.error("❌ Video play failed:", err)
        setVideoError(true)
        setCurrentIndex(1)
      })
  }

  // Auto scroll functionality - only for image slides
  useEffect(() => {
    // Don't auto-scroll if on video slide (index 0) and video hasn't ended
    if (currentIndex === 0 && !videoEnded && !videoError) return

    const interval = setInterval(() => {
      goToNext()
    }, autoScrollInterval)

    return () => clearInterval(interval)
  }, [currentIndex, autoScrollInterval, videoEnded, videoError])

  const goToPrevious = () => {
    if (isTransitioning) return
    setIsTransitioning(true)

    // Skip video slide if it has ended or had an error
    if (currentIndex === 1 && (videoEnded || videoError)) {
      setCurrentIndex(totalSlides - 1)
    } else {
      setCurrentIndex((prevIndex) => (prevIndex === 0 ? totalSlides - 1 : prevIndex - 1))
    }

    setTimeout(() => setIsTransitioning(false), 500)
  }

  const goToNext = () => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setCurrentIndex((prevIndex) => (prevIndex === totalSlides - 1 ? (videoEnded || videoError ? 1 : 0) : prevIndex + 1))
    setTimeout(() => setIsTransitioning(false), 500)
  }

  const goToSlide = (index: number) => {
    if (isTransitioning) return

    // Skip video slide if it has ended or had an error
    if (index === 0 && (videoEnded || videoError)) {
      return
    }

    setIsTransitioning(true)
    setCurrentIndex(index)
    setTimeout(() => setIsTransitioning(false), 500)
  }

  return (
    <div className={cn("absolute inset-0 w-full h-full", className)}>
      {/* Video Slide */}
      <div
        className={cn(
          "absolute inset-0 w-full h-full transition-opacity duration-1000",
          currentIndex === 0 ? "opacity-100 z-10" : "opacity-0 z-0",
        )}
      >
        <video
          ref={videoRef}
          playsInline
          muted
          loop
          className="absolute inset-0 w-full h-full object-cover"
          poster={images[0]}
        >
          <source src={videoUrl} type="video/mp4" />
          <source src={videoUrl} type="video/webm" />
          Your browser does not support the video tag.
        </video>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40" />
      </div>

      {/* Image Slides */}
      {images.map((image, index) => {
        // Adjust index for image slides
        const slideIndex = index + 1

        return (
          <div
            key={index}
            className={cn(
              "absolute inset-0 w-full h-full transition-opacity duration-1000",
              currentIndex === slideIndex ? "opacity-100 z-10" : "opacity-0 z-0",
            )}
          >
            <div className="relative w-full h-full">
              <Image
                src={image || "/placeholder.svg"}
                alt={`Hero image ${index + 1}`}
                fill
                priority={index === 0}
                className="object-cover object-center"
                sizes="100vw"
                quality={90}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40" />
            </div>
          </div>
        )
      })}

      {/* Navigation arrows */}
      <button
        onClick={goToPrevious}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full backdrop-blur-sm transition-all"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        onClick={goToNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full backdrop-blur-sm transition-all"
        aria-label="Next slide"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      {/* Indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex space-x-2">
        {/* Video indicator */}
        {!videoEnded && !videoError && (
          <button
            onClick={() => goToSlide(0)}
            className={cn(
              "transition-all rounded-full flex items-center justify-center",
              currentIndex === 0 ? "bg-white w-8 h-2" : "bg-white/50 hover:bg-white/80 w-2 h-2",
            )}
            aria-label="Video slide"
          >
            {currentIndex === 0 && <div className="w-1/2 h-full bg-orange-500 animate-pulse rounded-full" />}
          </button>
        )}

        {/* Image indicators */}
        {images.map((_, index) => {
          const slideIndex = index + 1
          return (
            <button
              key={index}
              onClick={() => goToSlide(slideIndex)}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                currentIndex === slideIndex ? "bg-white w-6" : "bg-white/50 hover:bg-white/80",
              )}
              aria-label={`Go to image ${index + 1}`}
            />
          )
        })}
      </div>
    </div>
  )
}
