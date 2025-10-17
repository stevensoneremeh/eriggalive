"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Coins } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { createClient } from "@/lib/supabase/client"
import { ArrowBigUp, ArrowBigDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface VoteButtonsProps {
  postId?: number
  commentId?: number
  initialUpvotes: number
  initialDownvotes: number
  initialCoinVotes: number
  userVoted?: {
    upvote: boolean
    downvote: boolean
    coins: number
  }
  onVoteChange?: (newVotes: { upvotes: number; downvotes: number; coinVotes: number }) => void
  upvotes: number
  downvotes: number
  userVote?: "up" | "down" | null
  onVote: (voteType: "up" | "down") => void
  size?: "sm" | "md"
  className?: string
}

export function VoteButtons({
  postId,
  commentId,
  initialUpvotes,
  initialDownvotes,
  initialCoinVotes,
  userVoted = { upvote: false, downvote: false, coins: 0 },
  onVoteChange,
  upvotes,
  downvotes,
  userVote,
  onVote,
  size = "md",
  className,
}: VoteButtonsProps) {
  const [upvotesState, setUpvotes] = useState(initialUpvotes)
  const [downvotesState, setDownvotes] = useState(initialDownvotes)
  const [coinVotes, setCoinVotes] = useState(initialCoinVotes)
  const [userVotes, setUserVotes] = useState(userVoted)
  const [coinDialogOpen, setCoinDialogOpen] = useState(false)
  const [coinsToSpend, setCoinsToSpend] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { user, profile } = useAuth()
  const supabase = createClient()

  const handleVoteSupabase = async (voteType: "upvote" | "downvote") => {
    if (!user || !profile) {
      // Redirect to login or show login dialog
      window.location.href = "/login?redirect=community"
      return
    }

    try {
      setIsSubmitting(true)

      // Determine if we're voting on a post or comment
      const isPost = !!postId
      const contentId = postId || commentId

      if (!contentId) return

      // Check if user already voted this way
      const alreadyVoted = voteType === "upvote" ? userVotes.upvote : userVotes.downvote

      if (alreadyVoted) {
        // Remove the vote
        const { error } = await supabase
          .from(isPost ? "community_post_votes" : "community_comment_votes")
          .delete()
          .eq(isPost ? "post_id" : "comment_id", contentId)
          .eq("user_id", profile.id)
          .eq("vote_type", voteType)

        if (error) throw error

        // Update the vote count in the database
        const { error: updateError } = await supabase
          .from(isPost ? "community_posts" : "community_comments")
          .update({
            [voteType === "upvote" ? "upvotes" : "downvotes"]:
              voteType === "upvote" ? upvotesState - 1 : downvotesState - 1,
          })
          .eq("id", contentId)

        if (updateError) throw updateError

        // Update local state
        if (voteType === "upvote") {
          setUpvotes((prev) => prev - 1)
          setUserVotes((prev) => ({ ...prev, upvote: false }))
        } else {
          setDownvotes((prev) => prev - 1)
          setUserVotes((prev) => ({ ...prev, downvote: false }))
        }
      } else {
        // Add the vote
        const { error } = await supabase.from(isPost ? "community_post_votes" : "community_comment_votes").insert({
          [isPost ? "post_id" : "comment_id"]: contentId,
          user_id: profile.id,
          vote_type: voteType,
        })

        if (error) throw error

        // If user voted the opposite way before, remove that vote
        const oppositeVoteType = voteType === "upvote" ? "downvote" : "upvote"
        const hasOppositeVote = voteType === "upvote" ? userVotes.downvote : userVotes.upvote

        if (hasOppositeVote) {
          const { error: removeError } = await supabase
            .from(isPost ? "community_post_votes" : "community_comment_votes")
            .delete()
            .eq(isPost ? "post_id" : "comment_id", contentId)
            .eq("user_id", profile.id)
            .eq("vote_type", oppositeVoteType)

          if (removeError) throw removeError
        }

        // Update the vote count in the database
        const updates: Record<string, number> = {
          [voteType === "upvote" ? "upvotes" : "downvotes"]:
            voteType === "upvote" ? upvotesState + 1 : downvotesState + 1,
        }

        if (hasOppositeVote) {
          updates[voteType === "upvote" ? "downvotes" : "upvotes"] =
            voteType === "upvote" ? downvotesState - 1 : upvotesState - 1
        }

        const { error: updateError } = await supabase
          .from(isPost ? "community_posts" : "community_comments")
          .update(updates)
          .eq("id", contentId)

        if (updateError) throw updateError

        // Update local state
        if (voteType === "upvote") {
          setUpvotes((prev) => prev + 1)
          setUserVotes((prev) => ({ ...prev, upvote: true }))

          if (hasOppositeVote) {
            setDownvotes((prev) => prev - 1)
            setUserVotes((prev) => ({ ...prev, downvote: false }))
          }
        } else {
          setDownvotes((prev) => prev + 1)
          setUserVotes((prev) => ({ ...prev, downvote: true }))

          if (hasOppositeVote) {
            setUpvotes((prev) => prev - 1)
            setUserVotes((prev) => ({ ...prev, upvote: false }))
          }
        }
      }

      // Notify parent component about vote change
      if (onVoteChange) {
        onVoteChange({
          upvotes:
            voteType === "upvote"
              ? alreadyVoted
                ? upvotesState - 1
                : upvotesState + 1
              : userVotes.upvote && !alreadyVoted
                ? upvotesState - 1
                : upvotesState,
          downvotes:
            voteType === "downvote"
              ? alreadyVoted
                ? downvotesState - 1
                : downvotesState + 1
              : userVotes.downvote && !alreadyVoted
                ? downvotesState - 1
                : downvotesState,
          coinVotes,
        })
      }
    } catch (error) {
      console.error("Error voting:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCoinVote = async () => {
    if (!user || !profile) {
      window.location.href = "/login?redirect=community"
      return
    }

    if (coinsToSpend <= 0 || coinsToSpend > profile.coins) {
      return
    }

    try {
      setIsSubmitting(true)

      // Determine if we're voting on a post or comment
      const isPost = !!postId
      const contentId = postId || commentId

      if (!contentId) return

      // Spend coins
      const success = await spendCoins(coinsToSpend, isPost ? "post_vote" : "comment_vote", contentId)

      if (!success) {
        throw new Error("Failed to spend coins")
      }

      // Record the coin vote
      const { error } = await supabase.from(isPost ? "community_post_votes" : "community_comment_votes").insert({
        [isPost ? "post_id" : "comment_id"]: contentId,
        user_id: profile.id,
        vote_type: "coin",
        coins_spent: coinsToSpend,
      })

      if (error) throw error

      // Update the coin vote count in the database
      const { error: updateError } = await supabase
        .from(isPost ? "community_posts" : "community_comments")
        .update({
          coin_votes: coinVotes + coinsToSpend,
        })
        .eq("id", contentId)

      if (updateError) throw updateError

      // Update local state
      setCoinVotes((prev) => prev + coinsToSpend)
      setUserVotes((prev) => ({ ...prev, coins: prev.coins + coinsToSpend }))

      // Notify parent component about vote change
      if (onVoteChange) {
        onVoteChange({
          upvotes: upvotesState,
          downvotes: downvotesState,
          coinVotes: coinVotes + coinsToSpend,
        })
      }

      // Close the dialog
      setCoinDialogOpen(false)
    } catch (error) {
      console.error("Error coin voting:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Helper function to spend coins
  const spendCoins = async (amount: number, contentType: string, contentId: number): Promise<boolean> => {
    if (!profile) return false

    try {
      // Create a transaction record
      const { data: transaction, error: transactionError } = await supabase
        .from("coin_transactions")
        .insert({
          user_id: profile.id,
          amount: -amount,
          transaction_type: "content_access",
          payment_method: "coins",
          status: "completed",
          metadata: { content_type: contentType, content_id: contentId },
        })
        .select()
        .single()

      if (transactionError) {
        console.error("Error creating transaction:", transactionError)
        return false
      }

      // Update user's coin balance
      const newBalance = profile.coins - amount
      const { error: updateError } = await supabase.from("users").update({ coins: newBalance }).eq("id", profile.id)

      if (updateError) {
        console.error("Error updating coin balance:", updateError)
        return false
      }

      return true
    } catch (err) {
      console.error("Error in spendCoins:", err)
      return false
    }
  }

  const handleVote = (voteType: "up" | "down") => {
    if (!user) {
      // Could show a login prompt here
      alert("Please sign in to vote")
      return
    }
    onVote(voteType)
  }

  const totalVotes = upvotes - downvotes

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        variant="ghost"
        size={size === "sm" ? "sm" : "default"}
        className={cn(
          "px-2 text-gray-600 dark:text-gray-300 hover:text-brand-teal dark:hover:text-brand-lime",
          userVote === "up" && "text-brand-teal dark:text-brand-lime",
        )}
        onClick={() => handleVote("up")}
      >
        <ArrowBigUp
          className={cn(
            "h-5 w-5",
            size === "sm" && "h-4 w-4",
            userVote === "up" && "fill-brand-teal dark:fill-brand-lime",
          )}
        />
      </Button>

      <span
        className={cn(
          "font-medium",
          size === "sm" ? "text-sm" : "text-base",
          totalVotes > 0 && "text-brand-teal dark:text-brand-lime",
          totalVotes < 0 && "text-red-500",
          totalVotes === 0 && "text-gray-500 dark:text-gray-400",
        )}
      >
        {totalVotes}
      </span>

      <Button
        variant="ghost"
        size={size === "sm" ? "sm" : "default"}
        className={cn(
          "px-2 text-gray-600 dark:text-gray-300 hover:text-red-500",
          userVote === "down" && "text-red-500",
        )}
        onClick={() => handleVote("down")}
      >
        <ArrowBigDown className={cn("h-5 w-5", size === "sm" && "h-4 w-4", userVote === "down" && "fill-red-500")} />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        className={`${userVotes.coins > 0 ? "text-gold-400" : "text-muted-foreground"} hover:text-gold-400`}
        onClick={() => setCoinDialogOpen(true)}
        disabled={isSubmitting || !user}
      >
        <Coins className={`h-4 w-4 mr-1 ${userVotes.coins > 0 ? "fill-gold-400" : ""}`} />
        {coinVotes}
      </Button>

      <Dialog open={coinDialogOpen} onOpenChange={setCoinDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vote with Erigga Coins</DialogTitle>
            <DialogDescription>
              Use your Erigga Coins to give this content a powerful boost. Coin votes have more impact!
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <span>Your coin balance:</span>
              <span className="font-bold">{profile?.coins || 0} coins</span>
            </div>

            <div className="space-y-2">
              <label htmlFor="coins" className="text-sm font-medium">
                How many coins would you like to spend?
              </label>
              <Input
                id="coins"
                type="number"
                min={1}
                max={profile?.coins || 0}
                value={coinsToSpend}
                onChange={(e) => setCoinsToSpend(Number.parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCoinDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCoinVote}
              disabled={isSubmitting || coinsToSpend <= 0 || coinsToSpend > (profile?.coins || 0)}
              className="bg-gold-400 hover:bg-gold-500 text-black"
            >
              <Coins className="h-4 w-4 mr-2" />
              Vote with {coinsToSpend} {coinsToSpend === 1 ? "coin" : "coins"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
