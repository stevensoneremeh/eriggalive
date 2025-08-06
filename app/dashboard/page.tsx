'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { User, Coins, Trophy, Calendar, ShoppingBag, Eye, MessageSquare, Heart, Users, TrendingUp, Star, Upload } from 'lucide-react'
import { toast } from 'sonner'

const supabase = createClient()

interface UserProfile {
  id: number
  auth_user_id: string
  username: string
  full_name: string
  email: string
  tier: string
  coins: number
  level: number
  points: number
  avatar_url: string | null
  is_verified: boolean
  posts_count?: number
  followers_count?: number
  following_count?: number
  reputation_score?: number
}

interface UserStats {
  totalTickets: number
  totalPurchases: number
  totalVaultViews: number
  communityPosts: number
  communityVotes: number
  recentActivity: any[]
}

async function fetchProfile() {
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', user.id)
      .single()
        
    if (error) {
      console.error('Error fetching profile:', error)
      return null
    }
        
    return data
  }
  return null
}

async function fetchUserStats(userId: string): Promise<UserStats> {
  try {
    // Fetch tickets count
    const { count: ticketsCount } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    // Fetch purchases count
    const { count: purchasesCount } = await supabase
      .from('store_purchases')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    // Fetch vault views count
    const { count: vaultViewsCount } = await supabase
      .from('vault_views')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    // Fetch community posts count
    const { count: postsCount } = await supabase
      .from('community_posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    // Fetch community votes count
    const { count: votesCount } = await supabase
      .from('community_post_votes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    // Fetch recent activity
    const { data: recentActivity } = await supabase
      .from('community_posts')
      .select('id, content, created_at, vote_count, comment_count')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5)

    return {
      totalTickets: ticketsCount || 0,
      totalPurchases: purchasesCount || 0,
      totalVaultViews: vaultViewsCount || 0,
      communityPosts: postsCount || 0,
      communityVotes: votesCount || 0,
      recentActivity: recentActivity || []
    }
  } catch (error) {
    console.error('Error fetching user stats:', error)
    return {
      totalTickets: 0,
      totalPurchases: 0,
      totalVaultViews: 0,
      communityPosts: 0,
      communityVotes: 0,
      recentActivity: []
    }
  }
}

export default function DashboardPage() {
  const { user, profile: authProfile, loading } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadUserData() {
      if (!user) return

      setIsLoading(true)
      try {
        // Fetch profile using the Supabase AI suggested function
        const profileData = await fetchProfile()
        if (profileData) {
          setProfile(profileData)
        }

        // Fetch user stats
        const statsData = await fetchUserStats(user.id)
        setStats(statsData)
      } catch (error) {
        console.error('Error loading user data:', error)
        toast.error('Failed to load dashboard data')
      } finally {
        setIsLoading(false)
      }
    }

    if (!loading) {
      loadUserData()
    }
  }, [user, loading])

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user) return

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('auth_user_id', user.id)

      if (updateError) throw updateError

      setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : null)
      toast.success('Avatar updated successfully!')
    } catch (error) {
      console.error('Error uploading avatar:', error)
      toast.error('Failed to update avatar')
    }
  }

  if (loading || isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!user || !profile) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <p>Please log in to view your dashboard.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getTierColor = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case 'vip': return 'bg-yellow-500'
      case 'premium': return 'bg-purple-500'
      case 'grassroot': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const getNextLevelProgress = () => {
    const currentLevel = profile.level || 1
    const currentPoints = profile.points || 0
    const pointsForNextLevel = currentLevel * 1000
    return Math.min((currentPoints / pointsForNextLevel) * 100, 100)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row gap-6">
        <Card className="flex-1">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback className="text-lg">
                    {profile.full_name?.charAt(0) || profile.username?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <label htmlFor="avatar-upload" className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-1 cursor-pointer hover:bg-primary/90">
                  <Upload className="h-3 w-3" />
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-2xl">{profile.full_name}</CardTitle>
                  {profile.is_verified && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      <Star className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-lg">@{profile.username}</CardDescription>
                <div className="flex items-center gap-4 mt-2">
                  <Badge className={getTierColor(profile.tier)}>
                    {profile.tier?.toUpperCase() || 'GRASSROOT'}
                  </Badge>
                  <span className="text-sm text-muted-foreground">Level {profile.level || 1}</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress to Level {(profile.level || 1) + 1}</span>
                <span>{profile.points || 0} / {(profile.level || 1) * 1000} XP</span>
              </div>
              <Progress value={getNextLevelProgress()} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-yellow-500" />
              Erigga Coins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">
              {profile.coins?.toLocaleString() || 0}
            </div>
            <p className="text-sm text-muted-foreground mt-1">Available Balance</p>
          </CardContent>
        </Card>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Event Tickets</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalTickets || 0}</div>
            <p className="text-xs text-muted-foreground">Total purchased</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Store Purchases</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalPurchases || 0}</div>
            <p className="text-xs text-muted-foreground">Items bought</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vault Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalVaultViews || 0}</div>
            <p className="text-xs text-muted-foreground">Content viewed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Community Posts</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.communityPosts || 0}</div>
            <p className="text-xs text-muted-foreground">Posts created</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats */}
      <Tabs defaultValue="community" className="space-y-4">
        <TabsList>
          <TabsTrigger value="community">Community</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>

        <TabsContent value="community" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Posts</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{profile.posts_count || 0}</div>
                <p className="text-xs text-muted-foreground">Total posts</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Followers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{profile.followers_count || 0}</div>
                <p className="text-xs text-muted-foreground">People following you</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Reputation</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{profile.reputation_score || 0}</div>
                <p className="text-xs text-muted-foreground">Community score</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Posts</CardTitle>
              <CardDescription>Your latest community activity</CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {stats.recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                      <MessageSquare className="h-4 w-4 mt-1 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm">{activity.content.substring(0, 100)}...</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Heart className="h-3 w-3" />
                            {activity.vote_count}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {activity.comment_count}
                          </span>
                          <span>{new Date(activity.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No recent activity</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Achievements</CardTitle>
              <CardDescription>Your milestones and badges</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <Trophy className="h-8 w-8 text-yellow-500" />
                  <div>
                    <h4 className="font-medium">Community Member</h4>
                    <p className="text-sm text-muted-foreground">Joined the community</p>
                  </div>
                </div>
                
                {(profile.posts_count || 0) >= 5 && (
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <MessageSquare className="h-8 w-8 text-blue-500" />
                    <div>
                      <h4 className="font-medium">Active Poster</h4>
                      <p className="text-sm text-muted-foreground">Created 5+ posts</p>
                    </div>
                  </div>
                )}

                {profile.is_verified && (
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <Star className="h-8 w-8 text-purple-500" />
                    <div>
                      <h4 className="font-medium">Verified User</h4>
                      <p className="text-sm text-muted-foreground">Account verified</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
