'use client'

import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabaseClient'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { User, Trophy, Coins, MessageSquare, Heart, Eye, Calendar, ShoppingBag, Upload, Settings, TrendingUp } from 'lucide-react'
import { AuthGuard } from '@/components/auth-guard'

interface UserStats {
  tickets: number
  purchases: number
  vaultViews: number
  communityPosts: number
  communityVotes: number
  followers: number
  following: number
  totalSpent: number
}

interface UserProfile {
  id: string
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

export default function DashboardPage() {
  const { user, profile, loading } = useAuth()
  const { toast } = useToast()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [userStats, setUserStats] = useState<UserStats>({
    tickets: 0,
    purchases: 0,
    vaultViews: 0,
    communityPosts: 0,
    communityVotes: 0,
    followers: 0,
    following: 0,
    totalSpent: 0
  })
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    username: '',
    full_name: '',
    bio: ''
  })
  const [uploading, setUploading] = useState(false)

  // Fetch user profile using Supabase AI suggested method
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
  async function fetchUserStats() {
    if (!user) return

    try {
      // Fetch tickets count
      const { count: ticketsCount } = await supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      // Fetch purchases count and total spent
      const { data: purchases } = await supabase
        .from('store_purchases')
        .select('amount')
        .eq('user_id', user.id)

      // Fetch vault views count
      const { count: vaultViewsCount } = await supabase
        .from('vault_views')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      // Fetch community posts count
      const { count: communityPostsCount } = await supabase
        .from('community_posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userProfile?.id)

      // Fetch community votes count
      const { count: communityVotesCount } = await supabase
        .from('community_post_votes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userProfile?.id)

      // Fetch followers count
      const { count: followersCount } = await supabase
        .from('user_follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userProfile?.id)

      // Fetch following count
      const { count: followingCount } = await supabase
        .from('user_follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userProfile?.id)

      const totalSpent = purchases?.reduce((sum, purchase) => sum + (purchase.amount || 0), 0) || 0

      setUserStats({
        tickets: ticketsCount || 0,
        purchases: purchases?.length || 0,
        vaultViews: vaultViewsCount || 0,
        communityPosts: communityPostsCount || 0,
        communityVotes: communityVotesCount || 0,
        followers: followersCount || 0,
        following: followingCount || 0,
        totalSpent
      })
    } catch (error) {
      console.error('Error fetching user stats:', error)
    }
  }

  // Get avatar URL from Supabase storage
  function getAvatarUrl(filePath: string) {
    if (!filePath) return null
    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
    return data.publicUrl
  }

  // Handle avatar upload using Supabase AI suggested method
  async function handleAvatarUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !event.target.files || event.target.files.length === 0) return

    setUploading(true)

    try {
      // Upload avatar
      const avatarFile = event.target.files[0]
      const fileExt = avatarFile.name.split('.').pop()
      const fileName = `${user.id}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatarFile)

      if (uploadError) {
        console.error('Error uploading avatar', uploadError)
        toast({
          title: "Upload Failed",
          description: "Failed to upload avatar. Please try again.",
          variant: "destructive"
        })
        return
      }

      // Update profile with avatar URL
      const { data: updateData, error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: filePath })
        .eq('auth_user_id', user.id)

      if (updateError) {
        console.error('Error updating profile:', updateError)
        toast({
          title: "Update Failed",
          description: "Failed to update profile. Please try again.",
          variant: "destructive"
        })
        return
      }

      // Refresh profile data
      const updatedProfile = await fetchProfile()
      setUserProfile(updatedProfile)

      toast({
        title: "Avatar Updated",
        description: "Your avatar has been updated successfully!"
      })
    } catch (error) {
      console.error('Error in avatar upload:', error)
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive"
      })
    } finally {
      setUploading(false)
    }
  }

  // Handle profile update
  async function handleProfileUpdate() {
    if (!user) return

    try {
      const { error } = await supabase
        .from('users')
        .update({
          username: editForm.username,
          full_name: editForm.full_name,
          bio: editForm.bio
        })
        .eq('auth_user_id', user.id)

      if (error) {
        console.error('Error updating profile:', error)
        toast({
          title: "Update Failed",
          description: "Failed to update profile. Please try again.",
          variant: "destructive"
        })
        return
      }

      // Refresh profile data
      const updatedProfile = await fetchProfile()
      setUserProfile(updatedProfile)
      setIsEditing(false)

      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully!"
      })
    } catch (error) {
      console.error('Error updating profile:', error)
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive"
      })
    }
  }

  useEffect(() => {
    if (user) {
      fetchProfile().then(profileData => {
        if (profileData) {
          setUserProfile(profileData)
          setEditForm({
            username: profileData.username || '',
            full_name: profileData.full_name || '',
            bio: profileData.bio || ''
          })
        }
      })
    }
  }, [user])

  useEffect(() => {
    if (userProfile) {
      fetchUserStats()
    }
  }, [userProfile, user])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <AuthGuard>
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {userProfile?.username || 'Fan'}!</p>
          </div>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {userProfile?.tier || 'Grassroot'} Member
          </Badge>
        </div>

        {/* Profile Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-start gap-6">
              <div className="flex flex-col items-center space-y-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage 
                    src={userProfile?.avatar_url ? getAvatarUrl(userProfile.avatar_url) : undefined} 
                    alt={userProfile?.username || 'User'} 
                  />
                  <AvatarFallback className="text-lg">
                    {userProfile?.username?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-center space-y-2">
                  <Label htmlFor="avatar-upload" className="cursor-pointer">
                    <Button variant="outline" size="sm" disabled={uploading}>
                      <Upload className="h-4 w-4 mr-2" />
                      {uploading ? 'Uploading...' : 'Change Avatar'}
                    </Button>
                  </Label>
                  <Input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </div>
              </div>

              <div className="flex-1 space-y-4">
                {!isEditing ? (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium">Username</Label>
                      <p className="text-lg">{userProfile?.username || 'Not set'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Full Name</Label>
                      <p className="text-lg">{userProfile?.full_name || 'Not set'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Email</Label>
                      <p className="text-lg">{user?.email}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Bio</Label>
                      <p className="text-sm text-muted-foreground">
                        {userProfile?.bio || 'No bio added yet'}
                      </p>
                    </div>
                    <Button onClick={() => setIsEditing(true)} variant="outline">
                      <Settings className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={editForm.username}
                        onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="full_name">Full Name</Label>
                      <Input
                        id="full_name"
                        value={editForm.full_name}
                        onChange={(e) => setEditForm(prev => ({ ...prev, full_name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        value={editForm.bio}
                        onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                        placeholder="Tell us about yourself..."
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleProfileUpdate}>Save Changes</Button>
                      <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Erigga Coins</CardTitle>
              <Coins className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userProfile?.coins || 0}</div>
              <p className="text-xs text-muted-foreground">
                Level {userProfile?.level || 1} • {userProfile?.points || 0} points
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Community Activity</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userStats.communityPosts}</div>
              <p className="text-xs text-muted-foreground">
                {userStats.communityVotes} votes given
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Followers</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userStats.followers}</div>
              <p className="text-xs text-muted-foreground">
                Following {userStats.following}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reputation</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userProfile?.reputation_score || 0}</div>
              <p className="text-xs text-muted-foreground">
                Community reputation
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Activity Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Platform Activity
              </CardTitle>
              <CardDescription>Your engagement across the platform</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Event Tickets</span>
                <Badge variant="outline">{userStats.tickets}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Store Purchases</span>
                <Badge variant="outline">{userStats.purchases}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Vault Content Viewed</span>
                <Badge variant="outline">{userStats.vaultViews}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Spent</span>
                <Badge variant="outline">₦{userStats.totalSpent.toLocaleString()}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Progress & Achievements
              </CardTitle>
              <CardDescription>Your journey as an Erigga fan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Fan Level Progress</span>
                  <span className="text-sm text-muted-foreground">
                    {userProfile?.points || 0} / {((userProfile?.level || 1) * 1000)} XP
                  </span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300" 
                    style={{ 
                      width: `${Math.min(((userProfile?.points || 0) / ((userProfile?.level || 1) * 1000)) * 100, 100)}%` 
                    }}
                  ></div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Member Since</span>
                  <span className="text-sm text-muted-foreground">
                    {userProfile?.created_at ? new Date(userProfile.created_at).toLocaleDateString() : 'Recently'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Current Tier</span>
                  <Badge className="capitalize">{userProfile?.tier || 'grassroot'}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGuard>
  )
}
