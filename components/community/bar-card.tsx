"use client"

import { useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { Play, Pause, ArrowUp } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { UserTierBadge } from "@/components/user-tier-badge"
import type { BarSubmission } from "@/lib/db-operations"

interface BarCardProps {
  bar: BarSubmission
  rank?: number
  onVote?: (barId: number, amount: number) => void
}

export function BarCard({ bar, rank, onVote }: BarCardProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null)
  const [voteAmount, setVoteAmount] = useState(1)

  const handlePlayPause = () => {
    if (!audioElement && bar.audio_url) {
      const audio = new Audio(bar.audio_url)
      audio.addEventListener("ended", () => setIsPlaying(false))
      setAudioElement(audio)
      audio.play()
      setIsPlaying(true)
    } else if (audioElement) {
      if (isPlaying) {
        audioElement.pause()
      } else {
        audioElement.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const formattedDate = formatDistanceToNow(new Date(bar.created_at), { addSuffix: true })

  return (
    <Card className={rank ? "border-l-4 border-l-amber-500" : ""}>
      <CardHeader className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {rank && (
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/10 text-amber-500 font-bold">
                {rank}
              </div>
            )}
            <Avatar>
              <AvatarImage src={bar.user.avatar_url || "/placeholder-user.jpg"} alt={bar.user.username} />
              <AvatarFallback>{bar.user.full_name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-medium">{bar.user.full_name}</span>
                <UserTierBadge tier={bar.user.tier} size="sm" />
              </div>
              <span className="text-xs text-muted-foreground">
                @{bar.user.username} • {formattedDate}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-amber-500 font-medium flex items-center">
              <ArrowUp className="h-4 w-4 mr-1" />
              {bar.vote_count}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-0">
        <div className="whitespace-pre-wrap mb-4">{bar.content}</div>

        {bar.audio_url && (
          <div className="bg-muted/30 rounded-md p-3 flex items-center gap-3">
            <Button variant="outline" size="icon" className="h-10 w-10 rounded-full" onClick={handlePlayPause}>
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <div className="flex-1">
              <div className="h-2 bg-muted-foreground/20 rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: isPlaying ? "30%" : "0%" }}></div>
              </div>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-0 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setVoteAmount((prev) => Math.max(1, prev - 1))}>
            -
          </Button>
          <span className="w-8 text-center">{voteAmount}</span>
          <Button variant="outline" size="sm" onClick={() => setVoteAmount((prev) => prev + 1)}>
            +
          </Button>
        </div>

        <Button
          variant="default"
          size="sm"
          className="bg-amber-500 hover:bg-amber-600"
          onClick={() => onVote?.(bar.id, voteAmount)}
        >
          Vote with {voteAmount} {voteAmount === 1 ? "Coin" : "Coins"}
        </Button>
      </CardFooter>
    </Card>
  )
}
