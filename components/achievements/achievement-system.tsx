"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Trophy, Star, Target, Gift, CheckCircle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"

interface Achievement {
  id: number
  name: string
  title: string
  description: string
  icon: string
  category: string
  points: number
  badge_color: string
  requirements: any
  is_completed: boolean
  progress: any
  completed_at?: string
}

const ACHIEVEMENT_CATEGORIES = [
  { id: "all", name: "All", icon: Trophy },
  { id: "engagement", name: "Engagement", icon: Star },
  { id: "social", name: "Social", icon: Target },
  { id: "economy", name: "Economy", icon: Gift },
  { id: "loyalty", name: "Loyalty", icon: CheckCircle },
]

export function AchievementSystem() {
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [loading, setLoading] = useState(true)
  const { profile } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    loadAchievements()
  }, [])

  const loadAchievements = async () => {
    try {
      // Dummy achievements for demo
      const dummyAchievements: Achievement[] = [
        {
          id: 1,
          name: "first_post",
          title: "First Post",
          description: "Created your first community post",
          icon: "🎉",
          category: "engagement",
          points: 50,
          badge_color: "#10B981",
          requirements: { posts_created: 1 },
          is_completed: true,
          progress: { posts_created: 1 },
          completed_at: new Date().toISOString(),
        },
        {
          id: 2,
          name: "social_butterfly",
          title: "Social Butterfly",
          description: "Followed 10 other users",
          icon: "🦋",
          category: "social",
          points: 100,
          badge_color: "#3B82F6",
          requirements: { users_followed: 10 },
          is_completed: false,
          progress: { users_followed: 3 },
        },
        {
          id: 3,
          name: "popular_creator",
          title: "Popular Creator",
          description: "Received 100 votes on your posts",
          icon: "⭐",
          category: "engagement",
          points: 500,
          badge_color: "#F59E0B",
          requirements: { votes_received: 100 },
          is_completed: false,
          progress: { votes_received: 23 },
        },
        {
          id: 4,
          name: "conversation_starter",
          title: "Conversation Starter",
          description: "Created 10 posts",
          icon: "💭",
          category: "engagement",
          points: 200,
          badge_color: "#8B5CF6",
          requirements: { posts_created: 10 },
          is_completed: false,
          progress: { posts_created: 1 },
        },
        {
          id: 5,
          name: "helpful_member",
          title: "Helpful Member",
          description: "Left 50 comments",
          icon: "🤝",
          category: "engagement",
          points: 150,
          badge_color: "#06B6D4",
          requirements: { comments_created: 50 },
          is_completed: false,
          progress: { comments_created: 12 },
        },
        {
          id: 6,
          name: "coin_collector",
          title: "Coin Collector",
          description: "Earned 1000 Erigga Coins",
          icon: "🪙",
          category: "economy",
          points: 300,
          badge_color: "#F59E0B",
          requirements: { coins_earned: 1000 },
          is_completed: false,
          progress: { coins_earned: profile?.coins || 0 },
        },
        {
          id: 7,
          name: "trendsetter",
          title: "Trendsetter",
          description: "Created a trending post",
          icon: "🔥",
          category: "engagement",
          points: 1000,
          badge_color: "#EF4444",
          requirements: { trending_posts: 1 },
          is_completed: false,
          progress: { trending_posts: 0 },
        },
        {
          id: 8,
          name: "community_veteran",
          title: "Community Veteran",
          description: "Active member for 30 days",
          icon: "🏆",
          category: "loyalty",
          points: 750,
          badge_color: "#7C3AED",
          requirements: { days_active: 30 },
          is_completed: false,
          progress: { days_active: 5 },
        },
      ]

      setAchievements(dummyAchievements)
    } catch (error) {
      console.error("Error loading achievements:", error)
    } finally {
      setLoading(false)
    }
  }

  const getProgressPercentage = (achievement: Achievement) => {
    const requirement = Object.keys(achievement.requirements)[0]
    const required = achievement.requirements[requirement]
    const current = achievement.progress[requirement] || 0
    return Math.min((current / required) * 100, 100)
  }

  const filteredAchievements = achievements.filter(
    (achievement) => selectedCategory === "all" || achievement.category === selectedCategory,
  )

  const completedCount = achievements.filter((a) => a.is_completed).length
  const totalPoints = achievements.filter((a) => a.is_completed).reduce((sum, a) => sum + a.points, 0)

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Trophy className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{completedCount}</p>
                <p className="text-sm text-muted-foreground">Achievements Unlocked</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Star className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{totalPoints}</p>
                <p className="text-sm text-muted-foreground">Achievement Points</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Target className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{Math.round((completedCount / achievements.length) * 100)}%</p>
                <p className="text-sm text-muted-foreground">Completion Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {ACHIEVEMENT_CATEGORIES.map((category) => {
          const Icon = category.icon
          return (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              onClick={() => setSelectedCategory(category.id)}
              className="flex items-center gap-2"
            >
              <Icon className="h-4 w-4" />
              {category.name}
            </Button>
          )
        })}
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading
          ? [...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="h-12 w-12 bg-slate-200 dark:bg-slate-700 rounded-full" />
                    <div className="space-y-2">
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full" />
                    </div>
                    <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded w-full" />
                  </div>
                </CardContent>
              </Card>
            ))
          : filteredAchievements.map((achievement) => (
              <Card
                key={achievement.id}
                className={cn(
                  "transition-all duration-200 hover:shadow-lg",
                  achievement.is_completed
                    ? "border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-900/20"
                    : "hover:border-primary/50",
                )}
              >
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div
                        className={cn(
                          "text-3xl p-3 rounded-full",
                          achievement.is_completed
                            ? "bg-green-100 dark:bg-green-900/50"
                            : "bg-slate-100 dark:bg-slate-800",
                        )}
                      >
                        {achievement.is_completed ? "✅" : achievement.icon}
                      </div>
                      <div className="flex items-center gap-2">
                        {achievement.is_completed && <CheckCircle className="h-5 w-5 text-green-500" />}
                        <Badge
                          variant="secondary"
                          style={{ backgroundColor: achievement.badge_color + "20", color: achievement.badge_color }}
                        >
                          {achievement.points} pts
                        </Badge>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-lg">{achievement.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{achievement.description}</p>
                    </div>

                    {!achievement.is_completed && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>
                            {Object.values(achievement.progress)[0] || 0} / {Object.values(achievement.requirements)[0]}
                          </span>
                        </div>
                        <Progress value={getProgressPercentage(achievement)} className="h-2" />
                      </div>
                    )}

                    {achievement.is_completed && achievement.completed_at && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm font-medium text-green-600 dark:text-green-400">
                            Achievement Unlocked!
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Completed {new Date(achievement.completed_at).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>

      {filteredAchievements.length === 0 && !loading && (
        <Card>
          <CardContent className="p-12 text-center">
            <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No achievements found</h3>
            <p className="text-muted-foreground">
              Try selecting a different category or start engaging with the community to unlock achievements!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
