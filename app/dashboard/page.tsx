"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProfilePictureUpload } from "@/components/profile-picture-upload"
import { User, Coins, MessageSquare, TrendingUp, Settings, Upload, Star, Zap, Crown, Flame } from "lucide-react"
import Link from "next/link"

const subscriptionTiers = [
  { value: "grassroot", label: "Grassroot", icon: Star, color: "text-green-500" },
  { value: "pioneer", label: "Pioneer", icon: Zap, color: "text-blue-500" },
  { value: "elder", label: "Elder", icon: Crown, color: "text-purple-500" },
  { value: "blood", label: "Blood", icon: Flame, color: "text-red-500" },
]

export default function DashboardPage() {
  const { profile, isAuthenticated, isLoading, refreshProfile } = useAuth()
  const router = useRouter()
  const [coinBalance, setCoinBalance] = useState(0)
  const [userStats, setUserStats] = useState({
    posts: 0,
    comments: 0,
    votes: 0,
  })

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login")
      return
    }
  }, [isAuthenticated, isLoading, router])

  useEffect(() => {
    if (profile) {
      setCoinBalance(profile.coins_balance || 0)
      fetchUserStats()
    }
  }, [profile])

  const fetchUserStats = async () => {
    if (!profile) return

    try {
      const response = await fetch(`/api/users/${profile.id}/stats`)
      if (response.ok) {
        const stats = await response.json()
        setUserStats(stats)
      }
    } catch (error) {
      console.error("Failed to fetch user stats:", error)
    }
  }

  const fetchCoinBalance = async () => {
    try {
      const response = await fetch("/api/coins/balance", {
        headers: {
          Authorization: `Bearer mock-token`,
        },
      })
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setCoinBalance(result.balance.currentBalance)
        }
      }
    } catch (error) {
      console.error("Failed to fetch coin balance:", error)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      fetchCoinBalance()
    }
  }, [isAuthenticated])

  const currentTier = subscriptionTiers.find((t) => t.value === profile?.tier) || subscriptionTiers[0]
  const TierIcon = currentTier.icon

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated || !profile) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 pt-20">
      <div className="container mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
              <p className="text-gray-300">Welcome back, {profile.username}!</p>
            </div>
            <Badge className={`${currentTier.color} bg-background/50`}>
              <TierIcon className="h-3 w-3 mr-1" />
              {currentTier.label}
            </Badge>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-background/50 border-muted">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Coin Balance</CardTitle>
              <Coins className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{coinBalance.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Erigga Coins</p>
            </CardContent>
          </Card>

          <Card className="bg-background/50 border-muted">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Posts</CardTitle>
              <MessageSquare className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userStats.posts}</div>
              <p className="text-xs text-muted-foreground">Community posts</p>
            </CardContent>
          </Card>

          <Card className="bg-background/50 border-muted">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Comments</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userStats.comments}</div>
              <p className="text-xs text-muted-foreground">Total comments</p>
            </CardContent>
          </Card>

          <Card className="bg-background/50 border-muted">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Level</CardTitle>
              <Star className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profile.level || 1}</div>
              <p className="text-xs text-muted-foreground">{profile.points || 0} points</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="coins">Coins</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-background/50 border-muted">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>Profile Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={profile.avatar_url || "/placeholder-user.jpg"} />
                      <AvatarFallback className="text-lg">{profile.username?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{profile.full_name || profile.username}</h3>
                      <p className="text-sm text-muted-foreground">@{profile.username}</p>
                      <p className="text-sm text-muted-foreground">{profile.email}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Subscription Tier:</span>
                      <Badge className={`${currentTier.color} bg-background/50`}>
                        <TierIcon className="h-3 w-3 mr-1" />
                        {currentTier.label}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Member since:</span>
                      <span className="text-sm">{new Date(profile.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Status:</span>
                      <Badge variant={profile.is_verified ? "default" : "secondary"}>
                        {profile.is_verified ? "Verified" : "Unverified"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-background/50 border-muted">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Upload className="h-5 w-5" />
                    <span>Profile Picture</span>
                  </CardTitle>
                  <CardDescription>Upload or change your profile picture</CardDescription>
                </CardHeader>
                <CardContent>
                  <ProfilePictureUpload currentImageUrl={profile.avatar_url} onUploadSuccess={refreshProfile} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <Card className="bg-background/50 border-muted">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your latest interactions on the platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <MessageSquare className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">Posted in Community</span>
                    </div>
                    <span className="text-xs text-muted-foreground">2 hours ago</span>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Received upvotes</span>
                    </div>
                    <span className="text-xs text-muted-foreground">5 hours ago</span>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Coins className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm">Earned coins</span>
                    </div>
                    <span className="text-xs text-muted-foreground">1 day ago</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="coins" className="space-y-6">
            <Card className="bg-background/50 border-muted">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Coins className="h-5 w-5 text-yellow-500" />
                  <span>Coin Management</span>
                </CardTitle>
                <CardDescription>Manage your Erigga Coins</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-6 border rounded-lg">
                  <div className="text-3xl font-bold text-yellow-500 mb-2">{coinBalance.toLocaleString()}</div>
                  <p className="text-sm text-muted-foreground mb-4">Current Balance</p>
                  <div className="flex gap-4 justify-center">
                    <Button asChild>
                      <Link href="/coins">
                        <Coins className="h-4 w-4 mr-2" />
                        Buy Coins
                      </Link>
                    </Button>
                    <Button variant="outline" asChild>
                      <Link href="/coins">View Transactions</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card className="bg-background/50 border-muted">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>Account Settings</span>
                </CardTitle>
                <CardDescription>Manage your account preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button variant="outline" asChild>
                    <Link href="/profile/settings">
                      <User className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/profile/security">
                      <Settings className="h-4 w-4 mr-2" />
                      Security Settings
                    </Link>
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Update your profile information, change your password, and manage your privacy settings.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
