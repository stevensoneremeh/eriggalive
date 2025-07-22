import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { FreebiesFeed } from "@/components/freebies/freebies-feed"
import { CreateFreebiesPost } from "@/components/freebies/create-freebies-post"
import { Gift, Download, Users, TrendingUp, Star } from "lucide-react"

async function getFreebiesData() {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Get user profile
  const { data: profile } = await supabase.from("users").select("*").eq("auth_user_id", user.id).single()

  if (!profile) {
    redirect("/login")
  }

  // Get freebies posts
  const { data: posts } = await supabase
    .from("freebies_posts")
    .select(`
      *,
      user:users!freebies_posts_user_id_fkey(
        id,
        username,
        full_name,
        avatar_url,
        tier
      )
    `)
    .order("created_at", { ascending: false })
    .limit(20)

  // Get freebies
  const { data: freebies } = await supabase
    .from("freebies")
    .select(`
      *,
      user:users!freebies_user_id_fkey(
        id,
        username,
        full_name,
        avatar_url,
        tier
      )
    `)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(10)

  return {
    posts: posts || [],
    freebies: freebies || [],
    profile,
  }
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-16 w-full mb-4" />
            <div className="flex gap-4">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default async function FreebiesPage() {
  const { posts, freebies, profile } = await getFreebiesData()

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center">
              <Gift className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Freebies Room
            </h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Discover exclusive free content, share your thoughts, and connect with the community
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Create Post Form */}
            <CreateFreebiesPost />

            {/* Posts Feed */}
            <Suspense fallback={<LoadingSkeleton />}>
              <FreebiesFeed initialPosts={posts} />
            </Suspense>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Room Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Community Posts</span>
                  <span className="font-semibold">{posts.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Free Downloads</span>
                  <span className="font-semibold">{freebies.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Active Members</span>
                  <span className="font-semibold">847</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Your Tier</span>
                  <Badge variant="outline" className="text-green-600">
                    {profile.tier.charAt(0).toUpperCase() + profile.tier.slice(1).replace("_", " ")}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Latest Freebies */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5 text-blue-500" />
                  Latest Freebies
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {freebies.slice(0, 5).map((freebie) => (
                  <div
                    key={freebie.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                  >
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center">
                      <Download className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{freebie.title}</h4>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{freebie.type}</span>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          {freebie.vote_count}
                        </div>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <Download className="h-3 w-3" />
                          {freebie.download_count}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {freebies.length === 0 && (
                  <div className="text-center py-8">
                    <Gift className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">No freebies available yet</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Community Guidelines */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-500" />
                  Community Guidelines
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                  <span>Be respectful to all community members</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                  <span>Share constructive feedback and discussions</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 flex-shrink-0" />
                  <span>Vote on posts you find valuable</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                  <span>Report inappropriate content</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
