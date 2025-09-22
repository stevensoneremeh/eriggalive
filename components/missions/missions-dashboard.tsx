
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { Trophy, Target, Clock, Star, Coins, Users, CheckCircle, Gift, Calendar, Zap, Share, Loader2 } from "lucide-react"
import { motion } from "framer-motion"

interface Mission {
  id: number
  title: string
  description: string
  mission_type: "daily" | "weekly" | "achievement" | "special"
  category: string
  points_reward: number
  coins_reward: number
  requirements: any
  is_active: boolean
  user_progress?: {
    progress: any
    is_completed: boolean
    completed_at?: string
    claimed_at?: string
  }
}

export function MissionsDashboard() {
  const { user, profile } = useAuth()
  const { toast } = useToast()
  const [missions, setMissions] = useState<Mission[]>([])
  const [activeTab, setActiveTab] = useState("daily")
  const [loading, setLoading] = useState(true)
  const [claimingMission, setClaimingMission] = useState<number | null>(null)
  const [referralCode, setReferralCode] = useState("")
  const [referralCount, setReferralCount] = useState(0)

  useEffect(() => {
    if (user) {
      loadMissions()
      loadReferralData()
    }
  }, [user])

  const loadMissions = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/missions")
      
      if (!response.ok) {
        console.error("Missions API returned error:", response.status, response.statusText)
        // Set some default missions to prevent twitching
        setMissions([
          {
            id: 1,
            title: "Welcome to Erigga Live",
            description: "Complete your profile setup and explore the platform",
            mission_type: "daily",
            category: "onboarding",
            points_reward: 100,
            coins_reward: 50,
            requirements: { profile_completion: 1 },
            is_active: true,
            user_progress: {
              progress: { profile_completion: 0 },
              is_completed: false
            }
          }
        ])
        return
      }

      const result = await response.json()

      if (result.success && result.missions) {
        setMissions(result.missions)
      } else {
        console.error("Failed to load missions:", result.error)
        setMissions([])
      }
    } catch (error) {
      console.error("Failed to load missions:", error)
      setMissions([])
    } finally {
      setLoading(false)
    }
  }

  const loadReferralData = async () => {
    try {
      const response = await fetch("/api/referrals/me")
      
      if (!response.ok) {
        console.error("Referrals API returned error:", response.status, response.statusText)
        // Set default values if API fails
        setReferralCode("ERG_DEFAULT")
        setReferralCount(0)
        return
      }

      const result = await response.json()

      if (result.success) {
        setReferralCode(result.referralCode || "ERG_DEFAULT")
        setReferralCount(result.referralCount || 0)
      } else {
        console.error("Referrals API error:", result.error)
        // Set default values
        setReferralCode("ERG_DEFAULT")
        setReferralCount(0)
      }
    } catch (error) {
      console.error("Failed to load referral data:", error)
      // Set default values if fetch fails
      setReferralCode("ERG_DEFAULT")
      setReferralCount(0)
    }
  }

  const claimReward = async (missionId: number) => {
    try {
      setClaimingMission(missionId)
      const response = await fetch(`/api/missions/${missionId}/claim`, {
        method: "POST",
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Reward Claimed! 🎉",
          description: result.message || `You earned ${result.pointsEarned} points and ${result.coinsEarned} coins!`,
        })
        loadMissions()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to claim reward",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to claim reward",
        variant: "destructive",
      })
    } finally {
      setClaimingMission(null)
    }
  }

  const copyReferralCode = () => {
    const referralUrl = `${window.location.origin}/signup?ref=${referralCode}`
    navigator.clipboard.writeText(referralUrl)
    toast({
      title: "Copied!",
      description: "Referral link copied to clipboard",
    })
  }

  const getMissionIcon = (type: string) => {
    switch (type) {
      case "daily":
        return <Calendar className="h-5 w-5 text-blue-500" />
      case "weekly":
        return <Clock className="h-5 w-5 text-purple-500" />
      case "achievement":
        return <Trophy className="h-5 w-5 text-yellow-500" />
      case "special":
        return <Star className="h-5 w-5 text-pink-500" />
      default:
        return <Target className="h-5 w-5" />
    }
  }

  const getProgressPercentage = (mission: Mission) => {
    if (!mission.user_progress || !mission.requirements) return 0

    const requirement = Object.keys(mission.requirements)[0]
    const required = mission.requirements[requirement]
    const current = mission.user_progress.progress[requirement] || 0

    return Math.min((current / required) * 100, 100)
  }

  const checkMissionCompletion = (mission: Mission) => {
    if (!mission.user_progress || !mission.requirements) return false

    const requirement = Object.keys(mission.requirements)[0]
    const required = mission.requirements[requirement]
    const current = mission.user_progress.progress[requirement] || 0

    return current >= required
  }

  const filteredMissions = missions.filter((mission) => activeTab === "all" || mission.mission_type === activeTab)

  const completedMissions = missions.filter((m) => m.user_progress?.is_completed || checkMissionCompletion(m)).length
  const totalRewards = missions
    .filter((m) => m.user_progress?.claimed_at)
    .reduce((sum, m) => sum + (m.points_reward || 0) + (m.coins_reward || 0), 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Completed</p>
                <p className="text-2xl font-bold">{completedMissions}</p>
              </div>
              <Trophy className="h-8 w-8 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Total Rewards</p>
                <p className="text-2xl font-bold">{totalRewards}</p>
              </div>
              <Gift className="h-8 w-8 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Referrals</p>
                <p className="text-2xl font-bold">{referralCount}/5</p>
              </div>
              <Users className="h-8 w-8 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-pink-500 to-red-500 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Streak</p>
                <p className="text-2xl font-bold">7</p>
              </div>
              <Zap className="h-8 w-8 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {referralCode && (
        <Card className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold mb-2">Refer Friends & Earn 1000 Coins!</h3>
                <p className="opacity-90 mb-4">
                  Invite 5 friends to join EriggaLive and earn 1000 Erigga Coins as reward
                </p>
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 px-3 py-2 rounded-lg">
                    <code className="text-sm">{referralCode}</code>
                  </div>
                  <Button onClick={copyReferralCode} variant="secondary" size="sm">
                    <Share className="h-4 w-4 mr-2" />
                    Copy Link
                  </Button>
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{referralCount}/5</div>
                <div className="text-sm opacity-80">Referrals</div>
                <Progress value={(referralCount / 5) * 100} className="w-20 mt-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="daily">Daily</TabsTrigger>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="achievement">Achievements</TabsTrigger>
          <TabsTrigger value="special">Special</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMissions.map((mission) => {
              const isCompleted = mission.user_progress?.is_completed || checkMissionCompletion(mission)
              const isClaimed = mission.user_progress?.claimed_at
              const progressPercentage = getProgressPercentage(mission)

              return (
                <motion.div key={mission.id} whileHover={{ scale: 1.02 }} className="h-full">
                  <Card className="h-full flex flex-col">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {getMissionIcon(mission.mission_type)}
                          <div>
                            <CardTitle className="text-lg">{mission.title}</CardTitle>
                            <Badge variant="outline" className="mt-1">
                              {mission.mission_type}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-yellow-600">
                            <Coins className="h-4 w-4" />
                            <span className="font-bold">{mission.coins_reward}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">+{mission.points_reward} pts</div>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="flex-1 flex flex-col justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-4">{mission.description}</p>

                        {mission.user_progress && !isCompleted && (
                          <div className="space-y-2 mb-4">
                            <div className="flex justify-between text-sm">
                              <span>Progress</span>
                              <span>
                                {Object.values(mission.user_progress.progress)[0] || 0} /{" "}
                                {Object.values(mission.requirements)[0]}
                              </span>
                            </div>
                            <Progress value={progressPercentage} />
                          </div>
                        )}
                      </div>

                      <div className="mt-auto">
                        {isClaimed ? (
                          <Button disabled className="w-full">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Claimed
                          </Button>
                        ) : isCompleted ? (
                          <Button
                            onClick={() => claimReward(mission.id)}
                            disabled={claimingMission === mission.id}
                            className="w-full bg-gradient-to-r from-green-500 to-emerald-500"
                          >
                            {claimingMission === mission.id ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Gift className="h-4 w-4 mr-2" />
                            )}
                            Claim Reward
                          </Button>
                        ) : (
                          <Button disabled variant="outline" className="w-full bg-transparent">
                            In Progress
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>

          {filteredMissions.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Target className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Missions Available</h3>
                <p className="text-muted-foreground">Check back later for new missions!</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
