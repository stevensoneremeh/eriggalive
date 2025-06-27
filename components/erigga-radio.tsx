"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, Volume2, VolumeX, Radio } from "lucide-react"

export function EriggaRadio() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState([0.7])
  const [isMuted, setIsMuted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleLoadStart = () => setIsLoading(true)
    const handleCanPlay = () => setIsLoading(false)
    const handleError = () => {
      setError("Failed to load radio stream")
      setIsLoading(false)
      setIsPlaying(false)
    }
    const handleEnded = () => setIsPlaying(false)

    audio.addEventListener("loadstart", handleLoadStart)
    audio.addEventListener("canplay", handleCanPlay)
    audio.addEventListener("error", handleError)
    audio.addEventListener("ended", handleEnded)

    // Set initial volume
    audio.volume = volume[0]

    return () => {
      audio.removeEventListener("loadstart", handleLoadStart)
      audio.removeEventListener("canplay", handleCanPlay)
      audio.removeEventListener("error", handleError)
      audio.removeEventListener("ended", handleEnded)
    }
  }, [volume])

  const togglePlay = async () => {
    const audio = audioRef.current
    if (!audio) return

    try {
      setError(null)

      if (isPlaying) {
        audio.pause()
        setIsPlaying(false)
      } else {
        setIsLoading(true)
        await audio.play()
        setIsPlaying(true)
      }
    } catch (err) {
      console.error("Audio play error:", err)
      setError("Failed to play audio. Please try again.")
      setIsPlaying(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleVolumeChange = (newVolume: number[]) => {
    const audio = audioRef.current
    if (!audio) return

    setVolume(newVolume)
    audio.volume = newVolume[0]

    if (newVolume[0] === 0) {
      setIsMuted(true)
    } else if (isMuted) {
      setIsMuted(false)
    }
  }

  const toggleMute = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isMuted) {
      audio.volume = volume[0]
      setIsMuted(false)
    } else {
      audio.volume = 0
      setIsMuted(true)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20">
      <CardContent className="p-6">
        <div className="flex items-center justify-center mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Radio className="h-8 w-8 text-orange-500" />
              {isPlaying && <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />}
            </div>
            <div>
              <h3 className="font-bold text-lg">Erigga Radio</h3>
              <p className="text-sm text-muted-foreground">{isPlaying ? "Now Playing" : "Paper Boi Live"}</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="text-center text-red-500 text-sm mb-4 p-2 bg-red-50 dark:bg-red-950/20 rounded">{error}</div>
        )}

        <div className="flex items-center justify-center gap-4 mb-4">
          <Button
            onClick={togglePlay}
            disabled={isLoading}
            size="lg"
            className="bg-orange-500 hover:bg-orange-600 text-white rounded-full w-16 h-16"
          >
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isPlaying ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="h-6 w-6 ml-1" />
            )}
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={toggleMute} className="p-2">
            {isMuted || volume[0] === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>

          <Slider
            value={isMuted ? [0] : volume}
            onValueChange={handleVolumeChange}
            max={1}
            step={0.1}
            className="flex-1"
          />
        </div>

        <audio ref={audioRef} preload="none" crossOrigin="anonymous">
          <source src="/audio/erigga-radio-stream.mp3" type="audio/mpeg" />
          <source
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/erigga-radio-stream-c8C80eBY6VUKDJBcnRmkGqYxIyaukH.mp3"
            type="audio/mpeg"
          />
          Your browser does not support the audio element.
        </audio>

        <div className="text-center mt-4">
          <p className="text-xs text-muted-foreground">Streaming live from Warri • 24/7</p>
        </div>
      </CardContent>
    </Card>
  )
}
