"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/components/ui/use-toast"
import {
  Trophy,
  Calendar,
  Users,
  Target,
  Award,
  Clock,
  Coins,
  Star,
  Flame,
  Zap,
  Crown,
  CheckCircle,
  Play,
} from "lucide-react"

interface Challenge {
  id: number
  title: string
  description: string
  challenge_type: "weekly" | "monthly" | "special"
  start_date: string
  end_date: string
  reward_coins: number
  reward_badge: string
  rules: any
  is_active: boolean
  participants_count: number
  user_participation?: {
    id: number
    score: number
    rank: number
    completed_at?: string
  }
}

export function ChallengesContests() {
  const { user, profile } = useAuth()
  const { toast } = useToast()
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [activeTab, setActiveTab] = useState("active")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadChallenges()
  }, [])

  const loadChallenges = async () => {
    try {
      const response = await fetch("/api/community/challenges")
      const result = await response.json()

      if (result.success) {
        setChallenges(result.challenges)
      }
    } catch (error) {
      console.error("Failed to load challenges:", error)
    } finally {
      setLoading(false)
    }
  }

  const joinChallenge = async (challengeId: number) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to join challenges.",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch(`/api/community/challenges/${challengeId}/join`, {
        method: "POST",
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Challenge Joined! 🎯",
          description: "You've successfully joined the challenge. Good luck!",
        })
        loadChallenges() // Refresh to show participation
      } else {
        toast({
          title: "Join Failed",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Join Failed",
        description: "Something went wrong",
        variant: "destructive",
      })
    }
  }

  const getChallengeIcon = (type: string) => {
    switch (type) {
      case "weekly":
        return <Calendar className="h-5 w-5 text-blue-500" />
      case "monthly":
        return <Target className="h-5 w-5 text-purple-500" />
      case "special":
        return <Star className="h-5 w-5 text-yellow-500" />
      default:
        return <Trophy className="h-5 w-5" />
    }
  }

  const getChallengeTypeColor = (type: string) => {
    switch (type) {
      case "weekly":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "monthly":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
      case "special":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const getTimeRemaining = (endDate: string) => {
    const end = new Date(endDate)
    const now = new Date()
    const diff = end.getTime() - now.getTime()

    if (diff <= 0) return "Ended"

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

    if (days > 0) return `${days}d ${hours}h remaining`
    return `${hours}h remaining`
  }

  const getProgressPercentage = (startDate: string, endDate: string) => {
    const start = new Date(startDate).getTime()
    const end = new Date(endDate).getTime()
    const now = new Date().getTime()

    if (now <= start) return 0
    if (now >= end) return 100

    return Math.round(((now - start) / (end - start)) * 100)
  }

  const ChallengeCard = ({ challenge }: { challenge: Challenge }) => {
    const isParticipating = !!challenge.user_participation
    const isCompleted = challenge.user_participation?.completed_at
    const timeRemaining = getTimeRemaining(challenge.end_date)
    const progress = getProgressPercentage(challenge.start_date, challenge.end_date)

    return (
      <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {getChallengeIcon(challenge.challenge_type)}
              <div>
                <CardTitle className="text-xl mb-1">{challenge.title}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge className={getChallengeTypeColor(challenge.challenge_type)}>{challenge.challenge_type}</Badge>
                  {isCompleted && (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Completed
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-yellow-600 font-bold">
                <Coins className="h-4 w-4" />
                {challenge.reward_coins}
              </div>
              <div className="text-xs text-muted-foreground">reward</div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-muted-foreground leading-relaxed">{challenge.description}</p>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Challenge Stats */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{challenge.participants_count} participants</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{timeRemaining}</span>
            </div>
          </div>

          {/* Participation Status */}
          {isParticipating ? (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-blue-900 dark:text-blue-100">You're participating!</div>
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    Current rank: #{challenge.user_participation?.rank || "—"}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-blue-900 dark:text-blue-100">
                    {challenge.user_participation?.score || 0}
                  </div>
                  <div className="text-xs text-blue-700 dark:text-blue-300">points</div>
                </div>
              </div>
            </div>
          ) : (
            <Button
              onClick={() => joinChallenge(challenge.id)}
              className="w-full"
              disabled={!challenge.is_active || !user}
            >
              <Play className="h-4 w-4 mr-2" />
              Join Challenge
            </Button>
          )}

          {/* Reward Badge */}
          {challenge.reward_badge && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Award className="h-4 w-4" />
              <span>Earn the "{challenge.reward_badge}" badge</span>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  const activeChallenges = challenges.filter((c) => c.is_active)
  const completedChallenges = challenges.filter((c) => !c.is_active)
  const myChallenges = challenges.filter((c) => c.user_participation)

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="animate-pulse space-y-6">
          <div className="h-12 bg-slate-200 rounded w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-slate-200 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Challenges & Contests
        </h1>
        <p className="text-xl text-muted-foreground">Compete with the community and earn rewards!</p>
      </div>

      {/* Featured Challenge */}
      {activeChallenges.length > 0 && (
        <Card className="mb-8 bg-gradient-to-r from-purple-500 to-pink-500 text-white overflow-hidden">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Flame className="h-6 w-6" />
                  <Badge className="bg-white/20 text-white border-white/30">Featured</Badge>
                </div>
                <h2 className="text-2xl font-bold mb-2">{activeChallenges[0].title}</h2>
                <p className="text-lg opacity-90 mb-4">{activeChallenges[0].description}</p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Coins className="h-5 w-5" />
                    <span className="font-bold">{activeChallenges[0].reward_coins} coins</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-5 w-5" />
                    <span>{activeChallenges[0].participants_count} participants</span>
                  </div>
                </div>
              </div>
              <div className="text-center">
                <Crown className="h-16 w-16 mx-auto mb-2 text-yellow-300" />
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => joinChallenge(activeChallenges[0].id)}
                  disabled={!!activeChallenges[0].user_participation}
                >
                  {activeChallenges[0].user_participation ? "Participating" : "Join Now"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="active">Active ({activeChallenges.length})</TabsTrigger>
          <TabsTrigger value="my-challenges">My Challenges ({myChallenges.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedChallenges.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          {activeChallenges.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Target className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No Active Challenges</h3>
                <p className="text-muted-foreground">Check back soon for new challenges!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeChallenges.map((challenge) => (
                <ChallengeCard key={challenge.id} challenge={challenge} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="my-challenges">
          {myChallenges.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Trophy className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No Challenges Joined</h3>
                <p className="text-muted-foreground mb-4">Join a challenge to start competing!</p>
                <Button onClick={() => setActiveTab("active")}>
                  <Zap className="h-4 w-4 mr-2" />
                  Browse Challenges
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myChallenges.map((challenge) => (
                <ChallengeCard key={challenge.id} challenge={challenge} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed">
          {completedChallenges.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Award className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No Completed Challenges</h3>
                <p className="text-muted-foreground">Completed challenges will appear here.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedChallenges.map((challenge) => (
                <ChallengeCard key={challenge.id} challenge={challenge} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
