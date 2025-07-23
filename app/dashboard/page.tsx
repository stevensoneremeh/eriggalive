import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, MessageCircle, TrendingUp, Coins } from "lucide-react"

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Fetch user profile
  const { data: profile } = await supabase.from("users").select("*").eq("id", user.id).single()

  // Fetch some stats
  const { count: postsCount } = await supabase
    .from("community_posts")
    .select("*", { count: "exact", head: true })
    .eq("is_deleted", false)

  const { count: usersCount } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true)

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "blood":
        return "bg-red-500"
      case "elder":
        return "bg-purple-500"
      case "pioneer":
        return "bg-blue-500"
      default:
        return "bg-green-500"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {profile?.username}!</h1>
          <div className="mt-2 flex items-center space-x-2">
            <Badge className={getTierColor(profile?.tier || "grassroot")}>{profile?.tier || "grassroot"}</Badge>
            <span className="text-gray-600">•</span>
            <div className="flex items-center space-x-1">
              <Coins className="h-4 w-4 text-yellow-500" />
              <span className="text-sm text-gray-600">{profile?.coins || 0} coins</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{usersCount || 0}</div>
              <p className="text-xs text-muted-foreground">Active community members</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Community Posts</CardTitle>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{postsCount || 0}</div>
              <p className="text-xs text-muted-foreground">Total discussions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Your Tier</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">{profile?.tier || "grassroot"}</div>
              <p className="text-xs text-muted-foreground">Current membership level</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Your Coins</CardTitle>
              <Coins className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profile?.coins || 0}</div>
              <p className="text-xs text-muted-foreground">Available balance</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Jump into the community or start chatting</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <a
                  href="/community"
                  className="flex items-center justify-center p-4 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                >
                  <div className="text-center">
                    <Users className="h-6 w-6 text-indigo-600 mx-auto mb-2" />
                    <span className="text-sm font-medium text-indigo-900">Community</span>
                  </div>
                </a>
                <a
                  href="/chat"
                  className="flex items-center justify-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <div className="text-center">
                    <MessageCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
                    <span className="text-sm font-medium text-green-900">Chat</span>
                  </div>
                </a>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tier Benefits</CardTitle>
              <CardDescription>Your current tier unlocks these features</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-sm">General chat access</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-sm">Community posts</span>
                </div>
                {(profile?.tier === "pioneer" || profile?.tier === "elder" || profile?.tier === "blood") && (
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <span className="text-sm">Pioneer Lounge access</span>
                  </div>
                )}
                {(profile?.tier === "elder" || profile?.tier === "blood") && (
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full" />
                    <span className="text-sm">Elder Council access</span>
                  </div>
                )}
                {profile?.tier === "blood" && (
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full" />
                    <span className="text-sm">Blood Brotherhood access</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
