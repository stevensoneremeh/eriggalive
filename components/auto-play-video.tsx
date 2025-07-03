"use client"

import type React from "react"

import { useEffect, useRef, useState, useCallback } from "react"

interface AutoPlayVideoProps {
  className?: string
  style?: React.CSSProperties
  fallbackImage: string
  onVideoReady?: () => void
  onVideoError?: () => void
}

export function AutoPlayVideo({
  className = "",
  style = {},
  fallbackImage,
  onVideoReady,
  onVideoError,
}: AutoPlayVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoState, setVideoState] = useState({
    isLoaded: false,
    isPlaying: false,
    hasError: false,
    currentSource: 0,
  })

  // Multiple video sources for maximum compatibility
  const videoSources = [
    {
      src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/erigga-hero-video-F19YWf5JgcnmasQmH2s37F8lND161t.mp4",
      type: "video/mp4",
    },
    { src: "/videos/erigga-hero-video.mp4", type: "video/mp4" },
    { src: "/videos/erigga-hero-video.webm", type: "video/webm" },
  ]

  const forcePlay = useCallback(async () => {
    const video = videoRef.current
    if (!video) return false

    try {
      // Reset video to beginning
      video.currentTime = 0

      // Ensure video is muted for autoplay
      video.muted = true
      video.volume = 0

      // Force load
      video.load()

      // Wait for video to be ready
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("Video load timeout")), 10000)

        const onCanPlay = () => {
          clearTimeout(timeout)
          video.removeEventListener("canplay", onCanPlay)
          video.removeEventListener("error", onError)
          resolve(true)
        }

        const onError = () => {
          clearTimeout(timeout)
          video.removeEventListener("canplay", onCanPlay)
          video.removeEventListener("error", onError)
          reject(new Error("Video load error"))
        }

        video.addEventListener("canplay", onCanPlay)
        video.addEventListener("error", onError)
      })

      // Attempt to play
      await video.play()

      setVideoState((prev) => ({ ...prev, isPlaying: true, isLoaded: true }))
      onVideoReady?.()
      return true
    } catch (error) {
      console.error("Video play attempt failed:", error)
      return false
    }
  }, [onVideoReady])

  const tryNextSource = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    const nextSourceIndex = videoState.currentSource + 1

    if (nextSourceIndex < videoSources.length) {
      console.log(`Trying video source ${nextSourceIndex + 1}/${videoSources.length}`)
      setVideoState((prev) => ({ ...prev, currentSource: nextSourceIndex }))

      // Update video source
      const source = video.querySelector("source")
      if (source) {
        source.src = videoSources[nextSourceIndex].src
        source.type = videoSources[nextSourceIndex].type
        video.load()
      }
    } else {
      console.error("All video sources failed")
      setVideoState((prev) => ({ ...prev, hasError: true }))
      onVideoError?.()
    }
  }, [videoState.currentSource, onVideoError])

  // Initialize video on mount
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    let playAttempts = 0
    const maxAttempts = 3

    const attemptPlay = async () => {
      playAttempts++
      console.log(`Video play attempt ${playAttempts}/${maxAttempts}`)

      const success = await forcePlay()

      if (!success && playAttempts < maxAttempts) {
        // Wait and retry
        setTimeout(attemptPlay, 1000)
      } else if (!success) {
        // Try next source
        tryNextSource()
      }
    }

    // Set up event listeners
    const handleError = () => {
      console.error("Video error occurred")
      tryNextSource()
    }

    const handleLoadStart = () => {
      console.log("Video loading started")
    }

    const handleCanPlay = () => {
      console.log("Video can play")
      if (!videoState.isPlaying) {
        attemptPlay()
      }
    }

    const handlePlay = () => {
      console.log("Video started playing")
      setVideoState((prev) => ({ ...prev, isPlaying: true }))
    }

    const handlePause = () => {
      console.log("Video paused")
      setVideoState((prev) => ({ ...prev, isPlaying: false }))
    }

    video.addEventListener("error", handleError)
    video.addEventListener("loadstart", handleLoadStart)
    video.addEventListener("canplay", handleCanPlay)
    video.addEventListener("play", handlePlay)
    video.addEventListener("pause", handlePause)

    // Initial play attempt
    setTimeout(attemptPlay, 500)

    return () => {
      video.removeEventListener("error", handleError)
      video.removeEventListener("loadstart", handleLoadStart)
      video.removeEventListener("canplay", handleCanPlay)
      video.removeEventListener("play", handlePlay)
      video.removeEventListener("pause", handlePause)
    }
  }, [forcePlay, tryNextSource, videoState.isPlaying])

  // User interaction fallback
  useEffect(() => {
    const handleUserInteraction = async () => {
      if (!videoState.isPlaying && !videoState.hasError) {
        console.log("User interaction detected, attempting video play")
        await forcePlay()
      }
    }

    // Listen for any user interaction
    const events = ["click", "touchstart", "keydown"]
    events.forEach((event) => {
      document.addEventListener(event, handleUserInteraction, { once: true })
    })

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleUserInteraction)
      })
    }
  }, [videoState.isPlaying, videoState.hasError, forcePlay])

  if (videoState.hasError) {
    return (
      <div
        className={className}
        style={{
          ...style,
          backgroundImage: `url(${fallbackImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "brightness(0.7) contrast(1.1) saturate(1.1)",
        }}
      />
    )
  }

  return (
    <video
      ref={videoRef}
      className={className}
      style={style}
      autoPlay
      playsInline
      muted
      loop
      preload="auto"
      poster={fallbackImage}
      crossOrigin="anonymous"
    >
      <source src={videoSources[videoState.currentSource].src} type={videoSources[videoState.currentSource].type} />
      {/* Fallback for browsers that don't support video */}
      <div
        style={{
          width: "100%",
          height: "100%",
          backgroundImage: `url(${fallbackImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
    </video>
  )
}
