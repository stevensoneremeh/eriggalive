"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Coins, MessageCircle, Trophy, AlertCircle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { useCoinManager } from "@/lib/coin-manager"
import { useContentManager } from "@/lib/content-manager"
import { AudioPlayer } from "@/components/community/audio-player"
import { formatDistanceToNow } from "date-fns"

interface BarSubmission {
  id: number
  user_id: string
  content: string
  media_urls: string[]
  media_types: string[]
  like_count: number
  comment_count: number
  created_at: string
  users: {
    id: string
    username: string
    full_name: string
    avatar_url: string
    tier: string
    coins: number
  }
  user_vote?: {
    amount: number
    created_at: string
  }
}

interface BarsSectionProps {
  searchQuery: string
  filterType: string
}

export function BarsSection({ searchQuery, filterType }: BarsSectionProps) {
  const [bars, setBars] = useState<BarSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [votingBarId, setVotingBarId] = useState<number | null>(null)
  const [voteAmount, setVoteAmount] = useState(5)
  const [isVoting, setIsVoting] = useState(false)

  const { profile, isAuthenticated } = useAuth()
  const { toast } = useToast()
  const { deductCoins, addCoins, currentBalance } = useCoinManager()
  const contentManager = useContentManager()

  useEffect(() => {
    fetchBars()
  }, [searchQuery, filterType])

  const fetchBars = async () => {
    setLoading(true)
    try {
      const { success, posts, error } = await contentManager.getPosts({
        type: "bars",
        limit: 20,
        searchQuery: searchQuery || undefined,
      })

      if (success && posts) {
        setBars(posts as BarSubmission[])
      } else {
        toast({
          title: "Error",
          description: error || "Failed to load bars",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching bars:", error)
      toast({
        title: "Error",
        description: "Failed to load bars",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleVote = async (barId: number, amount: number) => {
    if (!isAuthenticated || !profile) {
      toast({
        title: "Sign in required",
        description: "Please sign in to vote on bars",
        variant: "destructive",
      })
      return
    }

    if (currentBalance < amount) {
      toast({
        title: "Insufficient coins",
        description: `You need ${amount} coins to vote. Your current balance is ${currentBalance} coins.`,
        variant: "destructive",
      })
      return
    }

    setIsVoting(true)

    try {
      // Deduct coins from user
      const deductSuccess = await deductCoins(amount, {
        transaction_type: "vote",
        description: `Voted on bar #${barId}`,
        metadata: { bar_id: barId, vote_amount: amount },
      })

      if (!deductSuccess) {
        throw new Error("Failed to deduct coins")
      }

      // Find the bar author and add coins to their balance
      const bar = bars.find((b) => b.id === barId)
      if (bar) {
        await addCoins(amount, {
          transaction_type: "post_reward",
          description: `Received vote on bar #${barId}`,
          metadata: { bar_id: barId, voter_id: profile.id },
        })
      }

      // Update local state
      setBars((prev) =>
        prev.map((bar) =>
          bar.id === barId
            ? {
                ...bar,
                like_count: bar.like_count + amount,
                user_vote: { amount, created_at: new Date().toISOString() },
              }
            : bar,
        ),
      )

      toast({
        title: "Vote successful!",
        description: `You voted with ${amount} coins. The creator will receive these coins as a reward.`,
      })

      setVotingBarId(null)
      setVoteAmount(5)
    } catch (error) {
      console.error("Voting error:", error)
      toast({
        title: "Vote failed",
        description: "Please try again",
        variant: "destructive",
      })
    } finally {
      setIsVoting(false)
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case "blood":
        return "bg-red-500"
      case "elder":
        return "bg-purple-500"
      case "pioneer":
        return "bg-blue-500"
      case "mod":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  const getTierBadge = (tier: string) => {
    const color = getTierColor(tier)
    return <Badge className={`${color} text-white text-xs`}>{tier}</Badge>
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-muted"></div>
              <div className="flex-1">
                <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/6"></div>
              </div>
            </div>
            <div className="space-y-2 mb-4">
              <div className="h-4 bg-muted rounded w-full"></div>
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </div>
            <div className="h-16 bg-muted rounded mb-4"></div>
            <div className="flex items-center gap-4">
              <div className="h-8 bg-muted rounded w-20"></div>
              <div className="h-8 bg-muted rounded w-16"></div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Competition Header */}
      <Card className="bg-gradient-to-r from-orange-500/10 via-lime-500/10 to-teal-500/10 border-orange-500/30">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-orange-500 to-lime-500 rounded-lg">
                <Trophy className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Bars Competition</h3>
                <p className="text-muted-foreground">Vote for the best bars and support creators!</p>
              </div>
            </div>
            <Badge className="bg-gradient-to-r from-orange-500 to-lime-500 text-white">Live</Badge>
          </div>
        </div>
      </Card>

      {bars.map((bar) => (
        <Card
          key={bar.id}
          className="overflow-hidden hover:shadow-lg transition-all duration-200 border-l-4 border-l-orange-500"
        >
          <div className="p-6">
            {/* User Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={bar.users.avatar_url || "/placeholder.svg"} alt={bar.users.username} />
                  <AvatarFallback>{bar.users.full_name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold truncate">{bar.users.full_name}</p>
                    {getTierBadge(bar.users.tier)}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>@{bar.users.username}</span>
                    <span>•</span>
                    <span>{formatDistanceToNow(new Date(bar.created_at), { addSuffix: true })}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-sm font-medium text-orange-600">
                  <Trophy className="h-4 w-4" />
                  <span>{bar.like_count}</span>
                </div>
                <p className="text-xs text-muted-foreground">coins earned</p>
              </div>
            </div>

            {/* Bar Content */}
            <div className="mb-4 p-4 bg-gradient-to-r from-orange-50 to-lime-50 dark:from-orange-950/20 dark:to-lime-950/20 rounded-lg border">
              <p className="text-foreground leading-relaxed font-medium italic whitespace-pre-wrap">"{bar.content}"</p>
            </div>

            {/* Audio Player */}
            {bar.media_urls.length > 0 && bar.media_types.includes("audio") && (
              <div className="mb-4">
                <AudioPlayer
                  src={bar.media_urls[bar.media_types.indexOf("audio")]}
                  title={`${bar.users.full_name}'s bars`}
                  artist={bar.users.username}
                />
              </div>
            )}

            {/* User Vote Status */}
            {bar.user_vote && (
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                  <Coins className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    You voted with {bar.user_vote.amount} coins on{" "}
                    {formatDistanceToNow(new Date(bar.user_vote.created_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setVotingBarId(bar.id)}
                  disabled={!isAuthenticated || isVoting}
                  className="bg-gradient-to-r from-orange-500/10 to-lime-500/10 hover:from-orange-500/20 hover:to-lime-500/20 border-orange-500/30"
                >
                  <Coins className="h-4 w-4 mr-2" />
                  Vote ({bar.like_count})
                </Button>
                <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                  <MessageCircle className="h-4 w-4" />
                  {bar.comment_count}
                </Button>
              </div>
              <div className="text-sm text-muted-foreground">Min: 5 coins • Your balance: {currentBalance}</div>
            </div>
          </div>
        </Card>
      ))}

      {bars.length === 0 && !loading && (
        <div className="text-center py-12">
          <Trophy className="mx-auto h-16 w-16 text-muted-foreground/50 mb-4" />
          <h3 className="text-xl font-semibold mb-2">No bars yet</h3>
          <p className="text-muted-foreground">Be the first to drop some fire bars! 🔥</p>
        </div>
      )}

      {/* Vote Dialog */}
      <Dialog open={votingBarId !== null} onOpenChange={(open) => !open && setVotingBarId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vote with Erigga Coins</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <AlertCircle className="h-5 w-5 text-blue-500" />
              <div className="text-sm">
                <p className="font-medium">How voting works:</p>
                <p className="text-muted-foreground">
                  Your coins go directly to the creator as a reward for their bars!
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vote-amount">Vote amount (coins)</Label>
              <Input
                id="vote-amount"
                type="number"
                min={5}
                max={currentBalance}
                value={voteAmount}
                onChange={(e) => setVoteAmount(Math.max(5, Number.parseInt(e.target.value) || 5))}
              />
              <p className="text-xs text-muted-foreground">Your balance: {currentBalance} coins • Minimum: 5 coins</p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setVotingBarId(null)} disabled={isVoting}>
                Cancel
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-orange-500 to-lime-500 hover:from-orange-600 hover:to-lime-600 text-white"
                onClick={() => votingBarId && handleVote(votingBarId, voteAmount)}
                disabled={isVoting || voteAmount < 5 || voteAmount > currentBalance}
              >
                {isVoting ? "Voting..." : `Vote ${voteAmount} coins`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
