"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Coins, MessageSquare, ArrowUp, Trophy, FlameIcon as Fire, Mic, Award } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useAuth } from "@/contexts/auth-context"
import { MediaPlayer } from "@/components/community/media-player"
import { UserTierBadge } from "@/components/user-tier-badge"
import { useToast } from "@/components/ui/use-toast"

interface BarsSectionProps {
  searchQuery: string
  filterType: string
}

interface BarSubmission {
  id: string
  user: {
    id: string
    username: string
    fullName: string
    avatar: string
    tier: string
    coinBalance: number
    isVerified: boolean
  }
  content: string
  audioUrl?: string
  createdAt: string
  votes: number
  coinsEarned: number
  comments: number
  hasVoted: boolean
  userVoteAmount: number
  rank?: number
  isWeeklyTop: boolean
}

export function BarsSection({ searchQuery, filterType }: BarsSectionProps) {
  const [bars, setBars] = useState<BarSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [votingBar, setVotingBar] = useState<string | null>(null)
  const [voteAmount, setVoteAmount] = useState(1)
  const { profile, isAuthenticated } = useAuth()
  const { toast } = useToast()

  // Mock data for preview
  const mockBars: BarSubmission[] = [
    {
      id: "bar1",
      user: {
        id: "user1",
        username: "lyric_king",
        fullName: "David Okonkwo",
        avatar: "/placeholder.svg?height=40&width=40",
        tier: "pioneer",
        coinBalance: 2450,
        isVerified: true,
      },
      content:
        "Paper boy with the paper flow, money talks but I speak it slow\nWarri boy with the delta soul, every bar that I drop is gold\nErigga taught me how to be real, now I'm spitting with that same feel",
      audioUrl: "/placeholder-audio.mp3",
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      votes: 89,
      coinsEarned: 1340,
      comments: 23,
      hasVoted: false,
      userVoteAmount: 0,
      rank: 1,
      isWeeklyTop: true,
    },
    {
      id: "bar2",
      user: {
        id: "user2",
        username: "warri_wordsmith",
        fullName: "Grace Effiong",
        avatar: "/placeholder.svg?height=40&width=40",
        tier: "elder",
        coinBalance: 1890,
        isVerified: false,
      },
      content:
        "From the streets of Warri to the world stage bright\nErigga's legacy burning like a guiding light\nEvery verse I write carries that delta pride\nPaper boy inspiration, can't be denied",
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      votes: 67,
      coinsEarned: 890,
      comments: 18,
      hasVoted: true,
      userVoteAmount: 5,
      rank: 2,
      isWeeklyTop: true,
    },
    {
      id: "bar3",
      user: {
        id: "user3",
        username: "delta_dreamer",
        fullName: "Emmanuel Okoro",
        avatar: "/placeholder.svg?height=40&width=40",
        tier: "blood_brotherhood",
        coinBalance: 3200,
        isVerified: true,
      },
      content:
        "Industry nights and paper boy dreams\nErigga showed us what success really means\nFrom the bottom to the top, never lost his roots\nThat's the kind of artist that the culture salutes",
      audioUrl: "/placeholder-audio.mp3",
      createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      votes: 45,
      coinsEarned: 670,
      comments: 12,
      hasVoted: false,
      userVoteAmount: 0,
      isWeeklyTop: false,
    },
  ]

  useEffect(() => {
    const fetchBars = async () => {
      setLoading(true)
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setBars(mockBars)
      setLoading(false)
    }

    fetchBars()
  }, [searchQuery, filterType])

  const handleVote = async (barId: string, amount: number) => {
    if (!isAuthenticated || !profile) {
      toast({
        title: "Sign in required",
        description: "Please sign in to vote on bars",
        variant: "destructive",
      })
      return
    }

    if (profile.coins < amount) {
      toast({
        title: "Insufficient coins",
        description: "You don't have enough coins to vote",
        variant: "destructive",
      })
      return
    }

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500))

      setBars((prev) =>
        prev.map((bar) =>
          bar.id === barId
            ? {
                ...bar,
                votes: bar.votes + amount,
                coinsEarned: bar.coinsEarned + amount,
                hasVoted: true,
                userVoteAmount: bar.userVoteAmount + amount,
              }
            : bar,
        ),
      )

      toast({
        title: "Vote successful!",
        description: `You voted with ${amount} coins`,
      })

      setVotingBar(null)
      setVoteAmount(1)
    } catch (error) {
      toast({
        title: "Vote failed",
        description: "Please try again",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="overflow-hidden">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-8 w-20" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-12 w-full rounded-md" />
            </CardContent>
            <CardFooter>
              <div className="flex gap-4">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-24" />
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Top Bars Header */}
      <Card className="bg-gradient-to-r from-orange-500/10 via-lime-500/10 to-teal-500/10 border-orange-500/30">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-orange-500 to-lime-500 rounded-lg">
                <Trophy className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Weekly Bars Competition</h3>
                <p className="text-muted-foreground">Vote for the best bars and earn rewards!</p>
              </div>
            </div>
            <Badge className="bg-gradient-to-r from-orange-500 to-lime-500 text-white">
              <Fire className="h-3 w-3 mr-1" />
              Live
            </Badge>
          </div>
        </CardContent>
      </Card>

      {bars.map((bar) => (
        <Card
          key={bar.id}
          className={`overflow-hidden transition-all duration-200 ${
            bar.isWeeklyTop
              ? "border-l-4 border-l-orange-500 bg-gradient-to-r from-orange-500/5 to-transparent"
              : "hover:shadow-lg hover:border-l-4 hover:border-l-lime-500"
          }`}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {bar.rank && (
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-orange-500 to-lime-500 text-white font-bold text-sm">
                    {bar.rank}
                  </div>
                )}
                <Avatar className="h-10 w-10 ring-2 ring-orange-500/20">
                  <AvatarImage src={bar.user.avatar || "/placeholder.svg"} alt={bar.user.username} />
                  <AvatarFallback className="bg-gradient-to-r from-orange-500 to-lime-500 text-white">
                    {bar.user.fullName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold truncate">{bar.user.fullName}</p>
                    {bar.user.isVerified && (
                      <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 text-xs">
                        ✓
                      </Badge>
                    )}
                    <UserTierBadge tier={bar.user.tier} size="sm" />
                    {bar.isWeeklyTop && (
                      <Badge className="bg-gradient-to-r from-orange-500 to-lime-500 text-white text-xs">
                        <Award className="h-3 w-3 mr-1" />
                        Top
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>@{bar.user.username}</span>
                    <span>•</span>
                    <span>{formatDistanceToNow(new Date(bar.createdAt), { addSuffix: true })}</span>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Coins className="h-3 w-3 text-orange-500" />
                      <span>{bar.user.coinBalance.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Bars Content */}
            <div className="bg-muted/30 rounded-lg p-4 border-l-4 border-l-orange-500/50">
              <div className="flex items-center gap-2 mb-2">
                <Mic className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium text-orange-600">Bars</span>
              </div>
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <p className="whitespace-pre-wrap leading-relaxed font-mono text-sm">{bar.content}</p>
              </div>
            </div>

            {/* Audio Player */}
            {bar.audioUrl && (
              <div className="rounded-lg overflow-hidden">
                <MediaPlayer type="audio" url={bar.audioUrl} title={`${bar.user.fullName}'s bars`} />
              </div>
            )}

            {/* Stats */}
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-orange-500">
                  <ArrowUp className="h-4 w-4" />
                  <span className="font-medium">{bar.votes}</span>
                </div>
                <span className="text-muted-foreground">votes</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-lime-500">
                  <Coins className="h-4 w-4" />
                  <span className="font-medium">{bar.coinsEarned.toLocaleString()}</span>
                </div>
                <span className="text-muted-foreground">earned</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <span>{bar.comments} comments</span>
              </div>
            </div>
          </CardContent>

          <CardFooter className="pt-3 border-t bg-muted/20">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                {bar.hasVoted && (
                  <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                    Voted ({bar.userVoteAmount} coins)
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <MessageSquare className="h-4 w-4 mr-1" />
                  Comment
                </Button>
                <Dialog open={votingBar === bar.id} onOpenChange={(open) => !open && setVotingBar(null)}>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-orange-500 to-lime-500 hover:from-orange-600 hover:to-lime-600 text-white"
                      onClick={() => setVotingBar(bar.id)}
                      disabled={!isAuthenticated}
                    >
                      <Coins className="h-4 w-4 mr-1" />
                      Vote
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Vote with Erigga Coins</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-2">Support {bar.user.fullName}'s bars</p>
                        <div className="bg-muted/30 rounded-lg p-3 text-sm">"{bar.content.split("\n")[0]}..."</div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Vote amount (coins)</label>
                        <Input
                          type="number"
                          min={1}
                          max={profile?.coins || 0}
                          value={voteAmount}
                          onChange={(e) => setVoteAmount(Number(e.target.value))}
                        />
                        <p className="text-xs text-muted-foreground">
                          Your balance: {profile?.coins?.toLocaleString() || 0} coins
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" className="flex-1" onClick={() => setVotingBar(null)}>
                          Cancel
                        </Button>
                        <Button
                          className="flex-1 bg-gradient-to-r from-orange-500 to-lime-500 hover:from-orange-600 hover:to-lime-600 text-white"
                          onClick={() => handleVote(bar.id, voteAmount)}
                          disabled={voteAmount <= 0 || voteAmount > (profile?.coins || 0)}
                        >
                          Vote {voteAmount} coins
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
