"use client"

import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Target, Trophy, Coins, Users, Music, Star, CheckCircle, Clock, Gift, Zap } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"

const missions = [
  {
    id: 1,
    title: "Welcome to Erigga Live",
    description: "Complete your profile setup and join the community",
    reward: 50,
    progress: 100,
    completed: true,
    type: "onboarding",
    tasks: [
      { name: "Create account", completed: true },
      { name: "Upload profile picture", completed: true },
      { name: "Write bio", completed: true },
    ],
  },
  {
    id: 2,
    title: "Community Contributor",
    description: "Make your first post in the community",
    reward: 25,
    progress: 0,
    completed: false,
    type: "community",
    tasks: [
      { name: "Create your first post", completed: false },
      { name: "Get 5 likes on a post", completed: false },
    ],
  },
  {
    id: 3,
    title: "Music Explorer",
    description: "Listen to 10 tracks in the vault",
    reward: 30,
    progress: 40,
    completed: false,
    type: "music",
    tasks: [{ name: "Listen to 10 tracks", completed: false, current: 4, total: 10 }],
  },
  {
    id: 4,
    title: "Social Butterfly",
    description: "Follow 5 community members",
    reward: 20,
    progress: 60,
    completed: false,
    type: "social",
    tasks: [{ name: "Follow 5 members", completed: false, current: 3, total: 5 }],
  },
  {
    id: 5,
    title: "Daily Visitor",
    description: "Visit Erigga Live for 7 consecutive days",
    reward: 100,
    progress: 71,
    completed: false,
    type: "daily",
    tasks: [{ name: "Daily login streak", completed: false, current: 5, total: 7 }],
  },
]

const achievements = [
  {
    id: 1,
    title: "First Steps",
    description: "Completed your first mission",
    icon: Trophy,
    unlocked: true,
    date: "2024-01-15",
  },
  {
    id: 2,
    title: "Community Member",
    description: "Made your first community post",
    icon: Users,
    unlocked: false,
    date: null,
  },
  {
    id: 3,
    title: "Music Lover",
    description: "Listened to 50 tracks",
    icon: Music,
    unlocked: false,
    date: null,
  },
  {
    id: 4,
    title: "Coin Collector",
    description: "Earned 500 coins",
    icon: Coins,
    unlocked: false,
    date: null,
  },
]

export default function MissionPage() {
  const { profile } = useAuth()

  const completedMissions = missions.filter((m) => m.completed).length
  const totalCoinsEarned = missions.filter((m) => m.completed).reduce((sum, m) => sum + m.reward, 0)

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                <Target className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
              Missions & Achievements
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Complete missions to earn coins and unlock achievements
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{completedMissions}</div>
                <div className="text-sm text-gray-500">Missions Completed</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Coins className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalCoinsEarned}</div>
                <div className="text-sm text-gray-500">Coins Earned</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Trophy className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {achievements.filter((a) => a.unlocked).length}
                </div>
                <div className="text-sm text-gray-500">Achievements Unlocked</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Active Missions */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="w-5 h-5 mr-2" />
                    Active Missions
                  </CardTitle>
                  <CardDescription>Complete these missions to earn coins and XP</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {missions.map((mission) => (
                    <div
                      key={mission.id}
                      className={`p-4 rounded-lg border transition-all ${
                        mission.completed
                          ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                          : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-md"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-semibold text-gray-900 dark:text-white">{mission.title}</h3>
                            {mission.completed && <CheckCircle className="w-4 h-4 text-green-500" />}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{mission.description}</p>

                          {/* Progress Bar */}
                          <div className="mb-2">
                            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                              <span>Progress</span>
                              <span>{mission.progress}%</span>
                            </div>
                            <Progress value={mission.progress} className="h-2" />
                          </div>

                          {/* Tasks */}
                          <div className="space-y-1">
                            {mission.tasks.map((task, index) => (
                              <div key={index} className="flex items-center space-x-2 text-sm">
                                {task.completed ? (
                                  <CheckCircle className="w-3 h-3 text-green-500" />
                                ) : (
                                  <Clock className="w-3 h-3 text-gray-400" />
                                )}
                                <span
                                  className={
                                    task.completed ? "text-green-600 line-through" : "text-gray-600 dark:text-gray-400"
                                  }
                                >
                                  {task.name}
                                  {task.current && task.total && ` (${task.current}/${task.total})`}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="text-right ml-4">
                          <div className="flex items-center space-x-1 text-yellow-600">
                            <Coins className="w-4 h-4" />
                            <span className="font-semibold">{mission.reward}</span>
                          </div>
                          {mission.completed && (
                            <Badge variant="secondary" className="mt-2 bg-green-100 text-green-800">
                              Completed
                            </Badge>
                          )}
                        </div>
                      </div>

                      {!mission.completed && (
                        <div className="flex space-x-2">
                          {mission.type === "community" && (
                            <Button asChild size="sm" variant="outline">
                              <Link href="/community">
                                <Users className="w-4 h-4 mr-1" />
                                Go to Community
                              </Link>
                            </Button>
                          )}
                          {mission.type === "music" && (
                            <Button asChild size="sm" variant="outline">
                              <Link href="/vault">
                                <Music className="w-4 h-4 mr-1" />
                                Open Vault
                              </Link>
                            </Button>
                          )}
                          {mission.type === "social" && (
                            <Button asChild size="sm" variant="outline">
                              <Link href="/community">
                                <Users className="w-4 h-4 mr-1" />
                                Find Members
                              </Link>
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Achievements Sidebar */}
            <div className="space-y-6">
              {/* Daily Bonus */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Gift className="w-5 h-5 mr-2" />
                    Daily Bonus
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Coins className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">+10 Coins</div>
                    <div className="text-sm text-gray-500 mb-4">Daily login bonus</div>
                    <Button className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600">
                      <Zap className="w-4 h-4 mr-2" />
                      Claim Bonus
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Achievements */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Trophy className="w-5 h-5 mr-2" />
                    Achievements
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {achievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className={`p-3 rounded-lg border transition-all ${
                        achievement.unlocked
                          ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
                          : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-60"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            achievement.unlocked ? "bg-yellow-100 dark:bg-yellow-900" : "bg-gray-100 dark:bg-gray-700"
                          }`}
                        >
                          <achievement.icon
                            className={`w-5 h-5 ${
                              achievement.unlocked ? "text-yellow-600 dark:text-yellow-400" : "text-gray-400"
                            }`}
                          />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-sm text-gray-900 dark:text-white">{achievement.title}</div>
                          <div className="text-xs text-gray-500">{achievement.description}</div>
                          {achievement.unlocked && achievement.date && (
                            <div className="text-xs text-yellow-600 mt-1">
                              Unlocked {new Date(achievement.date).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                        {achievement.unlocked && <Star className="w-4 h-4 text-yellow-500" />}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Your Progress</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Current Level</span>
                    <Badge variant="secondary">{profile?.level || 1}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Points</span>
                    <span className="font-semibold">{profile?.points?.toLocaleString() || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Coin Balance</span>
                    <div className="flex items-center space-x-1">
                      <Coins className="w-4 h-4 text-yellow-500" />
                      <span className="font-semibold">{profile?.coins?.toLocaleString() || 0}</span>
                    </div>
                  </div>
                  <div className="pt-2">
                    <Button asChild variant="outline" className="w-full bg-transparent">
                      <Link href="/dashboard">View Dashboard</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
