"use client"

import { useEffect, useState } from "react"
import { Play, Pause } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { clientDb, type BarSubmission } from "@/lib/db-operations"

export function TopBarsOfWeek() {
  const [topBars, setTopBars] = useState<BarSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [playingId, setPlayingId] = useState<number | null>(null)
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null)

  useEffect(() => {
    async function fetchTopBars() {
      try {
        setLoading(true)
        const { topBars, error } = await clientDb.getTopBarsOfWeek()

        if (error) throw new Error(error)

        setTopBars(topBars)
      } catch (err) {
        console.error("Error fetching top bars:", err)
        setError("Failed to load top bars")
      } finally {
        setLoading(false)
      }
    }

    fetchTopBars()
  }, [])

  const handlePlayPause = (bar: BarSubmission) => {
    if (audioElement) {
      audioElement.pause()
      setAudioElement(null)
    }

    if (playingId === bar.id) {
      setPlayingId(null)
    } else if (bar.audio_url) {
      const audio = new Audio(bar.audio_url)
      audio.addEventListener("ended", () => setPlayingId(null))
      setAudioElement(audio)
      audio.play()
      setPlayingId(bar.id)
    }
  }

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 animate-pulse">
            <div className="w-6 h-6 rounded-full bg-muted"></div>
            <div className="w-8 h-8 rounded-full bg-muted"></div>
            <div className="flex-1">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </div>
            <div className="w-8 h-8 rounded-full bg-muted"></div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p>{error}</p>
      </div>
    )
  }

  if (topBars.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p>No bars submitted this week. Be the first!</p>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      {topBars.map((bar, index) => (
        <div key={bar.id} className="flex items-center gap-3">
          <div className="w-6 h-6 flex items-center justify-center font-bold text-amber-500">#{index + 1}</div>
          <Avatar className="h-8 w-8">
            <AvatarImage src={bar.user.avatar_url || "/placeholder-user.jpg"} alt={bar.user.username} />
            <AvatarFallback>{bar.user.full_name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{bar.content}</p>
            <p className="text-xs text-muted-foreground">
              @{bar.user.username} • {bar.vote_count} votes
            </p>
          </div>
          {bar.audio_url && (
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => handlePlayPause(bar)}>
              {playingId === bar.id ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
          )}
        </div>
      ))}
    </div>
  )
}
