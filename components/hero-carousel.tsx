"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface HeroCarouselProps {
  images: string[]
  videoUrl?: string
  autoScrollInterval?: number
  className?: string
}

export function HeroCarousel({ images, videoUrl, autoScrollInterval = 5000, className }: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [videoLoaded, setVideoLoaded] = useState(false)
  const [videoError, setVideoError] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const totalSlides = videoUrl ? images.length + 1 : images.length

  // Handle video loading
  useEffect(() => {
    if (!videoUrl) return

    const video = videoRef.current
    if (!video) return

    const handleCanPlay = () => {
      console.log("✅ Video can play now")
      setVideoLoaded(true)
      // Explicitly try to play the video
      video.play().catch((err) => {
        console.error("❌ Video play failed:", err)
        setVideoError(true)
      })
    }

    const handleError = () => {
      console.error("❌ Video error")
      setVideoError(true)
    }

    video.addEventListener("canplay", handleCanPlay)
    video.addEventListener("error", handleError)

    return () => {
      video.removeEventListener("canplay", handleCanPlay)
      video.removeEventListener("error", handleError)
    }
  }, [videoUrl])

  // Auto scroll functionality - only when not on video slide or if video has error
  useEffect(() => {
    // Don't auto-scroll if on video slide (index 0) and video is working
    if (videoUrl && currentIndex === 0 && !videoError) return

    const interval = setInterval(() => {
      goToNext()
    }, autoScrollInterval)

    return () => clearInterval(interval)
  }, [currentIndex, autoScrollInterval, videoUrl, videoError])

  const goToPrevious = () => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? totalSlides - 1 : prevIndex - 1))
    setTimeout(() => setIsTransitioning(false), 500)
  }

  const goToNext = () => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setCurrentIndex((prevIndex) => (prevIndex === totalSlides - 1 ? 0 : prevIndex + 1))
    setTimeout(() => setIsTransitioning(false), 500)
  }

  const goToSlide = (index: number) => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setCurrentIndex(index)
    setTimeout(() => setIsTransitioning(false), 500)
  }

  return (
    <div className={cn("relative w-full h-full overflow-hidden", className)}>
      {/* Video Slide (if provided) */}
      {videoUrl && (
        <div
          className={cn(
            "absolute inset-0 w-full h-full transition-opacity duration-1000",
            currentIndex === 0 ? "opacity-100 z-10" : "opacity-0 z-0",
          )}
        >
          {videoError ? (
            // Fallback to first image if video fails
            <Image
              src={images[0] || "/placeholder.svg"}
              alt="Hero image fallback"
              fill
              priority
              className="object-cover object-center"
              sizes="100vw"
              quality={90}
            />
          ) : (
            <video
              ref={videoRef}
              autoPlay
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
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40" />
        </div>
      )}

      {/* Image Slides */}
      {images.map((image, index) => {
        // Adjust index for image slides if we have a video
        const slideIndex = videoUrl ? index + 1 : index

        return (
          <div
            key={index}
            className={cn(
              "absolute inset-0 w-full h-full transition-opacity duration-1000",
              currentIndex === slideIndex ? "opacity-100 z-10" : "opacity-0 z-0",
            )}
          >
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
        {Array.from({ length: totalSlides }).map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={cn(
              "w-2 h-2 rounded-full transition-all",
              currentIndex === index ? "bg-white w-6" : "bg-white/50 hover:bg-white/80",
            )}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
