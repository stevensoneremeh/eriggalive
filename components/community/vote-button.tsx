"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Heart } from "lucide-react"
import { voteOnPostAction } from "@/lib/community-actions"
import { useToast } from "@/components/ui/use-toast"

interface VoteButtonProps {
  postId: number
  voteCount: number
  hasVoted?: boolean
}

export function VoteButton({ postId, voteCount, hasVoted = false }: VoteButtonProps) {
  const [isVoting, setIsVoting] = useState(false)
  const [voted, setVoted] = useState(hasVoted)
  const [count, setCount] = useState(voteCount)
  const { toast } = useToast()

  async function handleVote() {
    setIsVoting(true)

    try {
      const result = await voteOnPostAction(postId)

      if (result.success) {
        if (result.action === "added") {
          setVoted(true)
          setCount((prev) => prev + 1)
        } else {
          setVoted(false)
          setCount((prev) => prev - 1)
        }
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to vote",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
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
        voted ? "text-red-500 hover:text-red-600 bg-red-50" : "hover:text-red-500 hover:bg-red-50"
      }`}
    >
      <Heart className={`h-4 w-4 ${voted ? "fill-current" : ""}`} />
      <span className="font-medium">{count}</span>
    </Button>
  )
}
