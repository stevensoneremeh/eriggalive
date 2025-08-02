"use client"

import { AuthGuard } from "@/components/auth-guard"
import { useAuth } from "@/contexts/auth-context"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Target,
  Trophy,
  Coins,
  Star,
  CheckCircle,
  Clock,
  Users,
  MessageCircle,
  Music,
  Calendar,
  Zap,
} from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import { useToast } from "@/hooks/use-toast"

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
}

export default function MissionPage() {
  const { user, profile, refreshProfile } = useAuth()
  const { toast } = useToast()
  const [missions, setMissions] = useState<Mission[]>([])
  const [loading, setLoading] = useState(true)
  const [completingMission, setCompletingMission] = useState<string | null>(null)

  // Mock missions data - in a real app, this would come from your database
  const mockMissions: Mission[] = [
    {
      id: "daily-1",
      title: "Daily Check-in",
      description: "Visit the community page and check what's happening",
      type: "daily",
      reward_coins: 10,
      reward_points: 5,
      target_value: 1,
      current_progress: 0,
      is_completed: false,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      icon: "calendar",
    },
    {
      id: "daily-2",
      title: "Community Engagement",
      description: "Like or comment on 3 community posts",
      type: "daily",
      reward_coins: 15,
      reward_points: 10,
      target_value: 3,
      current_progress: 1,
      is_completed: false,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      icon: "message-circle",
    },
    {
      id: "weekly-1",
      title: "Music Explorer",
      description: "Listen to 10 tracks in the media vault",
      type: "weekly",
      reward_coins: 50,
      reward_points: 25,
      target_value: 10,
      current_progress: 3,
      is_completed: false,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      icon: "music",
    },
    {
      id: "weekly-2",
      title: "Social Butterfly",
      description: "Make 5 new posts in the community",
      type: "weekly",
      reward_coins: 75,
      reward_points: 40,
      target_value: 5,
      current_progress: 2,
      is_completed: false,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      icon: "users",
    },
    {
      id: "achievement-1",
      title: "First Steps",
      description: "Complete your profile setup",
      type: "achievement",
      reward_coins: 100,
      reward_points: 50,
      target_value: 1,
      current_progress: 1,
      is_completed: true,
      icon: "star",
    },
    {
      id: "achievement-2",
      title: "Community Leader",
      description: "Reach 100 total likes on your posts",
      type: "achievement",
      reward_coins: 500,
      reward_points: 200,
      target_value: 100,
      current_progress: 23,
      is_completed: false,
      icon: "trophy",
    },
  ]

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "calendar":
        return <Calendar className="w-6 h-6" />
      case "message-circle":
        return <MessageCircle className="w-6 h-6" />
      case "music":
        return <Music className="w-6 h-6" />
      case "users":
        return <Users className="w-6 h-6" />
      case "star":
        return <Star className="w-6 h-6" />
      case "trophy":
        return <Trophy className="w-6 h-6" />
      default:
        return <Target className="w-6 h-6" />
    }
  }

  const getMissionTypeColor = (type: string) => {
    switch (type) {
      case "daily":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "weekly":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
      case "achievement":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const completeMission = async (missionId: string) => {
    const mission = missions.find((m) => m.id === missionId)
    if (!mission || mission.is_completed || !profile) return

    setCompletingMission(missionId)

    try {
      // In a real app, you would update the mission status in the database
      // and update the user's coins and points
      const { error } = await supabase
        .from("users")
        .update({
          coins: (profile.coins || 0) + mission.reward_coins,
          points: (profile.points || 0) + mission.reward_points,
        })
        .eq("id", profile.id)

      if (error) throw error

      // Update local state
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
        description: "Failed to complete mission",
        variant: "destructive",
      })
    } finally {
      setCompletingMission(null)
    }
  }

  const getTimeRemaining = (expiresAt?: string) => {
    if (!expiresAt) return null

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

  useEffect(() => {
    // In a real app, you would fetch missions from your database
    setMissions(mockMissions)
    setLoading(false)
  }, [])

  const dailyMissions = missions.filter((m) => m.type === "daily")
  const weeklyMissions = missions.filter((m) => m.type === "weekly")
  const achievements = missions.filter((m) => m.type === "achievement")

  const totalCoinsEarned = missions.filter((m) => m.is_completed).reduce((sum, m) => sum + m.reward_coins, 0)

  const completedMissions = missions.filter((m) => m.is_completed).length

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Missions & Achievements</h1>
            <p className="text-gray-600 dark:text-gray-300">
              Complete missions to earn coins and points, unlock achievements
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{completedMissions}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Missions</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{missions.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                    <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Coins Earned</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalCoinsEarned}</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
                    <Coins className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Current Level</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{profile?.level || 1}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                    <Zap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Missions Tabs */}
          <Tabs defaultValue="daily" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="daily">Daily Missions</TabsTrigger>
              <TabsTrigger value="weekly">Weekly Missions</TabsTrigger>
              <TabsTrigger value="achievements">Achievements</TabsTrigger>
            </TabsList>

            {/* Daily Missions */}
            <TabsContent value="daily">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {dailyMissions.map((mission) => (
                  <Card key={mission.id} className={mission.is_completed ? "opacity-75" : ""}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                              mission.is_completed
                                ? "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400"
                                : "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400"
                            }`}
                          >
                            {mission.is_completed ? <CheckCircle className="w-6 h-6" /> : getIcon(mission.icon)}
                          </div>
                          <div>
                            <CardTitle className="text-lg">{mission.title}</CardTitle>
                            <CardDescription>{mission.description}</CardDescription>
                          </div>
                        </div>
                        <Badge className={getMissionTypeColor(mission.type)}>{mission.type}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Progress */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>
                            {mission.current_progress}/{mission.target_value}
                          </span>
                        </div>
                        <Progress value={(mission.current_progress / mission.target_value) * 100} className="h-2" />
                      </div>

                      {/* Rewards */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1">
                            <Coins className="w-4 h-4 text-yellow-500" />
                            <span className="text-sm font-medium">{mission.reward_coins}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 text-purple-500" />
                            <span className="text-sm font-medium">{mission.reward_points}</span>
                          </div>
                        </div>
                        {mission.expires_at && (
                          <div className="flex items-center space-x-1 text-sm text-gray-500">
                            <Clock className="w-4 h-4" />
                            <span>{getTimeRemaining(mission.expires_at)}</span>
                          </div>
                        )}
                      </div>

                      {/* Action Button */}
                      {mission.is_completed ? (
                        <Button disabled className="w-full">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Completed
                        </Button>
                      ) : mission.current_progress >= mission.target_value ? (
                        <Button
                          onClick={() => completeMission(mission.id)}
                          disabled={completingMission === mission.id}
                          className="w-full"
                        >
                          {completingMission === mission.id ? "Claiming..." : "Claim Reward"}
                        </Button>
                      ) : (
                        <Button variant="outline" className="w-full bg-transparent" disabled>
                          In Progress
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Weekly Missions */}
            <TabsContent value="weekly">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {weeklyMissions.map((mission) => (
                  <Card key={mission.id} className={mission.is_completed ? "opacity-75" : ""}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                              mission.is_completed
                                ? "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400"
                                : "bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400"
                            }`}
                          >
                            {mission.is_completed ? <CheckCircle className="w-6 h-6" /> : getIcon(mission.icon)}
                          </div>
                          <div>
                            <CardTitle className="text-lg">{mission.title}</CardTitle>
                            <CardDescription>{mission.description}</CardDescription>
                          </div>
                        </div>
                        <Badge className={getMissionTypeColor(mission.type)}>{mission.type}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Progress */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>
                            {mission.current_progress}/{mission.target_value}
                          </span>
                        </div>
                        <Progress value={(mission.current_progress / mission.target_value) * 100} className="h-2" />
                      </div>

                      {/* Rewards */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1">
                            <Coins className="w-4 h-4 text-yellow-500" />
                            <span className="text-sm font-medium">{mission.reward_coins}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 text-purple-500" />
                            <span className="text-sm font-medium">{mission.reward_points}</span>
                          </div>
                        </div>
                        {mission.expires_at && (
                          <div className="flex items-center space-x-1 text-sm text-gray-500">
                            <Clock className="w-4 h-4" />
                            <span>{getTimeRemaining(mission.expires_at)}</span>
                          </div>
                        )}
                      </div>

                      {/* Action Button */}
                      {mission.is_completed ? (
                        <Button disabled className="w-full">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Completed
                        </Button>
                      ) : mission.current_progress >= mission.target_value ? (
                        <Button
                          onClick={() => completeMission(mission.id)}
                          disabled={completingMission === mission.id}
                          className="w-full"
                        >
                          {completingMission === mission.id ? "Claiming..." : "Claim Reward"}
                        </Button>
                      ) : (
                        <Button variant="outline" className="w-full bg-transparent" disabled>
                          In Progress
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Achievements */}
            <TabsContent value="achievements">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {achievements.map((mission) => (
                  <Card key={mission.id} className={mission.is_completed ? "opacity-75" : ""}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                              mission.is_completed
                                ? "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400"
                                : "bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400"
                            }`}
                          >
                            {mission.is_completed ? <CheckCircle className="w-6 h-6" /> : getIcon(mission.icon)}
                          </div>
                          <div>
                            <CardTitle className="text-lg">{mission.title}</CardTitle>
                            <CardDescription>{mission.description}</CardDescription>
                          </div>
                        </div>
                        <Badge className={getMissionTypeColor(mission.type)}>{mission.type}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Progress */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>
                            {mission.current_progress}/{mission.target_value}
                          </span>
                        </div>
                        <Progress value={(mission.current_progress / mission.target_value) * 100} className="h-2" />
                      </div>

                      {/* Rewards */}
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <Coins className="w-4 h-4 text-yellow-500" />
                          <span className="text-sm font-medium">{mission.reward_coins}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-purple-500" />
                          <span className="text-sm font-medium">{mission.reward_points}</span>
                        </div>
                      </div>

                      {/* Action Button */}
                      {mission.is_completed ? (
                        <Button disabled className="w-full">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Completed
                        </Button>
                      ) : mission.current_progress >= mission.target_value ? (
                        <Button
                          onClick={() => completeMission(mission.id)}
                          disabled={completingMission === mission.id}
                          className="w-full"
                        >
                          {completingMission === mission.id ? "Claiming..." : "Claim Reward"}
                        </Button>
                      ) : (
                        <Button variant="outline" className="w-full bg-transparent" disabled>
                          In Progress
                        </Button>
                      )}
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
