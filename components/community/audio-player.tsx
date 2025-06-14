"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, Volume2, VolumeX, RotateCcw, SkipForward } from "lucide-react"
import { cn } from "@/lib/utils"

interface AudioPlayerProps {
  src: string
  title?: string
  artist?: string
  className?: string
  onPlay?: () => void
  onPause?: () => void
  onEnded?: () => void
}

export function AudioPlayer({ src, title, artist, className, onPlay, onPause, onEnded }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const audioRef = useRef<HTMLAudioElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleLoadStart = () => setIsLoading(true)
    const handleLoadedData = () => {
      setIsLoading(false)
      setDuration(audio.duration)
      setError(null)
    }
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime)
    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
      onEnded?.()
    }
    const handleError = () => {
      setIsLoading(false)
      setError("Failed to load audio")
      setIsPlaying(false)
    }
    const handlePlay = () => {
      setIsPlaying(true)
      onPlay?.()
    }
    const handlePause = () => {
      setIsPlaying(false)
      onPause?.()
    }

    audio.addEventListener("loadstart", handleLoadStart)
    audio.addEventListener("loadeddata", handleLoadedData)
    audio.addEventListener("timeupdate", handleTimeUpdate)
    audio.addEventListener("ended", handleEnded)
    audio.addEventListener("error", handleError)
    audio.addEventListener("play", handlePlay)
    audio.addEventListener("pause", handlePause)

    return () => {
      audio.removeEventListener("loadstart", handleLoadStart)
      audio.removeEventListener("loadeddata", handleLoadedData)
      audio.removeEventListener("timeupdate", handleTimeUpdate)
      audio.removeEventListener("ended", handleEnded)
      audio.removeEventListener("error", handleError)
      audio.removeEventListener("play", handlePlay)
      audio.removeEventListener("pause", handlePause)
    }
  }, [onPlay, onPause, onEnded])

  const togglePlayPause = async () => {
    const audio = audioRef.current
    if (!audio) return

    try {
      if (isPlaying) {
        audio.pause()
      } else {
        await audio.play()
      }
    } catch (err) {
      setError("Playback failed")
      setIsPlaying(false)
    }
  }

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current
    if (!audio || !duration) return

    const newTime = (value[0] / 100) * duration
    audio.currentTime = newTime
    setCurrentTime(newTime)
  }

  const handleVolumeChange = (value: number[]) => {
    const audio = audioRef.current
    if (!audio) return

    const newVolume = value[0] / 100
    audio.volume = newVolume
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
  }

  const toggleMute = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isMuted) {
      audio.volume = volume
      setIsMuted(false)
    } else {
      audio.volume = 0
      setIsMuted(true)
    }
  }

  const restart = () => {
    const audio = audioRef.current
    if (!audio) return

    audio.currentTime = 0
    setCurrentTime(0)
  }

  const skip = (seconds: number) => {
    const audio = audioRef.current
    if (!audio) return

    audio.currentTime = Math.min(audio.currentTime + seconds, duration)
  }

  const formatTime = (time: number) => {
    if (!time || !isFinite(time)) return "0:00"
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const progressPercentage = duration ? (currentTime / duration) * 100 : 0

  return (
    <div className={cn("bg-muted/30 rounded-lg p-4 space-y-3", className)}>
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Track Info */}
      {(title || artist) && (
        <div className="text-center">
          {title && <p className="font-medium text-sm truncate">{title}</p>}
          {artist && <p className="text-xs text-muted-foreground truncate">{artist}</p>}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="text-center text-red-500 text-sm">
          <p>{error}</p>
        </div>
      )}

      {/* Main Controls */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={restart} disabled={isLoading || !!error} className="h-8 w-8 p-0">
          <RotateCcw className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={togglePlayPause}
          disabled={isLoading || !!error}
          className="h-10 w-10 rounded-full p-0 bg-gradient-to-r from-orange-500 to-lime-500 text-white hover:from-orange-600 hover:to-lime-600 border-0"
        >
          {isLoading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5 ml-0.5" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => skip(10)}
          disabled={isLoading || !!error}
          className="h-8 w-8 p-0"
        >
          <SkipForward className="h-4 w-4" />
        </Button>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div
          ref={progressRef}
          className="relative h-2 bg-background rounded-full cursor-pointer"
          onClick={(e) => {
            if (!duration || !progressRef.current) return
            const rect = progressRef.current.getBoundingClientRect()
            const x = e.clientX - rect.left
            const percentage = (x / rect.width) * 100
            handleSeek([Math.max(0, Math.min(100, percentage))])
          }}
        >
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-orange-500 to-lime-500 rounded-full transition-all duration-100"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Volume Control */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={toggleMute} className="h-8 w-8 p-0">
          {isMuted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </Button>
        <Slider
          value={[isMuted ? 0 : volume * 100]}
          max={100}
          step={1}
          onValueChange={handleVolumeChange}
          className="flex-1"
        />
      </div>
    </div>
  )
}
