"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { voteOnPostAction } from "@/lib/community-actions-fixed"
import { ArrowBigUp, Loader2, Coins } from "lucide-react"
import { cn } from "@/lib/utils"

interface VoteButtonProps {
  postId: number
  postCreatorId: number
  initialVoteCount: number
  initialHasVoted: boolean
  currentUserId?: string
  onVoteSuccess?: (newVoteCount: number, newHasVoted: boolean) => void
  size?: "sm" | "md"
  className?: string
}

export function VoteButton({
  postId,
  postCreatorId,
  initialVoteCount,
  initialHasVoted,
  currentUserId,
  onVoteSuccess,
  size = "md",
  className,
}: VoteButtonProps) {
  const { user, profile, isAuthenticated } = useAuth()
  const { toast } = useToast()
  const [isVoting, startVoteTransition] = useTransition()
  const [optimisticVoteCount, setOptimisticVoteCount] = useState(initialVoteCount)
  const [optimisticHasVoted, setOptimisticHasVoted] = useState(initialHasVoted)

  const handleVote = () => {
    if (!isAuthenticated || !user || !profile) {
      toast({
        title: "Login Required",
        description: "Please login to vote on posts.",
        variant: "destructive",
      })
      return
    }

    if (profile.coins < 100) {
      toast({
        title: "Insufficient Coins",
        description: "You need at least 100 Erigga Coins to vote.",
        variant: "destructive",
      })
      return
    }

    startVoteTransition(async () => {
      // Optimistic update
      const originalVoteCount = optimisticVoteCount
      const originalHasVoted = optimisticHasVoted

      setOptimisticVoteCount(originalHasVoted ? originalVoteCount - 1 : originalVoteCount + 1)
      setOptimisticHasVoted(!originalHasVoted)

      try {
        // Get post creator's auth_user_id
        const { data: postCreatorData } = await fetch(`/api/users/${postCreatorId}`).then((r) => r.json())
        const postCreatorAuthId = postCreatorData?.auth_user_id

        if (!postCreatorAuthId) {
          throw new Error("Post creator not found")
        }

        const result = await voteOnPostAction(postId, postCreatorAuthId)

        if (result.success) {
          toast({
            title: result.voted ? "Vote Added!" : "Vote Removed!",
            description: result.message,
          })

          // Update parent component
          if (onVoteSuccess) {
            onVoteSuccess(optimisticVoteCount, optimisticHasVoted)
          }
        } else {
          // Revert optimistic update on error
          setOptimisticVoteCount(originalVoteCount)
          setOptimisticHasVoted(originalHasVoted)

          toast({
            title: "Vote Failed",
            description: result.error,
            variant: "destructive",
          })
        }
      } catch (error: any) {
        // Revert optimistic update on error
        setOptimisticVoteCount(originalVoteCount)
        setOptimisticHasVoted(originalHasVoted)

        console.error("Vote error:", error)
        toast({
          title: "Vote Failed",
          description: error.message || "Something went wrong",
          variant: "destructive",
        })
      }
    })
  }

  const isOwnPost = profile?.id === postCreatorId

  return (
    <Button
      variant="ghost"
      size={size === "sm" ? "sm" : "default"}
      className={cn(
        "flex items-center gap-2 text-muted-foreground hover:text-primary",
        optimisticHasVoted && "text-primary",
        isOwnPost && "opacity-50 cursor-not-allowed",
        className,
      )}
      onClick={handleVote}
      disabled={isVoting || isOwnPost || !isAuthenticated}
    >
      {isVoting ? (
        <Loader2 className={cn("animate-spin", size === "sm" ? "h-4 w-4" : "h-5 w-5")} />
      ) : (
        <ArrowBigUp className={cn(size === "sm" ? "h-4 w-4" : "h-5 w-5", optimisticHasVoted && "fill-current")} />
      )}
      <span className="font-medium">{optimisticVoteCount}</span>
      <Coins className={cn("text-yellow-500", size === "sm" ? "h-3 w-3" : "h-4 w-4")} />
    </Button>
  )
}
