"use client"

import { useState } from "react"
import { useRadio } from "@/contexts/radio-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, ChevronUp, ChevronDown, Radio } from "lucide-react"

export function FloatingRadioPlayer() {
  const {
    isPlaying,
    currentTrack,
    volume,
    isMuted,
    isLoading,
    togglePlay,
    setVolume,
    toggleMute,
    nextTrack,
    previousTrack,
  } = useRadio()

  const [isExpanded, setIsExpanded] = useState(false)

  if (!currentTrack) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-80 shadow-lg">
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Radio className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Erigga Radio</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)}>
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </Button>
          </div>

          {/* Track Info */}
          <div className="mb-3">
            <p className="text-sm font-medium truncate">{currentTrack.title}</p>
            <p className="text-xs text-muted-foreground truncate">{currentTrack.artist}</p>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center space-x-2 mb-3">
            <Button variant="ghost" size="sm" onClick={previousTrack} disabled={isLoading}>
              <SkipBack className="h-4 w-4" />
            </Button>

            <Button variant="default" size="sm" onClick={togglePlay} disabled={isLoading}>
              {isLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
              ) : isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>

            <Button variant="ghost" size="sm" onClick={nextTrack} disabled={isLoading}>
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>

          {/* Expanded Controls */}
          {isExpanded && (
            <div className="space-y-3">
              {/* Volume Control */}
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" onClick={toggleMute}>
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
                <Slider
                  value={[isMuted ? 0 : volume * 100]}
                  onValueChange={(value) => setVolume(value[0] / 100)}
                  max={100}
                  step={1}
                  className="flex-1"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
