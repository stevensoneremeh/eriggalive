import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { RealtimeCommunityFeed } from "@/components/community/realtime-community-feed"
import { RealtimeCreatePostForm } from "@/components/community/realtime-create-post-form"
import { TierChatRooms } from "@/components/community/tier-chat-rooms"
import { Users, MessageCircle, Sparkles, Crown } from "lucide-react"

async function getCommunityData() {
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

  // Get community posts with user and category data
  const { data: posts } = await supabase
    .from("community_posts")
    .select(`
      *,
      user:users!community_posts_user_id_fkey(
        id,
        username,
        full_name,
        avatar_url,
        tier
      ),
      category:community_categories!community_posts_category_id_fkey(
        id,
        name,
        slug,
        color,
        icon
      )
    `)
    .eq("is_published", true)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false })
    .limit(20)

  // Get categories
  const { data: categories } = await supabase
    .from("community_categories")
    .select("*")
    .eq("is_active", true)
    .order("name")

  return {
    posts: posts || [],
    categories: categories || [],
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
              <Skeleton className="h-8 w-20" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default async function CommunityPage() {
  const { posts, categories, profile } = await getCommunityData()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
              <Users className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Community Hub
            </h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Connect with fellow fans, share your thoughts, and join live conversations in our exclusive chat rooms
          </p>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8 bg-white dark:bg-gray-800 shadow-lg rounded-xl p-1">
            <TabsTrigger
              value="posts"
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white rounded-lg py-3"
            >
              <Sparkles className="h-4 w-4" />
              Community Posts
            </TabsTrigger>
            <TabsTrigger
              value="chat"
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white rounded-lg py-3"
            >
              <MessageCircle className="h-4 w-4" />
              Live Chat Rooms
            </TabsTrigger>
          </TabsList>

          {/* Posts Tab */}
          <TabsContent value="posts" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Feed */}
              <div className="lg:col-span-2 space-y-6">
                {/* Create Post Form */}
                <RealtimeCreatePostForm categories={categories} />

                {/* Posts Feed */}
                <Suspense fallback={<LoadingSkeleton />}>
                  <RealtimeCommunityFeed initialPosts={posts} />
                </Suspense>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Community Stats */}
                <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Crown className="h-5 w-5 text-yellow-500" />
                      Community Stats
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400">Total Posts</span>
                        <span className="font-semibold">{posts.length}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400">Active Members</span>
                        <span className="font-semibold">1,247</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400">Your Tier</span>
                        <span className="font-semibold capitalize text-blue-600">{profile.tier.replace("_", " ")}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Categories */}
                {categories.length > 0 && (
                  <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold mb-4">Categories</h3>
                      <div className="space-y-2">
                        {categories.map((category) => (
                          <div
                            key={category.id}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                          >
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                            <span className="text-sm font-medium">{category.name}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Chat Tab */}
          <TabsContent value="chat">
            <TierChatRooms userTier={profile.tier} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
