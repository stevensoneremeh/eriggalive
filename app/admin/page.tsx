"use client"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { MeetGreetControls } from "@/components/admin/meetgreet-controls"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Users, 
  CreditCard, 
  TrendingUp, 
  Calendar, 
  Video,
  Music,
  Image,
  AlertTriangle,
  RefreshCw,
  Activity,
  DollarSign,
  UserCheck,
  PlayCircle,
  Download
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AdminStats {
  users: {
    total: number
    new_today: number
    by_tier: Record<string, number>
    verified: number
  }
  content: {
    albums: number
    tracks: number
    videos: number
    gallery: number
  }
  financial: {
    total_revenue: number
    transactions_today: number
    pending_withdrawals: number
    avg_transaction: number
  }
  engagement: {
    active_sessions: number
    total_plays: number
    community_posts: number
    comments: number
  }
  events: {
    upcoming: number
    tickets_sold: number
    revenue: number
  }
  meetgreet: {
    active_sessions: number
    completed_today: number
    pending_payments: number
  }
}

export default function AdminOverview() {
  const supabase = createClient()
  const { toast } = useToast()
  const [stats, setStats] = useState<AdminStats>({
    users: { total: 0, new_today: 0, by_tier: {}, verified: 0 },
    content: { albums: 0, tracks: 0, videos: 0, gallery: 0 },
    financial: { total_revenue: 0, transactions_today: 0, pending_withdrawals: 0, avg_transaction: 0 },
    engagement: { active_sessions: 0, total_plays: 0, community_posts: 0, comments: 0 },
    events: { upcoming: 0, tickets_sold: 0, revenue: 0 },
    meetgreet: { active_sessions: 0, completed_today: 0, pending_payments: 0 }
  })
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [userPermissions, setUserPermissions] = useState<{
    isSuperAdmin: boolean;
    isAdmin: boolean;
    canAccessMeetGreet: boolean;
  }>({ isSuperAdmin: false, isAdmin: false, canAccessMeetGreet: false })

  useEffect(() => {
    checkPermissions()
    loadComprehensiveStats()

    // Auto-refresh every 5 minutes
    const interval = setInterval(loadComprehensiveStats, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const checkPermissions = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        toast({
          title: "Access Denied",
          description: "You need to be logged in to access admin panel",
          variant: "destructive"
        })
        return
      }

      const { data: userProfile, error } = await supabase
        .from('users')
        .select('role, is_super_admin, email')
        .eq('auth_user_id', user.id)
        .single()

      if (error) {
        console.error('Error checking permissions:', error)
        toast({
          title: "Error",
          description: "Failed to verify admin permissions",
          variant: "destructive"
        })
        return
      }

      const isSuperAdmin = userProfile?.role === 'super_admin' || userProfile?.is_super_admin === true
      const isAdmin = userProfile?.role === 'admin' || isSuperAdmin

      setUserPermissions({
        isSuperAdmin,
        isAdmin,
        canAccessMeetGreet: isSuperAdmin || userProfile?.email === 'info@eriggalive.com'
      })

      if (!isAdmin) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to access the admin panel",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Permission check error:', error)
      toast({
        title: "Error",
        description: "Failed to verify permissions",
        variant: "destructive"
      })
    }
  }


  const loadComprehensiveStats = async () => {
    try {
      setLoading(true)

      // User statistics
      const { data: users } = await supabase
        .from("users")
        .select("tier, created_at, is_verified, last_login")

      const today = new Date().toDateString()
      const userStats = {
        total: users?.length || 0,
        new_today: users?.filter(u => new Date(u.created_at).toDateString() === today).length || 0,
        by_tier: users?.reduce((acc: Record<string, number>, user) => {
          acc[user.tier] = (acc[user.tier] || 0) + 1
          return acc
        }, {}) || {},
        verified: users?.filter(u => u.is_verified).length || 0
      }

      // Content statistics  
      const [albumsRes, tracksRes, videosRes, galleryRes] = await Promise.all([
        supabase.from("albums").select("id", { count: "exact", head: true }),
        supabase.from("tracks").select("id", { count: "exact", head: true }),
        supabase.from("music_videos").select("id", { count: "exact", head: true }),
        supabase.from("gallery_items").select("id", { count: "exact", head: true })
      ])

      // Community engagement
      const [postsRes, commentsRes] = await Promise.all([
        supabase.from("community_posts").select("id", { count: "exact", head: true }),
        supabase.from("community_comments").select("id", { count: "exact", head: true })
      ])

      // Financial data
      const { data: transactions } = await supabase
        .from("transactions")
        .select("amount, created_at, status")
        .eq("status", "success")

      const totalRevenue = transactions?.reduce((sum, tx) => sum + (tx.amount || 0), 0) || 0
      const transactionsToday = transactions?.filter(tx => 
        new Date(tx.created_at).toDateString() === today
      ).length || 0

      // Withdrawals
      const { count: pendingWithdrawals } = await supabase
        .from("withdrawals")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending")

      // Events
      const { data: events } = await supabase
        .from("events")
        .select("id, status, created_at")

      const upcomingEvents = events?.filter(e => e.status === "upcoming").length || 0

      // Meet & Greet sessions
      const { data: meetgreetSessions } = await supabase
        .from("meetgreet_payments")
        .select("session_status, created_at")
        .eq("payment_status", "completed")

      const activeMeetGreet = meetgreetSessions?.filter(s => s.session_status === "active").length || 0
      const completedToday = meetgreetSessions?.filter(s => 
        s.session_status === "completed" && 
        new Date(s.created_at).toDateString() === today
      ).length || 0

      setStats({
        users: userStats,
        content: {
          albums: albumsRes.count || 0,
          tracks: tracksRes.count || 0,
          videos: videosRes.count || 0,
          gallery: galleryRes.count || 0
        },
        financial: {
          total_revenue: totalRevenue,
          transactions_today: transactionsToday,
          pending_withdrawals: pendingWithdrawals || 0,
          avg_transaction: transactions?.length ? totalRevenue / transactions.length : 0
        },
        engagement: {
          active_sessions: 0, // Would need session tracking
          total_plays: 0, // Would sum from tracks
          community_posts: postsRes.count || 0,
          comments: commentsRes.count || 0
        },
        events: {
          upcoming: upcomingEvents,
          tickets_sold: 0, // Would need ticket data
          revenue: 0 // Would calculate from ticket sales
        },
        meetgreet: {
          active_sessions: activeMeetGreet,
          completed_today: completedToday,
          pending_payments: 0 // Would need payment data
        }
      })

      setLastUpdated(new Date())

    } catch (error) {
      console.error('Error loading admin stats:', error)
      toast({
        title: "Error",
        description: "Failed to load admin statistics",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!userPermissions.isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    )
  }

  const getTierColor = (tier: string) => {
    const colors: Record<string, string> = {
      grassroot: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      pioneer: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200", 
      elder: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      blood: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      admin: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
    }
    return colors[tier] || "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Admin Dashboard
              {userPermissions.isSuperAdmin && (
                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-lg">
                  SUPERADMIN
                </span>
              )}
            </h1>
            <p className="text-gray-600 mt-1">
              Manage your platform
              {userPermissions.isSuperAdmin && (
                <span className="block text-sm text-blue-600 font-medium">
                  Full system access - All Meet & Greet sessions managed by info@eriggalive.com
                </span>
              )}
            </p>
          </div>
        <Button onClick={loadComprehensiveStats} disabled={loading} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          {userPermissions.canAccessMeetGreet && <TabsTrigger value="meetgreet">Meet & Greet</TabsTrigger>}
          <TabsTrigger value="content">Content</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.users.total}</div>
                <p className="text-xs text-muted-foreground">
                  +{stats.users.new_today} today
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₦{(stats.financial.total_revenue / 100).toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.financial.transactions_today} transactions today
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Content</CardTitle>
                <Music className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.content.tracks + stats.content.albums + stats.content.videos}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total media items
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Meet & Greet</CardTitle>
                <Video className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.meetgreet.active_sessions}</div>
                <p className="text-xs text-muted-foreground">
                  Active sessions
                </p>
              </CardContent>
            </Card>
          </div>

          {/* User Tiers Overview */}
          <Card>
            <CardHeader>
              <CardTitle>User Distribution by Tier</CardTitle>
              <CardDescription>
                Current user base across all membership tiers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {Object.entries(stats.users.by_tier).map(([tier, count]) => (
                  <Badge key={tier} className={getTierColor(tier)}>
                    {tier.charAt(0).toUpperCase() + tier.slice(1)}: {count}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common administrative tasks
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" className="h-20 flex-col">
                <Users className="h-6 w-6 mb-2" />
                Manage Users
              </Button>
              <Button variant="outline" className="h-20 flex-col">
                <CreditCard className="h-6 w-6 mb-2" />
                View Transactions
              </Button>
              <Button variant="outline" className="h-20 flex-col">
                <Calendar className="h-6 w-6 mb-2" />
                Manage Events
              </Button>
              <Button variant="outline" className="h-20 flex-col">
                <Activity className="h-6 w-6 mb-2" />
                System Health
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Content Analytics */}
            <Card>
              <CardHeader>
                <CardTitle>Content Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Music className="h-4 w-4" />
                    <span>Tracks</span>
                  </div>
                  <span className="font-semibold">{stats.content.tracks}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <PlayCircle className="h-4 w-4" />
                    <span>Albums</span>
                  </div>
                  <span className="font-semibold">{stats.content.albums}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Video className="h-4 w-4" />
                    <span>Videos</span>
                  </div>
                  <span className="font-semibold">{stats.content.videos}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Image className="h-4 w-4" />
                    <span>Gallery Items</span>
                  </div>
                  <span className="font-semibold">{stats.content.gallery}</span>
                </div>
              </CardContent>
            </Card>

            {/* Engagement Analytics */}
            <Card>
              <CardHeader>
                <CardTitle>Community Engagement</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Community Posts</span>
                  <span className="font-semibold">{stats.engagement.community_posts}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Total Comments</span>
                  <span className="font-semibold">{stats.engagement.comments}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Verified Users</span>
                  <span className="font-semibold">{stats.users.verified}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Pending Withdrawals</span>
                  <Badge variant={stats.financial.pending_withdrawals > 0 ? "destructive" : "secondary"}>
                    {stats.financial.pending_withdrawals}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {userPermissions.canAccessMeetGreet && (
          <TabsContent value="meetgreet">
            <MeetGreetControls />
          </TabsContent>
        )}

        <TabsContent value="content" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Music Content</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold">{stats.content.albums}</div>
                  <p className="text-sm text-muted-foreground">Albums</p>
                  <div className="text-2xl font-bold">{stats.content.tracks}</div>
                  <p className="text-sm text-muted-foreground">Tracks</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Video Content</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.content.videos}</div>
                <p className="text-sm text-muted-foreground">Music Videos</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Gallery</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.content.gallery}</div>
                <p className="text-sm text-muted-foreground">Gallery Items</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}