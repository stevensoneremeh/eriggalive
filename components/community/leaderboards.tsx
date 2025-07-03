"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserTierBadge } from "@/components/user-tier-badge"
import { Trophy, Crown, Medal, Star, MessageSquare, Heart, Coins, Users, Flame } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface LeaderboardUser {
  id: number
  username: string
  full_name: string
  avatar_url?: string
  tier: string
  score: number
  rank: number
  change: number // Position change from last period
}

export function CommunityLeaderboards() {
  const [activeTab, setActiveTab] = useState("reputation")
  const [timeframe, setTimeframe] = useState("all-time")
  const [leaderboards, setLeaderboards] = useState<Record<string, LeaderboardUser[]>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLeaderboards()
  }, [timeframe])

  const loadLeaderboards = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/community/leaderboards?timeframe=${timeframe}`)
      const result = await response.json()

      if (result.success) {
        setLeaderboards(result.leaderboards)
      }
    } catch (error) {
      console.error("Failed to load leaderboards:", error)
    } finally {
      setLoading(false)
    }
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-500" />
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />
      case 3:
        return <Medal className="h-6 w-6 text-amber-600" />
      default:
        return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>
    }
  }

  const getRankBadge = (rank: number) => {
    if (rank === 1) return "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white"
    if (rank === 2) return "bg-gradient-to-r from-gray-300 to-gray-500 text-white"
    if (rank === 3) return "bg-gradient-to-r from-amber-400 to-amber-600 text-white"
    return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
  }

  const getChangeIndicator = (change: number) => {
    if (change > 0) return <span className="text-green-500 text-sm">↗ +{change}</span>
    if (change < 0) return <span className="text-red-500 text-sm">↘ {change}</span>
    return <span className="text-gray-500 text-sm">—</span>
  }

  const LeaderboardCard = ({
    users,
    title,
    icon,
    scoreLabel,
  }: {
    users: LeaderboardUser[]
    title: string
    icon: React.ReactNode
    scoreLabel: string
  }) => (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3 animate-pulse">
                <div className="h-10 w-10 bg-slate-200 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-4" />
            <p>No data available for this timeframe.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {users.slice(0, 10).map((user) => (
              <Link key={user.id} href={`/profile/${user.username}`}>
                <div
                  className={cn(
                    "flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer",
                    user.rank <= 3 && "bg-gradient-to-r from-slate-50 to-transparent dark:from-slate-800",
                  )}
                >
                  <div className="flex items-center justify-center w-8">{getRankIcon(user.rank)}</div>

                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.avatar_url || "/placeholder-user.jpg"} alt={user.username} />
                    <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold truncate">{user.full_name || user.username}</p>
                      <UserTierBadge tier={user.tier} size="xs" />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>@{user.username}</span>
                      {getChangeIndicator(user.change)}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-lg">{user.score.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">{scoreLabel}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Community Leaderboards
        </h1>
        <p className="text-xl text-muted-foreground">See who's leading the community in various categories</p>
      </div>

      {/* Timeframe Selector */}
      <div className="flex gap-2 mb-8">
        {[
          { value: "all-time", label: "All Time" },
          { value: "monthly", label: "This Month" },
          { value: "weekly", label: "This Week" },
          { value: "daily", label: "Today" },
        ].map((option) => (
          <Button
            key={option.value}
            variant={timeframe === option.value ? "default" : "outline"}
            onClick={() => setTimeframe(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6 mb-8">
          <TabsTrigger value="reputation">Reputation</TabsTrigger>
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="votes">Votes</TabsTrigger>
          <TabsTrigger value="comments">Comments</TabsTrigger>
          <TabsTrigger value="followers">Followers</TabsTrigger>
          <TabsTrigger value="coins">Coins</TabsTrigger>
        </TabsList>

        <TabsContent value="reputation">
          <LeaderboardCard
            users={leaderboards.reputation || []}
            title="Top by Reputation"
            icon={<Star className="h-5 w-5 text-yellow-500" />}
            scoreLabel="reputation"
          />
        </TabsContent>

        <TabsContent value="posts">
          <LeaderboardCard
            users={leaderboards.posts || []}
            title="Most Active Posters"
            icon={<MessageSquare className="h-5 w-5 text-blue-500" />}
            scoreLabel="posts"
          />
        </TabsContent>

        <TabsContent value="votes">
          <LeaderboardCard
            users={leaderboards.votes || []}
            title="Most Voted Content"
            icon={<Heart className="h-5 w-5 text-red-500" />}
            scoreLabel="votes"
          />
        </TabsContent>

        <TabsContent value="comments">
          <LeaderboardCard
            users={leaderboards.comments || []}
            title="Most Engaged Commenters"
            icon={<MessageSquare className="h-5 w-5 text-green-500" />}
            scoreLabel="comments"
          />
        </TabsContent>

        <TabsContent value="followers">
          <LeaderboardCard
            users={leaderboards.followers || []}
            title="Most Followed Users"
            icon={<Users className="h-5 w-5 text-purple-500" />}
            scoreLabel="followers"
          />
        </TabsContent>

        <TabsContent value="coins">
          <LeaderboardCard
            users={leaderboards.coins || []}
            title="Richest Community Members"
            icon={<Coins className="h-5 w-5 text-yellow-500" />}
            scoreLabel="coins"
          />
        </TabsContent>
      </Tabs>

      {/* Featured Achievement */}
      <Card className="mt-8 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
        <CardContent className="p-8 text-center">
          <Flame className="h-16 w-16 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">🔥 Community Champion</h2>
          <p className="text-lg opacity-90 mb-4">Congratulations to this {timeframe}'s top performer!</p>
          {leaderboards.reputation && leaderboards.reputation[0] && (
            <Link href={`/profile/${leaderboards.reputation[0].username}`}>
              <div className="inline-flex items-center gap-3 bg-white/20 rounded-lg p-4 hover:bg-white/30 transition-colors">
                <Avatar className="h-12 w-12 border-2 border-white">
                  <AvatarImage src={leaderboards.reputation[0].avatar_url || "/placeholder-user.jpg"} />
                  <AvatarFallback>{leaderboards.reputation[0].username.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <div className="font-bold text-lg">
                    {leaderboards.reputation[0].full_name || leaderboards.reputation[0].username}
                  </div>
                  <div className="opacity-90">@{leaderboards.reputation[0].username}</div>
                </div>
                <Crown className="h-8 w-8 text-yellow-300" />
              </div>
            </Link>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
