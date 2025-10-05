"use client"
<<<<<<< HEAD
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
=======

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import {
  ChevronDown,
  ChevronUp,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Users,
  Heart,
  Target,
  Shield,
  Crown,
  Instagram,
  Youtube,
  Twitter,
  Mail,
  ArrowRight,
  Zap,
  Star,
  MapPin,
  Send,
  MessageCircle,
  Lightbulb,
  Rocket,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface ImpactInitiative {
  id: string
  title: string
  description: string
  image: string
  quote: string
  beneficiaries: string
  status: "ongoing" | "completed" | "planned"
}

interface EthicsValue {
  id: string
  title: string
  subtitle: string
  description: string
  icon: string
  examples: string[]
}

export default function MissionPage() {
  const { user, profile } = useAuth()
  const { toast } = useToast()
  const [isVideoPlaying, setIsVideoPlaying] = useState(true)
  const [isMuted, setIsMuted] = useState(true)
  const [expandedEthics, setExpandedEthics] = useState<Set<string>>(new Set())
  const [impactCount, setImpactCount] = useState(0)
  const [isAmbientPlaying, setIsAmbientPlaying] = useState(false)
  const [feedbackForm, setFeedbackForm] = useState({
    name: "",
    email: "",
    perspective: "",
    vision: "",
    contribution: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const ambientRef = useRef<HTMLAudioElement>(null)

  const impactInitiatives: ImpactInitiative[] = [
    {
      id: "youth-mentorship",
      title: "Warri Youth Mentorship",
      description: "Empowering young talents in the Niger Delta through music and life skills training",
      image:
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/IMG_7402.JPEG-T4o6Mr7wZmUsO8IyRHc3O3n7EHa6j0.jpeg",
      quote: "These kids get talent pass me, dem just need direction",
      beneficiaries: "500+ Youth",
      status: "ongoing",
    },
    {
      id: "flood-relief",
      title: "Delta Flood Relief",
      description: "Emergency support for communities affected by seasonal flooding",
      image:
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/IMG_7399.JPEG-NjYx5j2T2m2SVePUzllnlW2HIRoqb6.jpeg",
      quote: "When water enter house, na everybody problem be that",
      beneficiaries: "1,200+ Families",
      status: "completed",
    },
    {
      id: "school-support",
      title: "Education Support Program",
      description: "Providing school supplies and scholarships to underprivileged students",
      image:
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/IMG_7404.JPEG-OIP1VHAaazrshvWo8SJDdztCBi1tIW.jpeg",
      quote: "Education na the only way out of poverty",
      beneficiaries: "300+ Students",
      status: "ongoing",
    },
    {
      id: "music-studio",
      title: "Community Recording Studio",
      description: "Free recording facility for upcoming artists in Warri",
      image:
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/IMG_7406.JPEG-r6M2YDazTIECbUZ247EP8XwA4csaq1.jpeg",
      quote: "Make everybody get chance to record their story",
      beneficiaries: "150+ Artists",
      status: "planned",
    },
  ]

  const ethicsValues: EthicsValue[] = [
    {
      id: "loyalty",
      title: "Loyalty",
      subtitle: "I no dey switch sides",
      description:
        "Listen, for this street life, loyalty na everything. I no be the type wey go forget my people when money enter. The same boys wey dey with me when I no get nothing, na dem still dey with me now. That's how we roll for Warri - we keep am real, we keep am solid.",
      icon: "shield",
      examples: [
        "Never abandon the community that raised me - Warri boys for life",
        "Support upcoming artists from my area - we rise together",
        "Keep the same energy with old friends - no fake love",
        "Represent Delta State everywhere I go - area scatter!",
      ],
    },
    {
      id: "truth",
      title: "Truth",
      subtitle: "I talk am as e be",
      description:
        "You see this music thing? I no dey do am for hype. Every line wey I drop na real life experience. I talk about the struggle, the hustle, the pain, the joy - everything as e be. No sugar coating, no fake lifestyle. If you wan hear lies, go listen to another person music.",
      icon: "target",
      examples: [
        "Rap about real street experiences - no cap in my lyrics",
        "Call out injustice when I see am - somebody must talk",
        "No fake lifestyle for social media - what you see na what you get",
        "Tell the government wetin dey happen for ground - we dey suffer",
      ],
    },
    {
      id: "legacy",
      title: "Legacy",
      subtitle: "I dey build for tomorrow",
      description:
        "This thing wey I dey do no be just for today. I wan make sure say when I comot this world, I don leave something wey go help the next generation. Make dem know say one Warri boy make am, so dem too fit make am. That's the real success - when your story inspire others.",
      icon: "crown",
      examples: [
        "Invest in youth development programs - catch them young",
        "Create opportunities for upcoming artists - open doors",
        "Build institutions that will outlast me - permanent impact",
        "Document the culture for future generations - preserve our story",
      ],
    },
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setImpactCount((prev) => {
        const newCount = prev + Math.floor(Math.random() * 3) + 1
        return newCount > 2500 ? 2500 : newCount
      })
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Here you would typically send to an API endpoint
      await new Promise((resolve) => setTimeout(resolve, 2000)) // Simulate API call

      toast({
        title: "Thank you for your feedback! 🙏",
        description: "Your perspective helps us build a stronger movement.",
      })

      setFeedbackForm({
        name: "",
        email: "",
        perspective: "",
        vision: "",
        contribution: "",
      })
    } catch (error) {
      toast({
        title: "Something went wrong",
        description: "Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleVideoPlayback = () => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsVideoPlaying(!isVideoPlaying)
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const toggleAmbient = () => {
    if (ambientRef.current) {
      if (isAmbientPlaying) {
        ambientRef.current.pause()
      } else {
        ambientRef.current.play()
      }
      setIsAmbientPlaying(!isAmbientPlaying)
    }
  }

  const toggleEthics = (id: string) => {
    const newExpanded = new Set(expandedEthics)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedEthics(newExpanded)
  }

  const scrollToMembership = () => {
    document.getElementById("membership-section")?.scrollIntoView({
      behavior: "smooth",
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ongoing":
        return "bg-green-500/10 text-green-400 border-green-500/20"
      case "completed":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20"
      case "planned":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/20"
    }
  }

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "shield":
        return <Shield className="w-8 h-8" />
      case "target":
        return <Target className="w-8 h-8" />
      case "crown":
        return <Crown className="w-8 h-8" />
      default:
        return <Star className="w-8 h-8" />
    }
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      <style jsx>{`
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(239, 68, 68, 0.3); }
          50% { box-shadow: 0 0 40px rgba(239, 68, 68, 0.6), 0 0 60px rgba(239, 68, 68, 0.3); }
        }
        .pulse-glow {
          animation: pulse-glow 3s ease-in-out infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .float-animation {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>

      <audio ref={ambientRef} loop preload="auto" className="hidden">
        <source src="/audio/warri-street-ambient.mp3" type="audio/mpeg" />
      </audio>

      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background Video */}
        <div className="absolute inset-0 z-0">
          <video ref={videoRef} autoPlay muted={isMuted} loop playsInline className="w-full h-full object-cover">
            <source src="/videos/erigga-warri-streets.mp4" type="video/mp4" />
            {/* Fallback image */}
            <div className="w-full h-full bg-gradient-to-br from-red-900 via-black to-yellow-900" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
          <div className="absolute inset-0 bg-gradient-radial from-red-500/10 via-transparent to-transparent animate-pulse" />
        </div>

        <div className="absolute inset-0 z-5">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-red-500/10 rounded-full blur-xl float-animation" />
          <div
            className="absolute top-3/4 right-1/4 w-24 h-24 bg-yellow-500/10 rounded-full blur-xl float-animation"
            style={{ animationDelay: "2s" }}
          />
          <div
            className="absolute top-1/2 left-3/4 w-20 h-20 bg-red-500/10 rounded-full blur-xl float-animation"
            style={{ animationDelay: "4s" }}
          />
        </div>

        {/* Video Controls */}
        <div className="absolute top-6 right-6 z-20 flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleVideoPlayback}
            className="bg-black/50 hover:bg-black/70 text-white border border-red-500/30"
          >
            {isVideoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMute}
            className="bg-black/50 hover:bg-black/70 text-white border border-red-500/30"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleAmbient}
            className={cn(
              "bg-black/50 hover:bg-black/70 text-white border border-red-500/30",
              isAmbientPlaying && "bg-red-500/20 border-red-500",
            )}
          >
            <Volume2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Hero Content */}
        <div className="container mx-auto px-4 z-10 relative text-center">
          <div className="space-y-8">
            <div className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-red-600 to-yellow-600 text-black font-bold text-sm mb-8 pulse-glow">
              <MapPin className="h-4 w-4 mr-2" />
              WARRI TO THE WORLD
              <div className="w-2 h-2 rounded-full bg-black animate-pulse ml-3"></div>
            </div>

            <h1 className="text-6xl md:text-8xl font-black leading-tight">
              <span className="block text-red-500 animate-pulse">NO BE BY CHARTS.</span>
              <span className="block text-yellow-500 animate-pulse" style={{ animationDelay: "0.5s" }}>
                NA BY IMPACT.
              </span>
            </h1>

            <p className="text-2xl md:text-3xl font-bold text-gray-300 max-w-2xl mx-auto">
              This no be music. Na movement. We dey change lives, one song at a time.
            </p>

            <Button
              onClick={scrollToMembership}
              size="lg"
              className="bg-gradient-to-r from-red-600 to-yellow-600 text-black hover:from-red-700 hover:to-yellow-700 font-bold text-lg px-8 py-4 rounded-full"
            >
              Join the Movement
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-8 h-8 text-red-500" />
        </div>
      </section>

      <section className="py-24 bg-gradient-to-b from-black via-gray-900 to-black relative">
        <div className="absolute inset-0 bg-[url('/images/concrete-texture.jpg')] opacity-5"></div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-black text-white mb-6">REAL IMPACT, REAL CHANGE</h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Actions speak louder than lyrics. See how we dey change lives for real. No be mouth, na action.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {impactInitiatives.map((initiative, index) => (
              <Card
                key={initiative.id}
                className="bg-gray-900/50 border-red-500/20 backdrop-blur-sm hover:bg-gray-800/50 transition-all duration-500 group cursor-pointer overflow-hidden pulse-glow"
                style={{ animationDelay: `${index * 0.5}s` }}
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={initiative.image || "/placeholder.svg"}
                    alt={initiative.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <Badge className={cn("absolute top-4 right-4", getStatusColor(initiative.status))}>
                    {initiative.status}
                  </Badge>
                </div>

                <CardContent className="p-6 space-y-4">
                  <h3 className="text-xl font-bold text-white group-hover:text-red-400 transition-colors">
                    {initiative.title}
                  </h3>

                  <p className="text-gray-400 text-sm leading-relaxed">{initiative.description}</p>

                  <blockquote className="text-red-400 italic text-sm border-l-2 border-red-500/30 pl-3">
                    "{initiative.quote}"
                  </blockquote>

                  <div className="flex items-center justify-between">
                    <span className="text-yellow-400 font-semibold text-sm">{initiative.beneficiaries}</span>
                    <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-red-400 transition-colors" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-gradient-to-b from-black via-red-950/20 to-black">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-black text-white mb-6">THE CODE I LIVE BY</h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              These no be just words. Na principles wey guide every move I make. This na wetin make me who I be.
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-6">
            {ethicsValues.map((value) => (
              <Card key={value.id} className="bg-gray-900/30 border-red-500/20 backdrop-blur-sm overflow-hidden">
                <div
                  className="p-6 cursor-pointer hover:bg-gray-800/30 transition-colors"
                  onClick={() => toggleEthics(value.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-red-500 to-yellow-500 flex items-center justify-center">
                        {getIcon(value.icon)}
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white">{value.title}</h3>
                        <p className="text-red-400 font-semibold">{value.subtitle}</p>
                      </div>
                    </div>
                    {expandedEthics.has(value.id) ? (
                      <ChevronUp className="w-6 h-6 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                </div>

                {expandedEthics.has(value.id) && (
                  <div className="px-6 pb-6 space-y-6 border-t border-red-500/20">
                    <p className="text-gray-300 leading-relaxed text-lg">{value.description}</p>

                    <div>
                      <h4 className="text-yellow-400 font-semibold mb-3">How I Live This:</h4>
                      <ul className="space-y-2">
                        {value.examples.map((example, index) => (
                          <li key={index} className="flex items-start gap-3 text-gray-400">
                            <div className="w-2 h-2 rounded-full bg-red-500 mt-2 flex-shrink-0"></div>
                            {example}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-gradient-to-b from-black via-gray-900/50 to-black relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.05)_0%,transparent_70%)]"></div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-5xl font-black text-white mb-6 pulse-glow">WHO IS ERIGGA TO YOU?</h2>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                Your voice matters pass anything. Help us understand how this movement dey touch your life and how we
                fit take am go another level. Make we hear from you!
              </p>
            </div>

            <Card className="bg-gray-900/30 border-red-500/20 backdrop-blur-sm pulse-glow">
              <CardContent className="p-8">
                <form onSubmit={handleFeedbackSubmit} className="space-y-8">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-white font-semibold flex items-center gap-2">
                        <Users className="w-4 h-4 text-red-400" />
                        Your Name
                      </label>
                      <Input
                        value={feedbackForm.name}
                        onChange={(e) => setFeedbackForm((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="Tell us your name"
                        className="bg-gray-800/50 border-red-500/20 text-white placeholder-gray-500 focus:border-red-500"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-white font-semibold flex items-center gap-2">
                        <Mail className="w-4 h-4 text-red-400" />
                        Email Address
                      </label>
                      <Input
                        type="email"
                        value={feedbackForm.email}
                        onChange={(e) => setFeedbackForm((prev) => ({ ...prev, email: e.target.value }))}
                        placeholder="your.email@example.com"
                        className="bg-gray-800/50 border-red-500/20 text-white placeholder-gray-500 focus:border-red-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-white font-semibold flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 text-yellow-400" />
                      What's your perspective about this project?
                    </label>
                    <Textarea
                      value={feedbackForm.perspective}
                      onChange={(e) => setFeedbackForm((prev) => ({ ...prev, perspective: e.target.value }))}
                      placeholder="Share your thoughts about the Erigga Live movement, what it means to you, and how it impacts your life..."
                      className="bg-gray-800/50 border-red-500/20 text-white placeholder-gray-500 focus:border-red-500 min-h-[120px] resize-none"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-white font-semibold flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-green-400" />
                      How can we take this vision to another level?
                    </label>
                    <Textarea
                      value={feedbackForm.vision}
                      onChange={(e) => setFeedbackForm((prev) => ({ ...prev, vision: e.target.value }))}
                      placeholder="What ideas do you have to expand the movement? What features, initiatives, or changes would make the biggest impact?"
                      className="bg-gray-800/50 border-red-500/20 text-white placeholder-gray-500 focus:border-red-500 min-h-[120px] resize-none"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-white font-semibold flex items-center gap-2">
                      <Rocket className="w-4 h-4 text-blue-400" />
                      How would you like to contribute to the movement?
                    </label>
                    <Textarea
                      value={feedbackForm.contribution}
                      onChange={(e) => setFeedbackForm((prev) => ({ ...prev, contribution: e.target.value }))}
                      placeholder="Whether it's skills, ideas, resources, or just spreading the word - how do you see yourself being part of this journey?"
                      className="bg-gray-800/50 border-red-500/20 text-white placeholder-gray-500 focus:border-red-500 min-h-[100px] resize-none"
                    />
                  </div>

                  <div className="text-center">
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      size="lg"
                      className="bg-gradient-to-r from-red-600 to-yellow-600 text-black hover:from-red-700 hover:to-yellow-700 font-bold text-lg px-12 py-4 rounded-full pulse-glow disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin mr-3" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5 mr-3" />
                          Share Your Voice
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section id="membership-section" className="py-24 bg-gradient-to-b from-black via-red-950/30 to-black">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto space-y-12">
            <blockquote className="text-4xl md:text-6xl font-black text-white leading-tight">
              "If you dey feel this movement, you already belong. Welcome to the family."
            </blockquote>

            <div className="space-y-8">
              <Button
                size="lg"
                className="bg-gradient-to-r from-red-600 to-yellow-600 text-black hover:from-red-700 hover:to-yellow-700 font-bold text-xl px-12 py-6 rounded-full"
                onClick={() => {
                  if (user) {
                    toast({
                      title: "Welcome to the Movement! 🔥",
                      description: "You're already part of the family. Keep supporting the culture!",
                    })
                  } else {
                    window.location.href = "/signup"
                  }
                }}
              >
                <Users className="w-6 h-6 mr-3" />
                Become a Member
              </Button>

              <div className="grid md:grid-cols-3 gap-8 max-w-3xl mx-auto">
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto">
                    <Zap className="w-6 h-6 text-red-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Early Access to Drops</h3>
                  <p className="text-gray-400 text-sm">Be the first to hear new music and exclusive content</p>
                </div>

                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto">
                    <Heart className="w-6 h-6 text-yellow-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Behind-the-Scenes Content</h3>
                  <p className="text-gray-400 text-sm">See the real story behind the music and the movement</p>
                </div>

                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
                    <Target className="w-6 h-6 text-green-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Community Impact Updates</h3>
                  <p className="text-gray-400 text-sm">Track how your support is changing lives in real time</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-16 bg-black border-t border-red-500/20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h3 className="text-3xl font-black text-white">Stay Connected to the Movement</h3>

              <div className="flex gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="bg-gray-900 hover:bg-red-600 text-white border border-red-500/20"
                  onClick={() => window.open("https://instagram.com/erigga", "_blank")}
                >
                  <Instagram className="w-5 h-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="bg-gray-900 hover:bg-red-600 text-white border border-red-500/20"
                  onClick={() => window.open("https://youtube.com/@erigga", "_blank")}
                >
                  <Youtube className="w-5 h-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="bg-gray-900 hover:bg-red-600 text-white border border-red-500/20"
                  onClick={() => window.open("https://twitter.com/erigga", "_blank")}
                >
                  <Twitter className="w-5 h-5" />
                </Button>
              </div>

              <div className="flex gap-4">
                <input
                  type="email"
                  placeholder="Enter your email for updates"
                  className="flex-1 px-4 py-3 bg-gray-900/50 border border-red-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
                />
                <Button className="bg-red-600 hover:bg-red-700 text-white px-6">
                  <Mail className="w-4 h-4 mr-2" />
                  Subscribe
                </Button>
              </div>
            </div>

            <div className="text-center md:text-right">
              <blockquote className="text-2xl md:text-3xl font-black text-red-500 leading-tight">
                "Na legacy we dey build. No be hype. This thing go last forever."
              </blockquote>
              <p className="text-gray-400 mt-4">- Erigga, The Paperboi of Africa</p>
            </div>
          </div>

          <div className="border-t border-red-500/20 mt-12 pt-8 text-center">
            <p className="text-gray-500">© 2025 Erigga Live. Built for the culture, by the culture.</p>
          </div>
        </div>
      </footer>
    </div>
>>>>>>> new
  )
}
