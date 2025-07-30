"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Target, Users, Music, Heart, Star, Trophy, Gift, Zap } from "lucide-react"
import Link from "next/link"

const missions = [
  {
    id: 1,
    title: "Community Builder",
    description: "Help grow the Erigga Live community",
    icon: Users,
    progress: 75,
    reward: 500,
    status: "active",
    tasks: [
      { name: "Invite 5 friends", completed: true },
      { name: "Create 3 posts", completed: true },
      { name: "Get 10 upvotes", completed: false },
    ],
  },
  {
    id: 2,
    title: "Music Enthusiast",
    description: "Engage with Erigga's music content",
    icon: Music,
    progress: 60,
    reward: 300,
    status: "active",
    tasks: [
      { name: "Listen to 20 tracks", completed: true },
      { name: "Share 5 songs", completed: true },
      { name: "Create a playlist", completed: false },
    ],
  },
  {
    id: 3,
    title: "Super Fan",
    description: "Show your dedication to Erigga",
    icon: Heart,
    progress: 90,
    reward: 750,
    status: "active",
    tasks: [
      { name: "Daily login streak (7 days)", completed: true },
      { name: "Comment on 10 posts", completed: true },
      { name: "Attend live session", completed: false },
    ],
  },
  {
    id: 4,
    title: "Content Creator",
    description: "Create engaging content for the community",
    icon: Star,
    progress: 40,
    reward: 400,
    status: "active",
    tasks: [
      { name: "Upload profile picture", completed: true },
      { name: "Write detailed bio", completed: false },
      { name: "Post original content", completed: false },
    ],
  },
]

const achievements = [
  {
    title: "Early Adopter",
    description: "Joined Erigga Live in the first month",
    icon: Trophy,
    earned: true,
    rarity: "legendary",
  },
  {
    title: "Community Leader",
    description: "Helped 50+ new members get started",
    icon: Users,
    earned: true,
    rarity: "epic",
  },
  {
    title: "Music Curator",
    description: "Created 10+ popular playlists",
    icon: Music,
    earned: false,
    rarity: "rare",
  },
  {
    title: "Generous Supporter",
    description: "Gifted coins to 25+ community members",
    icon: Gift,
    earned: false,
    rarity: "uncommon",
  },
]

const getRarityColor = (rarity: string) => {
  switch (rarity) {
    case "legendary":
      return "bg-gradient-to-r from-yellow-400 to-orange-500"
    case "epic":
      return "bg-gradient-to-r from-purple-500 to-pink-500"
    case "rare":
      return "bg-gradient-to-r from-blue-500 to-cyan-500"
    case "uncommon":
      return "bg-gradient-to-r from-green-500 to-emerald-500"
    default:
      return "bg-gray-500"
  }
}

export default function MissionPage() {
  const totalCoinsEarned = missions.reduce((total, mission) => {
    return total + (mission.progress === 100 ? mission.reward : 0)
  }, 0)

  const activeMissions = missions.filter((mission) => mission.status === "active")
  const completedMissions = missions.filter((mission) => mission.progress === 100)

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500">
            <Target className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Mission Control</h1>
            <p className="text-muted-foreground">Complete missions to earn coins and unlock achievements</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Zap className="h-5 w-5 text-yellow-500" />
                <div>
                  <div className="text-2xl font-bold">{activeMissions.length}</div>
                  <div className="text-sm text-muted-foreground">Active Missions</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Trophy className="h-5 w-5 text-blue-500" />
                <div>
                  <div className="text-2xl font-bold">{completedMissions.length}</div>
                  <div className="text-sm text-muted-foreground">Completed</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Star className="h-5 w-5 text-purple-500" />
                <div>
                  <div className="text-2xl font-bold">{achievements.filter((a) => a.earned).length}</div>
                  <div className="text-sm text-muted-foreground">Achievements</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Gift className="h-5 w-5 text-green-500" />
                <div>
                  <div className="text-2xl font-bold">{totalCoinsEarned}</div>
                  <div className="text-sm text-muted-foreground">Coins Earned</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Missions */}
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-bold mb-6">Active Missions</h2>
          <div className="space-y-6">
            {missions.map((mission) => {
              const Icon = mission.icon
              const completedTasks = mission.tasks.filter((task) => task.completed).length
              const totalTasks = mission.tasks.length

              return (
                <Card key={mission.id} className="overflow-hidden">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{mission.title}</CardTitle>
                          <CardDescription>{mission.description}</CardDescription>
                        </div>
                      </div>
                      <Badge variant={mission.progress === 100 ? "default" : "secondary"}>
                        {mission.progress === 100 ? "Completed" : "Active"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Progress */}
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Progress</span>
                          <span>{mission.progress}%</span>
                        </div>
                        <Progress value={mission.progress} className="h-2" />
                      </div>

                      {/* Tasks */}
                      <div>
                        <h4 className="font-medium mb-2">
                          Tasks ({completedTasks}/{totalTasks})
                        </h4>
                        <div className="space-y-2">
                          {mission.tasks.map((task, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm">
                              <div
                                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                  task.completed ? "bg-green-500 border-green-500" : "border-muted-foreground"
                                }`}
                              >
                                {task.completed && <div className="w-2 h-2 bg-white rounded-full" />}
                              </div>
                              <span className={task.completed ? "line-through text-muted-foreground" : ""}>
                                {task.name}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Reward */}
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center gap-2">
                          <Gift className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm font-medium">Reward: {mission.reward} coins</span>
                        </div>
                        {mission.progress === 100 ? (
                          <Button size="sm" disabled>
                            Claimed
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline">
                            Continue
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Achievements */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Achievements</h2>
          <div className="space-y-4">
            {achievements.map((achievement, index) => {
              const Icon = achievement.icon
              return (
                <Card key={index} className={`overflow-hidden ${achievement.earned ? "ring-2 ring-primary" : ""}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          achievement.earned ? getRarityColor(achievement.rarity) : "bg-muted"
                        }`}
                      >
                        <Icon className={`h-5 w-5 ${achievement.earned ? "text-white" : "text-muted-foreground"}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium">{achievement.title}</h3>
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              achievement.earned ? getRarityColor(achievement.rarity) + " text-white border-0" : ""
                            }`}
                          >
                            {achievement.rarity}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{achievement.description}</p>
                        {achievement.earned && (
                          <Badge variant="default" className="mt-2">
                            Earned
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Quick Actions */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
              <CardDescription>Jump into activities to complete missions faster</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start bg-transparent" asChild>
                <Link href="/community">
                  <Users className="mr-2 h-4 w-4" />
                  Browse Community
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start bg-transparent" asChild>
                <Link href="/radio">
                  <Music className="mr-2 h-4 w-4" />
                  Listen to Music
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start bg-transparent" asChild>
                <Link href="/chat">
                  <Target className="mr-2 h-4 w-4" />
                  Join Chat Rooms
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
