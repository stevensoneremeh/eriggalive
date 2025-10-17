"use client"
import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Target,
  Trophy,
  Coins,
  Calendar,
  CheckCircle,
  Clock,
  Star,
  Gift,
  Zap,
  Users,
  MessageCircle,
  Heart,
  Music,
  Share2,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabaseClient"

interface Mission {
  id: string
  title: string
  description: string
  type: "daily" | "weekly" | "achievement"
  reward_coins: number
  reward_points: number
  target_value: number
  current_progress: number
  is_completed: boolean
  expires_at?: string
  icon: string
  difficulty: "easy" | "medium" | "hard"
}

export default function MissionPage() {
  const { user, profile, refreshProfile } = useAuth()
  const { toast } = useToast()
  const [missions, setMissions] = useState<Mission[]>([])
  const [loading, setLoading] = useState(true)
  const [completingMission, setCompletingMission] = useState<string | null>(null)

  // Mock missions data - in real app, this would come from your database
  const mockMissions: Mission[] = [
    // Daily Missions
    {
      id: "daily-1",
      title: "Daily Check-in",
      description: "Visit the community page and check in for the day",
      type: "daily",
      reward_coins: 50,
      reward_points: 10,
      target_value: 1,
      current_progress: 0,
      is_completed: false,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      icon: "calendar",
      difficulty: "easy",
    },
    {
      id: "daily-2",
      title: "Community Engagement",
      description: "Like 5 posts in the community",
      type: "daily",
      reward_coins: 75,
      reward_points: 15,
      target_value: 5,
      current_progress: 2,
      is_completed: false,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      icon: "heart",
      difficulty: "easy",
    },
    {
      id: "daily-3",
      title: "Share the Love",
      description: "Share 3 posts on social media",
      type: "daily",
      reward_coins: 100,
      reward_points: 20,
      target_value: 3,
      current_progress: 0,
      is_completed: false,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      icon: "share",
      difficulty: "medium",
    },
    // Weekly Missions
    {
      id: "weekly-1",
      title: "Community Champion",
      description: "Create 10 posts in the community this week",
      type: "weekly",
      reward_coins: 500,
      reward_points: 100,
      target_value: 10,
      current_progress: 3,
      is_completed: false,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      icon: "message",
      difficulty: "hard",
    },
    {
      id: "weekly-2",
      title: "Music Explorer",
      description: "Listen to 20 tracks in the media vault",
      type: "weekly",
      reward_coins: 300,
      reward_points: 60,
      target_value: 20,
      current_progress: 8,
      is_completed: false,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      icon: "music",
      difficulty: "medium",
    },
    {
      id: "weekly-3",
      title: "Social Butterfly",
      description: "Interact with 50 different community members",
      type: "weekly",
      reward_coins: 400,
      reward_points: 80,
      target_value: 50,
      current_progress: 12,
      is_completed: false,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      icon: "users",
      difficulty: "hard",
    },
    // Achievement Missions
    {
      id: "achievement-1",
      title: "First Steps",
      description: "Complete your first community post",
      type: "achievement",
      reward_coins: 200,
      reward_points: 50,
      target_value: 1,
      current_progress: 1,
      is_completed: true,
      icon: "star",
      difficulty: "easy",
    },
    {
      id: "achievement-2",
      title: "Coin Collector",
      description: "Accumulate 1000 coins",
      type: "achievement",
      reward_coins: 0,
      reward_points: 200,
      target_value: 1000,
      current_progress: profile?.coins || 0,
      is_completed: (profile?.coins || 0) >= 1000,
      icon: "coins",
      difficulty: "medium",
    },
    {
      id: "achievement-3",
      title: "Community Legend",
      description: "Reach Elder tier status",
      type: "achievement",
      reward_coins: 1000,
      reward_points: 500,
      target_value: 1,
      current_progress: profile?.tier === "elder" || profile?.tier === "blood_brotherhood" ? 1 : 0,
      is_completed: profile?.tier === "elder" || profile?.tier === "blood_brotherhood",
      icon: "trophy",
      difficulty: "hard",
    },
  ]

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "calendar":
        return <Calendar className="w-6 h-6" />
      case "heart":
        return <Heart className="w-6 h-6" />
      case "share":
        return <Share2 className="w-6 h-6" />
      case "message":
        return <MessageCircle className="w-6 h-6" />
      case "music":
        return <Music className="w-6 h-6" />
      case "users":
        return <Users className="w-6 h-6" />
      case "star":
        return <Star className="w-6 h-6" />
      case "coins":
        return <Coins className="w-6 h-6" />
      case "trophy":
        return <Trophy className="w-6 h-6" />
      default:
        return <Target className="w-6 h-6" />
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "hard":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date()
    const expiry = new Date(expiresAt)
    const diff = expiry.getTime() - now.getTime()

    if (diff <= 0) return "Expired"

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (hours > 24) {
      const days = Math.floor(hours / 24)
      return `${days}d ${hours % 24}h`
    }

    return `${hours}h ${minutes}m`
  }

  const completeMission = async (missionId: string) => {
    const mission = missions.find((m) => m.id === missionId)
    if (!mission || mission.is_completed || !profile) return

    setCompletingMission(missionId)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Update user coins and points
      const newCoins = (profile.coins || 0) + mission.reward_coins
      const newPoints = (profile.points || 0) + mission.reward_points

      const { error } = await supabase
        .from("users")
        .update({
          coins: newCoins,
          points: newPoints,
        })
        .eq("id", profile.id)

      if (error) throw error

      // Mark mission as completed
      setMissions((prev) =>
        prev.map((m) => (m.id === missionId ? { ...m, is_completed: true, current_progress: m.target_value } : m)),
      )

      await refreshProfile()

      toast({
        title: "Mission Completed! 🎉",
        description: `You earned ${mission.reward_coins} coins and ${mission.reward_points} points!`,
      })
    } catch (error) {
      console.error("Error completing mission:", error)
      toast({
        title: "Error",
        description: "Failed to complete mission. Please try again.",
        variant: "destructive",
      })
    } finally {
      setCompletingMission(null)
    }
  }

  useEffect(() => {
    setMissions(mockMissions)
    setLoading(false)
  }, [profile])

  const dailyMissions = missions.filter((m) => m.type === "daily")
  const weeklyMissions = missions.filter((m) => m.type === "weekly")
  const achievementMissions = missions.filter((m) => m.type === "achievement")

  const completedToday = dailyMissions.filter((m) => m.is_completed).length
  const totalDaily = dailyMissions.length

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Missions</h1>
                <p className="text-gray-600 dark:text-gray-300">Complete missions to earn coins and points</p>
              </div>
            </div>

            {/* Daily Progress Overview */}
            <Card className="border-0 shadow-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Daily Progress</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {completedToday} of {totalDaily} missions completed today
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {Math.round((completedToday / totalDaily) * 100)}%
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Complete</p>
                  </div>
                </div>
                <Progress value={(completedToday / totalDaily) * 100} className="h-3" />
              </CardContent>
            </Card>
          </div>

          {/* Mission Tabs */}
          <Tabs defaultValue="daily" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="daily" className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>Daily</span>
              </TabsTrigger>
              <TabsTrigger value="weekly" className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>Weekly</span>
              </TabsTrigger>
              <TabsTrigger value="achievements" className="flex items-center space-x-2">
                <Trophy className="w-4 h-4" />
                <span>Achievements</span>
              </TabsTrigger>
            </TabsList>

            {/* Daily Missions */}
            <TabsContent value="daily" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {dailyMissions.map((mission) => (
                  <Card
                    key={mission.id}
                    className="border-0 shadow-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`p-2 rounded-lg ${
                              mission.is_completed
                                ? "bg-green-100 text-green-600 dark:bg-green-900/20"
                                : "bg-blue-100 text-blue-600 dark:bg-blue-900/20"
                            }`}
                          >
                            {mission.is_completed ? <CheckCircle className="w-6 h-6" /> : getIcon(mission.icon)}
                          </div>
                          <div>
                            <CardTitle className="text-lg">{mission.title}</CardTitle>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge className={getDifficultyColor(mission.difficulty)}>{mission.difficulty}</Badge>
                              {mission.expires_at && (
                                <Badge variant="outline" className="text-xs">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {getTimeRemaining(mission.expires_at)}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400">{mission.description}</p>

                      {/* Progress */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Progress</span>
                          <span>
                            {mission.current_progress}/{mission.target_value}
                          </span>
                        </div>
                        <Progress value={(mission.current_progress / mission.target_value) * 100} className="h-2" />
                      </div>

                      {/* Rewards */}
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1">
                            <Coins className="w-4 h-4 text-yellow-500" />
                            <span>{mission.reward_coins}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 text-blue-500" />
                            <span>{mission.reward_points}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Button */}
                      <Button
                        onClick={() => completeMission(mission.id)}
                        disabled={
                          mission.is_completed ||
                          mission.current_progress < mission.target_value ||
                          completingMission === mission.id
                        }
                        className="w-full"
                        variant={mission.is_completed ? "outline" : "default"}
                      >
                        {mission.is_completed ? (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Completed
                          </>
                        ) : mission.current_progress >= mission.target_value ? (
                          completingMission === mission.id ? (
                            "Claiming..."
                          ) : (
                            <>
                              <Gift className="w-4 h-4 mr-2" />
                              Claim Reward
                            </>
                          )
                        ) : (
                          <>
                            <Zap className="w-4 h-4 mr-2" />
                            In Progress
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Weekly Missions */}
            <TabsContent value="weekly" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {weeklyMissions.map((mission) => (
                  <Card
                    key={mission.id}
                    className="border-0 shadow-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`p-2 rounded-lg ${
                              mission.is_completed
                                ? "bg-green-100 text-green-600 dark:bg-green-900/20"
                                : "bg-purple-100 text-purple-600 dark:bg-purple-900/20"
                            }`}
                          >
                            {mission.is_completed ? <CheckCircle className="w-6 h-6" /> : getIcon(mission.icon)}
                          </div>
                          <div>
                            <CardTitle className="text-lg">{mission.title}</CardTitle>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge className={getDifficultyColor(mission.difficulty)}>{mission.difficulty}</Badge>
                              {mission.expires_at && (
                                <Badge variant="outline" className="text-xs">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {getTimeRemaining(mission.expires_at)}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400">{mission.description}</p>

                      {/* Progress */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Progress</span>
                          <span>
                            {mission.current_progress}/{mission.target_value}
                          </span>
                        </div>
                        <Progress value={(mission.current_progress / mission.target_value) * 100} className="h-2" />
                      </div>

                      {/* Rewards */}
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1">
                            <Coins className="w-4 h-4 text-yellow-500" />
                            <span>{mission.reward_coins}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 text-blue-500" />
                            <span>{mission.reward_points}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Button */}
                      <Button
                        onClick={() => completeMission(mission.id)}
                        disabled={
                          mission.is_completed ||
                          mission.current_progress < mission.target_value ||
                          completingMission === mission.id
                        }
                        className="w-full"
                        variant={mission.is_completed ? "outline" : "default"}
                      >
                        {mission.is_completed ? (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Completed
                          </>
                        ) : mission.current_progress >= mission.target_value ? (
                          completingMission === mission.id ? (
                            "Claiming..."
                          ) : (
                            <>
                              <Gift className="w-4 h-4 mr-2" />
                              Claim Reward
                            </>
                          )
                        ) : (
                          <>
                            <Zap className="w-4 h-4 mr-2" />
                            In Progress
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Achievement Missions */}
            <TabsContent value="achievements" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {achievementMissions.map((mission) => (
                  <Card
                    key={mission.id}
                    className="border-0 shadow-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`p-2 rounded-lg ${
                              mission.is_completed
                                ? "bg-green-100 text-green-600 dark:bg-green-900/20"
                                : "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20"
                            }`}
                          >
                            {mission.is_completed ? <CheckCircle className="w-6 h-6" /> : getIcon(mission.icon)}
                          </div>
                          <div>
                            <CardTitle className="text-lg">{mission.title}</CardTitle>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge className={getDifficultyColor(mission.difficulty)}>{mission.difficulty}</Badge>
                              <Badge variant="outline" className="text-xs">
                                Lifetime
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400">{mission.description}</p>

                      {/* Progress */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Progress</span>
                          <span>
                            {Math.min(mission.current_progress, mission.target_value)}/{mission.target_value}
                          </span>
                        </div>
                        <Progress
                          value={Math.min((mission.current_progress / mission.target_value) * 100, 100)}
                          className="h-2"
                        />
                      </div>

                      {/* Rewards */}
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-4">
                          {mission.reward_coins > 0 && (
                            <div className="flex items-center space-x-1">
                              <Coins className="w-4 h-4 text-yellow-500" />
                              <span>{mission.reward_coins}</span>
                            </div>
                          )}
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 text-blue-500" />
                            <span>{mission.reward_points}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Button */}
                      <Button
                        onClick={() => completeMission(mission.id)}
                        disabled={
                          mission.is_completed ||
                          mission.current_progress < mission.target_value ||
                          completingMission === mission.id
                        }
                        className="w-full"
                        variant={mission.is_completed ? "outline" : "default"}
                      >
                        {mission.is_completed ? (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Completed
                          </>
                        ) : mission.current_progress >= mission.target_value ? (
                          completingMission === mission.id ? (
                            "Claiming..."
                          ) : (
                            <>
                              <Gift className="w-4 h-4 mr-2" />
                              Claim Reward
                            </>
                          )
                        ) : (
                          <>
                            <Zap className="w-4 h-4 mr-2" />
                            In Progress
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AuthGuard>
  )
}
