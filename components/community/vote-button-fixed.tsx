"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Heart } from 'lucide-react'
import { voteOnPostAction } from "@/lib/community-actions"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"

interface VoteButtonProps {
  postId: number
  postCreatorId: number
  initialVoteCount: number
  initialHasVoted: boolean
  currentUserId?: string
}

export function VoteButton({
  postId,
  postCreatorId,
  initialVoteCount,
  initialHasVoted,
  currentUserId,
}: VoteButtonProps) {
  const [voteCount, setVoteCount] = useState(initialVoteCount)
  const [hasVoted, setHasVoted] = useState(initialHasVoted)
  const [isVoting, setIsVoting] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()

  const handleVote = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to vote on posts.",
        variant: "destructive",
      })
      return
    }

    if (isVoting) return

    setIsVoting(true)

    try {
      const result = await voteOnPostAction(postId, user.id)

      if (result.success) {
        if (result.voted) {
          setVoteCount((prev) => prev + 1)
          setHasVoted(true)
        } else {
          setVoteCount((prev) => Math.max(0, prev - 1))
          setHasVoted(false)
        }

        toast({
          title: "Success",
          description: result.message,
        })
      } else {
        toast({
          title: "Vote Failed",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("Vote error:", error)
      toast({
        title: "Error",
        description: "Something went wrong while voting.",
        variant: "destructive",
      })
    } finally {
      setIsVoting(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleVote}
      disabled={isVoting}
      className={`flex items-center gap-2 transition-colors ${
        hasVoted
          ? "text-red-500 hover:text-red-600"
          : "text-muted-foreground hover:text-red-500"
      }`}
    >
      <Heart className={`h-4 w-4 ${hasVoted ? "fill-current" : ""}`} />
      <span className="font-medium">{voteCount}</span>
    </Button>
  )
}
