"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Play, Pause, Coins, TrendingUp, MessageCircle, Trophy } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/components/ui/use-toast"

interface BarSubmission {
  id: number
  user: {
    id: string
    username: string
    full_name: string
    avatar_url?: string
    tier: string
    coins: number
  }
  content: string
  audio_url?: string
  vote_count: number
  coins_earned: number
  comments_count: number
  created_at: string
  has_voted: boolean
  is_trending: boolean
}

interface BarsSectionProps {
  searchQuery: string
  filterType: string
}

export function BarsSection({ searchQuery, filterType }: BarsSectionProps) {
  const [bars, setBars] = useState<BarSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [playingId, setPlayingId] = useState<number | null>(null)
  const [votingId, setVotingId] = useState<number | null>(null)
  const { profile, isAuthenticated } = useAuth()
  const { toast } = useToast()

  // Mock data for preview
  useEffect(() => {
    const mockBars: BarSubmission[] = [
      {
        id: 1,
        user: {
          id: "1",
          username: "lyrical_genius",
          full_name: "David Okonkwo",
          avatar_url: "/placeholder-user.jpg",
          tier: "Blood",
          coins: 4500,
        },
        content: "Money no be everything but everything need money, Erigga taught me that the hustle never funny 🔥",
        audio_url: "/placeholder-audio.mp3",
        vote_count: 89,
        coins_earned: 445,
        comments_count: 23,
        created_at: "2024-01-15T12:00:00Z",
        has_voted: false,
        is_trending: true,
      },
      {
        id: 2,
        user: {
          id: "2",
          username: "street_poet",
          full_name: "Blessing Eze",
          avatar_url: "/placeholder-user.jpg",
          tier: "Elder",
          coins: 2100,
        },
        content:
          "From Warri to the world, Erigga's story unfold, Teaching us that real recognize real, that's the code 💯",
        audio_url: "/placeholder-audio.mp3",
        vote_count: 67,
        coins_earned: 335,
        comments_count: 18,
        created_at: "2024-01-15T11:30:00Z",
        has_voted: true,
        is_trending: false,
      },
      {
        id: 3,
        user: {
          id: "3",
          username: "bars_machine",
          full_name: "Emmanuel Okoro",
          avatar_url: "/placeholder-user.jpg",
          tier: "Pioneer",
          coins: 1800,
        },
        content: "Paper Boy mentality, stacking up the green, Living like a king but staying humble in the scene 👑",
        vote_count: 45,
        coins_earned: 225,
        comments_count: 12,
        created_at: "2024-01-15T10:45:00Z",
        has_voted: false,
        is_trending: false,
      },
    ]

    setTimeout(() => {
      setBars(mockBars)
      setLoading(false)
    }, 1000)
  }, [searchQuery, filterType])

  const handleVote = async (barId: number) => {
    if (!isAuthenticated) {
      toast({
        title: "Sign in required",
        description: "Please sign in to vote on bars",
        variant: "destructive",
      })
      return
    }

    if (!profile?.coins || profile.coins < 5) {
      toast({
        title: "Insufficient coins",
        description: "You need at least 5 coins to vote",
        variant: "destructive",
      })
      return
    }

    setVotingId(barId)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setBars((prev) =>
        prev.map((bar) =>
          bar.id === barId
            ? {
                ...bar,
                has_voted: !bar.has_voted,
                vote_count: bar.has_voted ? bar.vote_count - 1 : bar.vote_count + 1,
                coins_earned: bar.has_voted ? bar.coins_earned - 5 : bar.coins_earned + 5,
              }
            : bar,
        ),
      )

      toast({
        title: "Vote successful!",
        description: bars.find((b) => b.id === barId)?.has_voted ? "Vote removed" : "5 coins spent on vote",
      })
    } catch (error) {
      toast({
        title: "Vote failed",
        description: "Please try again",
        variant: "destructive",
      })
    } finally {
      setVotingId(null)
    }
  }

  const handlePlay = (barId: number, audioUrl: string) => {
    if (playingId === barId) {
      setPlayingId(null)
    } else {
      setPlayingId(barId)
      // In a real app, you'd implement actual audio playback here
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
                  <AvatarImage src={bar.user.avatar_url || "/placeholder.svg"} alt={bar.user.username} />
                  <AvatarFallback>{bar.user.full_name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold truncate">{bar.user.full_name}</p>
                    <Badge className={`${getTierColor(bar.user.tier)} text-white text-xs`}>{bar.user.tier}</Badge>
                    {bar.is_trending && (
                      <Badge
                        variant="secondary"
                        className="bg-gradient-to-r from-orange-500/20 to-lime-500/20 text-orange-600"
                      >
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Trending
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>@{bar.user.username}</span>
                    <span>•</span>
                    <span>{new Date(bar.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-sm font-medium text-orange-600">
                  <Trophy className="h-4 w-4" />
                  <span>{bar.coins_earned}</span>
                </div>
                <p className="text-xs text-muted-foreground">coins earned</p>
              </div>
            </div>

            {/* Bar Content */}
            <div className="mb-4 p-4 bg-gradient-to-r from-orange-50 to-lime-50 dark:from-orange-950/20 dark:to-lime-950/20 rounded-lg border">
              <p className="text-foreground leading-relaxed font-medium italic">"{bar.content}"</p>
            </div>

            {/* Audio Player */}
            {bar.audio_url && (
              <div className="mb-4 p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handlePlay(bar.id, bar.audio_url!)}
                    className="rounded-full bg-gradient-to-r from-orange-500 to-lime-500 text-white hover:from-orange-600 hover:to-lime-600"
                  >
                    {playingId === bar.id ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                  </Button>
                  <div className="flex-1">
                    <div className="h-2 bg-background rounded-full">
                      <div className="h-2 bg-gradient-to-r from-orange-500 to-lime-500 rounded-full w-1/3"></div>
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground">0:45 / 2:30</span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-4">
                <Button
                  variant={bar.has_voted ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleVote(bar.id)}
                  disabled={votingId === bar.id}
                  className={bar.has_voted ? "bg-gradient-to-r from-orange-500 to-lime-500 text-white" : ""}
                >
                  <Coins className="h-4 w-4 mr-2" />
                  {votingId === bar.id ? "Voting..." : `Vote (${bar.vote_count})`}
                </Button>
                <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                  <MessageCircle className="h-4 w-4" />
                  {bar.comments_count}
                </Button>
              </div>
              <div className="text-sm text-muted-foreground">Cost: 5 coins per vote</div>
            </div>
          </div>
        </Card>
      ))}

      {bars.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No bars submitted yet. Be the first to drop some fire! 🔥</p>
        </div>
      )}
    </div>
  )
}
