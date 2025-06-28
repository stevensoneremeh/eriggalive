"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Heart, HeartOff } from "lucide-react"
import { voteOnPost } from "@/lib/community-actions"
import { toast } from "sonner"

interface VoteButtonProps {
  postId: number
  initialVoted: boolean
  initialVoteCount: number
}

export function VoteButton({ postId, initialVoted, initialVoteCount }: VoteButtonProps) {
  const [voted, setVoted] = useState(initialVoted)
  const [voteCount, setVoteCount] = useState(initialVoteCount)
  const [isPending, startTransition] = useTransition()

  const handleVote = () => {
    startTransition(async () => {
      const result = await voteOnPost(postId)

      if (result.success) {
        setVoted(result.voted)
        setVoteCount((prev) => (result.voted ? prev + 1 : prev - 1))
      } else {
        toast.error(result.error || "Failed to vote")
      }
    })
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleVote} disabled={isPending} className="flex items-center gap-2">
      {voted ? <Heart className="h-4 w-4 fill-red-500 text-red-500" /> : <HeartOff className="h-4 w-4" />}
      <span>{voteCount}</span>
    </Button>
  )
}
