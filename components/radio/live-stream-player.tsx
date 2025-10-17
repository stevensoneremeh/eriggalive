"use client"

import { useRef, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DialogTitle } from "@/components/ui/dialog"
import { Play, Pause, Maximize, Volume2, VolumeX } from "lucide-react"
import { Slider } from "@/components/ui/slider"
import { useLiveStream } from "@/contexts/live-stream-context"

export function LiveStreamPlayer() {
  const { currentStream, isPlaying, setIsPlaying } = useLiveStream()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [volume, setVolume] = useState(70)
  const [isMuted, setIsMuted] = useState(false)

  useEffect(() => {
    if (!videoRef.current) return

    if (isPlaying) {
      videoRef.current.play().catch(console.error)
    } else {
      videoRef.current.pause()
    }
  }, [isPlaying])

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume / 100
    }
  }, [volume])

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted
    }
  }, [isMuted])

  useEffect(() => {
    if (currentStream && videoRef.current) {
      videoRef.current.load()
    }
  }, [currentStream])

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const toggleFullscreen = () => {
    if (!videoRef.current) return
    
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      videoRef.current.requestFullscreen()
    }
  }

  if (!currentStream) {
    return (
      <Card className="w-full">
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">No live stream available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full overflow-hidden bg-black/90">
      <div className="relative aspect-video bg-black">
        <video
          ref={videoRef}
          className="w-full h-full"
          poster={currentStream.thumbnail_url || undefined}
          playsInline
        >
          <source src={currentStream.video_url} type="video/mp4" />
          <source src={currentStream.video_url} type="application/x-mpegURL" />
          Your browser does not support the video tag.
        </video>
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
        
        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={togglePlayPause}
              className="text-white hover:bg-white/20"
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </Button>

            <div className="flex items-center gap-2 flex-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMuted(!isMuted)}
                className="text-white hover:bg-white/20"
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
              <Slider
                value={[volume]}
                max={100}
                step={1}
                onValueChange={(value) => setVolume(value[0])}
                className="w-24"
              />
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
              className="text-white hover:bg-white/20"
            >
              <Maximize className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="text-white">
            <h3 className="font-semibold">{currentStream.title}</h3>
            {currentStream.description && (
              <p className="text-sm text-white/80">{currentStream.description}</p>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
