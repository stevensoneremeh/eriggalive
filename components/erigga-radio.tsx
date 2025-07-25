"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Play, Pause, Volume2, VolumeX, Radio, X } from "lucide-react"
import { cn } from "@/lib/utils"

export default function EriggaRadio() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const audioRef = useRef<HTMLAudioElement>(null)

  // Sample radio stream URL - replace with actual stream
  const radioStreamUrl = "https://stream.zeno.fm/your-radio-stream"

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play().catch((error) => {
          console.error("Error playing audio:", error)
        })
      }
      setIsPlaying(!isPlaying)
    }
  }

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const closeRadio = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
    }
    setIsVisible(false)
  }

  useEffect(() => {
    const audio = audioRef.current
    if (audio) {
      const handlePlay = () => setIsPlaying(true)
      const handlePause = () => setIsPlaying(false)

      audio.addEventListener("play", handlePlay)
      audio.addEventListener("pause", handlePause)

      return () => {
        audio.removeEventListener("play", handlePlay)
        audio.removeEventListener("pause", handlePause)
      }
    }
  }, [])

  if (!isVisible) return null

  return (
    <>
      <audio ref={audioRef} src={radioStreamUrl} preload="none" />

      <div
        className={cn("fixed bottom-4 right-4 z-50 transition-all duration-300", isMinimized ? "w-16 h-16" : "w-80")}
      >
        <Card className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 shadow-2xl">
          <CardContent className={cn("p-4", isMinimized && "p-2")}>
            {isMinimized ? (
              <Button
                onClick={() => setIsMinimized(false)}
                className="w-full h-full bg-transparent hover:bg-white/20 p-0"
              >
                <Radio className="h-6 w-6" />
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Radio className="h-5 w-5" />
                    <span className="font-bold text-sm">Erigga Radio</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button
                      onClick={() => setIsMinimized(true)}
                      size="sm"
                      className="bg-transparent hover:bg-white/20 p-1 h-6 w-6"
                    >
                      <span className="text-xs">−</span>
                    </Button>
                    <Button onClick={closeRadio} size="sm" className="bg-transparent hover:bg-white/20 p-1 h-6 w-6">
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div className="text-xs opacity-90">🎵 Now Playing: Latest Erigga Hits</div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Button onClick={togglePlay} size="sm" className="bg-white/20 hover:bg-white/30 rounded-full p-2">
                      {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button onClick={toggleMute} size="sm" className="bg-white/20 hover:bg-white/30 rounded-full p-2">
                      {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </Button>
                  </div>

                  <div className="flex items-center space-x-1">
                    <div className="w-1 h-3 bg-white/60 rounded animate-pulse"></div>
                    <div className="w-1 h-4 bg-white/80 rounded animate-pulse delay-75"></div>
                    <div className="w-1 h-2 bg-white/60 rounded animate-pulse delay-150"></div>
                    <div className="w-1 h-5 bg-white rounded animate-pulse delay-200"></div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
