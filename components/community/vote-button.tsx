"use client"

import { useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Coins, ThumbsUp, Loader2 } from "lucide-react"
import { voteOnPostAction } from "@/lib/community-actions"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"

interface VoteButtonProps {
  postId: number
  postCreatorId: string
  initialVoteCount: number
  initialHasVoted: boolean
  currentUserId?: string
  onVoteSuccess: (newVoteCount: number, newHasVoted: boolean) => void
}

const VOTE_COIN_COST = 100

export function VoteButton({
  postId,
  postCreatorId,
  initialVoteCount,
  initialHasVoted,
  currentUserId,
  onVoteSuccess,
}: VoteButtonProps) {
  const { toast } = useToast()
  const { profile, isAuthenticated, navigationManager } = useAuth()
  const [isVoting, startVoteTransition] = useTransition()

  const handleVote = () => {
    if (!isAuthenticated || !currentUserId) {
      toast({ title: "Authentication Required", description: "Please sign in to vote.", variant: "destructive" })
      if (navigationManager) navigationManager.navigateTo("/login?redirect=/community") // Redirect to login
      return
    }

    if (currentUserId === postCreatorId) {
      toast({ title: "Self Vote", description: "You cannot vote on your own post.", variant: "default" })
      return
    }

    if (initialHasVoted) {
      toast({ title: "Already Voted", description: "You have already voted on this post.", variant: "default" })
      return
    }

    if (profile && profile.coins < VOTE_COIN_COST) {
      toast({
        title: "Insufficient Coins",
        description: `You need ${VOTE_COIN_COST} Erigga Coins to vote.`,
        variant: "destructive",
      })
      return
    }

    startVoteTransition(async () => {
      // Optimistic update
      onVoteSuccess(initialVoteCount + 1, true)

      const result = await voteOnPostAction(postId, postCreatorId)
      if (result.success) {
        toast({ title: "Vote Cast!", description: result.message })
        // State already updated optimistically. If server fails, we'd revert.
      } else {
        // Revert optimistic update on failure
        onVoteSuccess(initialVoteCount, false)
        toast({
          title: "Vote Failed",
          description: result.error || "Could not cast your vote.",
          variant: "destructive",
        })
      }
    })
  }

  const canVote =
    isAuthenticated &&
    currentUserId &&
    currentUserId !== postCreatorId &&
    !initialHasVoted &&
    (profile?.coins ?? 0) >= VOTE_COIN_COST

  return (
    <Button
      variant={initialHasVoted ? "default" : "outline"}
      size="sm"
      onClick={handleVote}
      disabled={
        isVoting ||
        initialHasVoted ||
        !isAuthenticated ||
        (profile && profile.coins < VOTE_COIN_COST && !initialHasVoted)
      }
      className={cn(
        "transition-all duration-150 ease-in-out group",
        initialHasVoted && "bg-primary text-primary-foreground cursor-not-allowed",
        !initialHasVoted && canVote && "hover:bg-primary/10 hover:border-primary hover:text-primary",
        !canVote && !initialHasVoted && "opacity-70 cursor-not-allowed",
      )}
      title={
        initialHasVoted
          ? "You've already voted"
          : !isAuthenticated
            ? "Login to vote"
            : currentUserId === postCreatorId
              ? "Cannot vote on your own post"
              : (profile?.coins ?? 0) < VOTE_COIN_COST
                ? `Need ${VOTE_COIN_COST} coins`
                : `Vote (${VOTE_COIN_COST} Coins)`
      }
    >
      {isVoting ? (
        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
      ) : (
        <ThumbsUp className={cn("mr-1.5 h-4 w-4", initialHasVoted && "fill-current")} />
      )}
      {initialVoteCount}
      {!initialHasVoted && <Coins className="ml-1.5 h-3 w-3 opacity-70 group-hover:opacity-100 transition-opacity" />}
    </Button>
  )
}
