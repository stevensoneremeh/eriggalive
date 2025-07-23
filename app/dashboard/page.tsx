"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, Coins, MessageSquare, Music, TrendingUp, Calendar, Crown, Zap, Star, Flame } from "lucide-react"
import { ProfilePictureUpload } from "@/components/profile-picture-upload"
import { CoinPurchaseEnhanced } from "@/components/coin-purchase-enhanced"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"
import Link from "next/link"

interface DashboardStats {
  totalPosts: number
  totalVotes: number
  totalComments: number
  coinsEarned: number
  coinsSpent: number
  joinedDate: string
}

const getTierIcon = (tier: string) => {
  switch (tier?.toLowerCase()) {
    case "blood":
    case "blood_brotherhood":
      return Flame
    case "elder":
      return Crown
    case "pioneer":
      return Zap
    case "grassroot":
      return Star
    default:
      return User
  }
}

const getTierColor = (tier: string) => {
  switch (tier?.toLowerCase()) {
    case "blood":
    case "blood_brotherhood":
      return "bg-red-500"
    case "elder":
      return "bg-purple-500"
    case "pioneer":
      return "bg-blue-500"
    case "grassroot":
      return "bg-green-500"
    default:
      return "bg-gray-500"
  }
}

const getTierDisplayName = (tier: string) => {
  switch (tier?.toLowerCase()) {
    case "blood":
    case "blood_brotherhood":
      return "Blood Brotherhood"
    case "elder":
      return "Elder"
    case "pioneer":
      return "Pioneer"
    case "grassroot":
      return "Grassroot"
    default:
      return "Fan"
  }
}

export default function DashboardPage() {
  const { user, profile, loading, refreshProfile } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [coinsLoading, setCoinsLoading] = useState(false)
  const [currentBalance, setCurrentBalance] = useState(0)

  useEffect(() => {
    if (profile) {
      setCurrentBalance(profile.coins_balance || 0)
      fetchUserStats()
    }
  }, [profile])

  const fetchUserStats = async () => {
    try {
      const response = await fetch("/api/user/stats")
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error("Failed to fetch user stats:", error)
      // Set default stats if API fails
      setStats({
        totalPosts: 0,
        totalVotes: 0,
        totalComments: 0,
        coinsEarned: 0,
        coinsSpent: 0,
        joinedDate: profile?.created_at || new Date().toISOString(),
      })
    }
  }

  const fetchCoinBalance = async () => {
    setCoinsLoading(true)
    try {
      const response = await fetch("/api/coins/balance")
      if (response.ok) {
        const data = await response.json()
        setCurrentBalance(data.balance)
        // Also refresh the profile to get updated balance
        await refreshProfile()
      } else {
        console.error("Failed to fetch coin balance")
      }
    } catch (error) {
      console.error("Error fetching coin balance:", error)
    } finally {
      setCoinsLoading(false)
    }
  }

  const handleCoinPurchaseSuccess = async (amount: number) => {
    // Update local balance immediately for better UX
    setCurrentBalance((prev) => prev + amount)
    toast.success(`Successfully purchased ${amount} coins!`)

    // Fetch the actual balance from server to ensure accuracy
    await fetchCoinBalance()
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!user || !profile) {
    return (
      <div className="container mx-auto px-4 py-8 pt-24">
        <Card>
          <CardContent className="text-center py-12">
            <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Please sign in</h3>
            <p className="text-muted-foreground mb-4">You need to be signed in to view your dashboard</p>
            <Button asChild>
              <Link href="/login">Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const TierIcon = getTierIcon(profile.tier || "grassroot")

  return (
    <div className="container mx-auto px-4 py-8 pt-24 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {profile.display_name || profile.username}!</p>
      </div>

      {/* Profile Overview */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Profile Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-6">
            {/* Profile Picture */}
            <div className="flex flex-col items-center space-y-3">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile.avatar_url || "/placeholder-user.jpg"} />
                <AvatarFallback className="text-2xl">
                  {profile.username?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <ProfilePictureUpload onUploadSuccess={refreshProfile} />
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-lg font-semibold">{profile.display_name || profile.username}</h3>
                  <p className="text-muted-foreground">@{profile.username}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge className={`${getTierColor(profile.tier || "grassroot")} text-white`}>
                      <TierIcon className="h-3 w-3 mr-1" />
                      {getTierDisplayName(profile.tier || "grassroot")}
                    </Badge>
                  </div>
                </div>
                <div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Coins Balance:</span>
                      <div className="flex items-center space-x-2">
                        {coinsLoading ? (
                          <div className="h-4 w-12 bg-muted animate-pulse rounded" />
                        ) : (
                          <Badge variant="outline" className="font-mono">
                            <Coins className="h-3 w-3 mr-1" />
                            {currentBalance.toLocaleString()}
                          </Badge>
                        )}
                        <Button size="sm" variant="outline" onClick={fetchCoinBalance} disabled={coinsLoading}>
                          Refresh
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Member Since:</span>
                      <span className="text-sm">
                        {stats?.joinedDate
                          ? formatDistanceToNow(new Date(stats.joinedDate), { addSuffix: true })
                          : "Recently"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Location:</span>
                      <span className="text-sm">{profile.location || "Not specified"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="stats" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="stats">Activity Stats</TabsTrigger>
          <TabsTrigger value="coins">Coins & Purchases</TabsTrigger>
          <TabsTrigger value="settings">Account Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="stats">
          {/* Activity Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Posts Created</CardTitle>
                <MessageSquare className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalPosts || 0}</div>
                <p className="text-xs text-muted-foreground">Community posts</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Votes Given</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalVotes || 0}</div>
                <p className="text-xs text-muted-foreground">Community engagement</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Comments</CardTitle>
                <MessageSquare className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalComments || 0}</div>
                <p className="text-xs text-muted-foreground">Conversations</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Coins Earned</CardTitle>
                <Coins className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.coinsEarned || 0}</div>
                <p className="text-xs text-muted-foreground">From activities</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Recent Activity</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-3 text-sm">
                  <div className="h-2 w-2 bg-blue-500 rounded-full" />
                  <span className="text-muted-foreground">Today</span>
                  <span>Joined the community</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <div className="h-2 w-2 bg-green-500 rounded-full" />
                  <span className="text-muted-foreground">Yesterday</span>
                  <span>Profile setup completed</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="coins">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Current Balance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Coins className="h-5 w-5" />
                  <span>Current Balance</span>
                </CardTitle>
                <CardDescription>Your available coins for voting and interactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold mb-4">
                  {coinsLoading ? (
                    <div className="h-12 w-32 bg-muted animate-pulse rounded" />
                  ) : (
                    currentBalance.toLocaleString()
                  )}{" "}
                  <span className="text-lg text-muted-foreground">coins</span>
                </div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Earned from activities:</span>
                    <span>{stats?.coinsEarned || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Spent on votes:</span>
                    <span>{stats?.coinsSpent || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Purchase Coins */}
            <Card>
              <CardHeader>
                <CardTitle>Purchase Coins</CardTitle>
                <CardDescription>Buy more coins to increase your voting power</CardDescription>
              </CardHeader>
              <CardContent>
                <CoinPurchaseEnhanced onPurchaseSuccess={handleCoinPurchaseSuccess} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>Your basic account details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Username</label>
                  <p className="text-sm text-muted-foreground">@{profile.username}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Display Name</label>
                  <p className="text-sm text-muted-foreground">{profile.display_name || "Not set"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Subscription Tier</label>
                  <div className="mt-1">
                    <Badge className={`${getTierColor(profile.tier || "grassroot")} text-white`}>
                      <TierIcon className="h-3 w-3 mr-1" />
                      {getTierDisplayName(profile.tier || "grassroot")}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common account actions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button asChild className="w-full justify-start">
                  <Link href="/community">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Go to Community
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start bg-transparent">
                  <Link href="/vault">
                    <Music className="h-4 w-4 mr-2" />
                    Browse Content
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start bg-transparent">
                  <Link href="/premium">
                    <Crown className="h-4 w-4 mr-2" />
                    Upgrade Tier
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
