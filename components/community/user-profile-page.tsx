"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserTierBadge } from "@/components/user-tier-badge"
import { CompletePostCard } from "./complete-post-card"
import { FollowButton } from "./follow-button"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/components/ui/use-toast"
import {
  Calendar,
  MapPin,
  LinkIcon,
  Users,
  MessageSquare,
  Heart,
  Trophy,
  Coins,
  Star,
  Award,
  TrendingUp,
  Activity,
  Send,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface UserProfileProps {
  username: string
}

export function UserProfilePage({ username }: UserProfileProps) {
  const { user: currentUser, profile: currentProfile } = useAuth()
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [posts, setPosts] = useState<any[]>([])
  const [achievements, setAchievements] = useState<any[]>([])
  const [stats, setStats] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("posts")
  const [isFollowing, setIsFollowing] = useState(false)

  useEffect(() => {
    loadUserProfile()
  }, [username])

  const loadUserProfile = async () => {
    try {
      const [profileRes, postsRes, achievementsRes, statsRes] = await Promise.all([
        fetch(`/api/community/users/${username}`),
        fetch(`/api/community/users/${username}/posts`),
        fetch(`/api/community/users/${username}/achievements`),
        fetch(`/api/community/users/${username}/stats`),
      ])

      const [profileData, postsData, achievementsData, statsData] = await Promise.all([
        profileRes.json(),
        postsRes.json(),
        achievementsRes.json(),
        statsRes.json(),
      ])

      if (profileData.success) {
        setUser(profileData.user)
        setIsFollowing(profileData.user.is_following || false)
      }
      if (postsData.success) setPosts(postsData.posts)
      if (achievementsData.success) setAchievements(achievementsData.achievements)
      if (statsData.success) setStats(statsData.stats)
    } catch (error) {
      console.error("Failed to load user profile:", error)
      toast({
        title: "Error",
        description: "Failed to load user profile",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!currentUser || !user) return

    try {
      const response = await fetch("/api/community/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient_id: user.id,
          content: `Hi ${user.username}! 👋`,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Message Sent! 💬",
          description: `Your message to @${user.username} has been sent.`,
        })
      }
    } catch (error) {
      toast({
        title: "Message Failed",
        description: "Something went wrong",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="animate-pulse space-y-6">
          <div className="h-48 bg-slate-200 rounded-xl" />
          <div className="h-32 bg-slate-200 rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-64 bg-slate-200 rounded-xl" />
            <div className="h-64 bg-slate-200 rounded-xl" />
            <div className="h-64 bg-slate-200 rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">User Not Found</h1>
        <p className="text-muted-foreground">The user @{username} could not be found.</p>
      </div>
    )
  }

  const isOwnProfile = currentUser?.id === user.auth_user_id

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Profile Header */}
      <Card className="mb-8 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
        <CardContent className="relative p-6">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-6">
            <Avatar className="h-24 w-24 border-4 border-white shadow-lg -mt-12">
              <AvatarImage src={user.avatar_url || "/placeholder-user.jpg"} alt={user.username} />
              <AvatarFallback className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                {user.username?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                <div>
                  <h1 className="text-3xl font-bold">{user.full_name || user.username}</h1>
                  <p className="text-xl text-muted-foreground">@{user.username}</p>
                </div>
                <div className="flex items-center gap-2">
                  <UserTierBadge tier={user.tier} size="lg" />
                  {user.is_verified && (
                    <Badge className="bg-blue-500 text-white">
                      <Star className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>
              </div>

              {user.bio && <p className="text-lg mb-4 leading-relaxed">{user.bio}</p>}

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                {user.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{user.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Joined {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}</span>
                </div>
                {user.website && (
                  <div className="flex items-center gap-1">
                    <LinkIcon className="h-4 w-4" />
                    <a
                      href={user.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline text-primary"
                    >
                      {user.website}
                    </a>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span className="font-medium">{stats.followers_count || 0}</span>
                  <span className="text-muted-foreground">Followers</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span className="font-medium">{stats.following_count || 0}</span>
                  <span className="text-muted-foreground">Following</span>
                </div>
                <div className="flex items-center gap-1">
                  <Coins className="h-4 w-4 text-yellow-500" />
                  <span className="font-medium">{user.coins || 0}</span>
                  <span className="text-muted-foreground">Coins</span>
                </div>
              </div>
            </div>

            {!isOwnProfile && currentUser && (
              <div className="flex gap-2">
                <FollowButton
                  userId={user.id}
                  username={user.username}
                  isFollowing={isFollowing}
                  onFollowChange={setIsFollowing}
                />
                <Button variant="outline" onClick={handleSendMessage}>
                  <Send className="h-4 w-4 mr-2" />
                  Message
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4 text-center">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 text-blue-500" />
            <div className="text-2xl font-bold">{stats.total_posts || 0}</div>
            <div className="text-sm text-muted-foreground">Posts</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Heart className="h-8 w-8 mx-auto mb-2 text-red-500" />
            <div className="text-2xl font-bold">{stats.total_votes_received || 0}</div>
            <div className="text-sm text-muted-foreground">Votes Received</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Trophy className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
            <div className="text-2xl font-bold">{achievements.length}</div>
            <div className="text-sm text-muted-foreground">Achievements</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <div className="text-2xl font-bold">{stats.reputation_score || 0}</div>
            <div className="text-sm text-muted-foreground">Reputation</div>
          </CardContent>
        </Card>
      </div>

      {/* Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="posts">Posts ({stats.total_posts || 0})</TabsTrigger>
          <TabsTrigger value="achievements">Achievements ({achievements.length})</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="space-y-6 mt-6">
          {posts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Posts Yet</h3>
                <p className="text-muted-foreground">
                  {isOwnProfile ? "You haven't posted anything yet." : `@${user.username} hasn't posted anything yet.`}
                </p>
              </CardContent>
            </Card>
          ) : (
            posts.map((post) => (
              <CompletePostCard
                key={post.id}
                post={post}
                onPostUpdate={(updatedPost) => {
                  setPosts((prev) => prev.map((p) => (p.id === updatedPost.id ? updatedPost : p)))
                }}
                onPostDelete={(postId) => {
                  setPosts((prev) => prev.filter((p) => p.id !== postId))
                }}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="achievements" className="mt-6">
          {achievements.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Award className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Achievements Yet</h3>
                <p className="text-muted-foreground">
                  {isOwnProfile
                    ? "Start posting and engaging to earn your first achievement!"
                    : `@${user.username} hasn't earned any achievements yet.`}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {achievements.map((achievement) => (
                <Card key={achievement.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6 text-center">
                    <div className="text-4xl mb-3">{achievement.icon}</div>
                    <h3 className="font-semibold mb-2">{achievement.name}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{achievement.description}</p>
                    <Badge className={`bg-${achievement.badge_color}-500 text-white`}>
                      +{achievement.points} points
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-2">
                      Earned {formatDistanceToNow(new Date(achievement.earned_at), { addSuffix: true })}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Activity timeline would go here */}
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4" />
                  <p>Activity timeline coming soon!</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="about" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                  <p className="text-lg">{user.full_name || "Not provided"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Username</label>
                  <p className="text-lg">@{user.username}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tier</label>
                  <div className="mt-1">
                    <UserTierBadge tier={user.tier} size="md" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Member Since</label>
                  <p className="text-lg">{new Date(user.created_at).toLocaleDateString()}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Community Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Posts</span>
                  <span className="font-medium">{stats.total_posts || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Comments</span>
                  <span className="font-medium">{stats.total_comments || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Votes Received</span>
                  <span className="font-medium">{stats.total_votes_received || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Votes Given</span>
                  <span className="font-medium">{stats.total_votes_given || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reputation Score</span>
                  <span className="font-medium">{stats.reputation_score || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current Streak</span>
                  <span className="font-medium">{stats.streak_days || 0} days</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
