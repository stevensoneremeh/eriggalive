"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, Volume2, VolumeX, Maximize } from "lucide-react"

interface MediaPlayerProps {
  type: "image" | "audio" | "video"
  url: string
  thumbnail?: string
  title?: string
}

export function MediaPlayer({ type, url, thumbnail, title }: MediaPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const mediaRef = useRef<HTMLAudioElement | HTMLVideoElement>(null)

  useEffect(() => {
    const media = mediaRef.current
    if (!media) return

    const updateTime = () => setCurrentTime(media.currentTime)
    const updateDuration = () => setDuration(media.duration)
    const handleEnded = () => setIsPlaying(false)

    media.addEventListener("timeupdate", updateTime)
    media.addEventListener("loadedmetadata", updateDuration)
    media.addEventListener("ended", handleEnded)

    return () => {
      media.removeEventListener("timeupdate", updateTime)
      media.removeEventListener("loadedmetadata", updateDuration)
      media.removeEventListener("ended", handleEnded)
    }
  }, [])

  const togglePlay = () => {
    const media = mediaRef.current
    if (!media) return

    if (isPlaying) {
      media.pause()
    } else {
      media.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleSeek = (value: number[]) => {
    const media = mediaRef.current
    if (!media) return

    media.currentTime = value[0]
    setCurrentTime(value[0])
  }

  const handleVolumeChange = (value: number[]) => {
    const media = mediaRef.current
    if (!media) return

    const newVolume = value[0]
    media.volume = newVolume
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
  }

  const toggleMute = () => {
    const media = mediaRef.current
    if (!media) return

    if (isMuted) {
      media.volume = volume
      setIsMuted(false)
    } else {
      media.volume = 0
      setIsMuted(true)
    }
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  if (type === "image") {
    return (
      <div className="relative group">
        <img
          src={url || "/placeholder.svg"}
          alt={title || "Post image"}
          className="w-full h-auto max-h-96 object-cover rounded-lg"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg flex items-center justify-center">
          <Button variant="secondary" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
            <Maximize className="h-4 w-4 mr-2" />
            View Full Size
          </Button>
        </div>
      </div>
    )
  }

  if (type === "audio") {
    return (
      <div className="bg-muted/30 rounded-lg p-4 space-y-3">
        <audio ref={mediaRef as React.RefObject<HTMLAudioElement>} src={url} />

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={togglePlay} className="h-10 w-10 rounded-full p-0">
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>

          <div className="flex-1 space-y-1">
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={1}
              onValueChange={handleSeek}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={toggleMute} className="h-8 w-8 p-0">
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
            <Slider
              value={[isMuted ? 0 : volume]}
              max={1}
              step={0.1}
              onValueChange={handleVolumeChange}
              className="w-16"
            />
          </div>
        </div>

        {title && <p className="text-sm font-medium text-center">{title}</p>}
      </div>
    )
  }

  if (type === "video") {
    return (
      <div className="relative rounded-lg overflow-hidden bg-black">
        <video
          ref={mediaRef as React.RefObject<HTMLVideoElement>}
          src={url}
          poster={thumbnail}
          className="w-full h-auto max-h-96"
          onClick={togglePlay}
        />

        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <div className="flex items-center gap-3">
            <Button variant="secondary" size="sm" onClick={togglePlay} className="h-8 w-8 rounded-full p-0">
              {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            </Button>

            <div className="flex-1">
              <Slider
                value={[currentTime]}
                max={duration || 100}
                step={1}
                onValueChange={handleSeek}
                className="w-full"
              />
            </div>

            <span className="text-xs text-white">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
        </div>
      </div>
    )
  }

  return null
}
