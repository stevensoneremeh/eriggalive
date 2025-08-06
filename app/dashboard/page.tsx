'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'
import { User, Coins, Trophy, Calendar, ShoppingBag, Eye, MessageSquare, Heart, Upload, Settings, BarChart3, Users, Star } from 'lucide-react'

interface UserProfile {
  id: number
  auth_user_id: string
  username: string
  full_name: string
  email: string
  bio: string
  avatar_url: string
  tier: string
  coins: number
  level: number
  points: number
  reputation_score: number
  posts_count: number
  followers_count: number
  following_count: number
  created_at: string
}

interface UserStats {
  tickets: number
  purchases: number
  vaultViews: number
  communityPosts: number
  communityVotes: number
}

export default function Dashboard() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState<UserStats>({
    tickets: 0,
    purchases: 0,
    vaultViews: 0,
    communityPosts: 0,
    communityVotes: 0
  })
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    bio: ''
  })

  const supabase = createClient()

  // Fetch user profile - using exact Supabase AI suggestion
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

  // Fetch user statistics
  async function fetchUserStats(userId: string) {
    try {
      // Fetch tickets
      const { data: tickets } = await supabase
        .from('tickets')
        .select('id')
        .eq('user_id', userId)

      // Fetch store purchases
      const { data: purchases } = await supabase
        .from('store_purchases')
        .select('id')
        .eq('user_id', userId)

      // Fetch vault views
      const { data: vaultViews } = await supabase
        .from('vault_views')
        .select('id')
        .eq('user_id', userId)

      // Fetch community posts
      const { data: communityPosts } = await supabase
        .from('community_posts')
        .select('id')
        .eq('user_id', profile?.id)

      // Fetch community votes
      const { data: communityVotes } = await supabase
        .from('community_post_votes')
        .select('post_id')
        .eq('user_id', profile?.id)

      return {
        tickets: tickets?.length || 0,
        purchases: purchases?.length || 0,
        vaultViews: vaultViews?.length || 0,
        communityPosts: communityPosts?.length || 0,
        communityVotes: communityVotes?.length || 0
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
      return {
        tickets: 0,
        purchases: 0,
        vaultViews: 0,
        communityPosts: 0,
        communityVotes: 0
      }
    }
  }

  // Get avatar URL from storage
  async function getAvatarUrl(path: string) {
    if (!path) return null
    const { data } = await supabase.storage
      .from('avatars')
      .getPublicUrl(path)
    return data.publicUrl
  }

  // Upload avatar - using exact Supabase AI suggestion
  async function uploadAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      setUploading(true)
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user found')

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.')
      }

      // Upload avatar - exact Supabase AI code
      const avatarFile = event.target.files[0]
      const fileExt = avatarFile.name.split('.').pop()
      const fileName = `${user.id}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatarFile)

      if (uploadError) {
        console.error('Error uploading avatar', uploadError)
        return
      }

      // Update profile with avatar URL
      const { data: updateData, error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: filePath })
        .eq('auth_user_id', user.id)

      if (updateError) {
        throw updateError
      }

      // Refresh profile
      const updatedProfile = await fetchProfile()
      if (updatedProfile) {
        setProfile(updatedProfile)
      }

      toast({
        title: "Success",
        description: "Avatar updated successfully!",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  // Update profile
  async function updateProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user found')

      const { error } = await supabase
        .from('users')
        .update({
          username: formData.username,
          full_name: formData.full_name,
          bio: formData.bio
        })
        .eq('auth_user_id', user.id)

      if (error) throw error

      // Refresh profile
      const updatedProfile = await fetchProfile()
      if (updatedProfile) {
        setProfile(updatedProfile)
      }

      setEditing(false)
      toast({
        title: "Success",
        description: "Profile updated successfully!",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    async function loadData() {
      try {
        const profileData = await fetchProfile()
        if (profileData) {
          setProfile(profileData)
          setFormData({
            username: profileData.username || '',
            full_name: profileData.full_name || '',
            bio: profileData.bio || ''
          })

          // Fetch user stats
          const userStats = await fetchUserStats(profileData.auth_user_id)
          setStats(userStats)
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading dashboard...</div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Unable to load profile</div>
      </div>
    )
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'vip': return 'bg-yellow-500'
      case 'premium': return 'bg-purple-500'
      case 'grassroot': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const getProgressToNextLevel = () => {
    const pointsForNextLevel = profile.level * 1000
    const currentLevelPoints = (profile.level - 1) * 1000
    const progress = ((profile.points - currentLevelPoints) / (pointsForNextLevel - currentLevelPoints)) * 100
    return Math.min(Math.max(progress, 0), 100)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Welcome back, {profile.full_name || profile.username}!</h1>
          <p className="text-blue-200">Your Erigga Live Dashboard</p>
        </div>

        {/* Profile Overview */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage 
                    src={profile.avatar_url ? `${supabase.storage.from('avatars').getPublicUrl(profile.avatar_url).data.publicUrl}` : undefined} 
                    alt={profile.username} 
                  />
                  <AvatarFallback className="text-2xl">
                    {profile.full_name?.charAt(0) || profile.username?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <Label htmlFor="avatar-upload" className="absolute -bottom-2 -right-2 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full cursor-pointer">
                  <Upload className="h-4 w-4" />
                </Label>
                <Input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={uploadAvatar}
                  disabled={uploading}
                  className="hidden"
                />
              </div>
              
              <div className="flex-1 space-y-4">
                <div className="flex flex-wrap items-center gap-4">
                  <Badge className={`${getTierColor(profile.tier)} text-white`}>
                    {profile.tier.toUpperCase()} TIER
                  </Badge>
                  <div className="flex items-center gap-2 text-white">
                    <Coins className="h-4 w-4 text-yellow-400" />
                    <span className="font-semibold">{profile.coins} Coins</span>
                  </div>
                  <div className="flex items-center gap-2 text-white">
                    <Trophy className="h-4 w-4 text-orange-400" />
                    <span className="font-semibold">Level {profile.level}</span>
                  </div>
                  <div className="flex items-center gap-2 text-white">
                    <Star className="h-4 w-4 text-blue-400" />
                    <span className="font-semibold">{profile.reputation_score} Rep</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-blue-200">
                    <span>Progress to Level {profile.level + 1}</span>
                    <span>{profile.points} / {profile.level * 1000} points</span>
                  </div>
                  <Progress value={getProgressToNextLevel()} className="h-2" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-200 text-sm">Tickets</p>
                  <p className="text-2xl font-bold text-white">{stats.tickets}</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-200 text-sm">Purchases</p>
                  <p className="text-2xl font-bold text-white">{stats.purchases}</p>
                </div>
                <ShoppingBag className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-200 text-sm">Vault Views</p>
                  <p className="text-2xl font-bold text-white">{stats.vaultViews}</p>
                </div>
                <Eye className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-200 text-sm">Posts</p>
                  <p className="text-2xl font-bold text-white">{stats.communityPosts}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-orange-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-200 text-sm">Votes</p>
                  <p className="text-2xl font-bold text-white">{stats.communityVotes}</p>
                </div>
                <Heart className="h-8 w-8 text-red-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profile Management */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Profile Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="view" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="view">View Profile</TabsTrigger>
                <TabsTrigger value="edit">Edit Profile</TabsTrigger>
              </TabsList>
              
              <TabsContent value="view" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-blue-200">Username</Label>
                    <p className="text-white font-medium">{profile.username}</p>
                  </div>
                  <div>
                    <Label className="text-blue-200">Full Name</Label>
                    <p className="text-white font-medium">{profile.full_name}</p>
                  </div>
                  <div>
                    <Label className="text-blue-200">Email</Label>
                    <p className="text-white font-medium">{profile.email}</p>
                  </div>
                  <div>
                    <Label className="text-blue-200">Member Since</Label>
                    <p className="text-white font-medium">
                      {new Date(profile.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {profile.bio && (
                  <div>
                    <Label className="text-blue-200">Bio</Label>
                    <p className="text-white">{profile.bio}</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="edit" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="username" className="text-blue-200">Username</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="full_name" className="text-blue-200">Full Name</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="bio" className="text-blue-200">Bio</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                    className="bg-white/10 border-white/20 text-white"
                    rows={3}
                  />
                </div>
                <Button onClick={updateProfile} className="bg-blue-600 hover:bg-blue-700">
                  Update Profile
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Community Stats */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="h-5 w-5" />
              Community Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{profile.posts_count}</div>
                <div className="text-blue-200">Posts Created</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{profile.followers_count}</div>
                <div className="text-blue-200">Followers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{profile.following_count}</div>
                <div className="text-blue-200">Following</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
