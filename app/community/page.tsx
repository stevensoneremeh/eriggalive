import { createClient } from "@/lib/supabase/server"
import { RealtimeCommunityFeed } from "@/components/community/realtime-community-feed"
import { RealtimeCreatePostForm } from "@/components/community/realtime-create-post-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, MessageSquare, TrendingUp, Hash } from "lucide-react"

export default async function CommunityPage() {
  const supabase = await createClient()

  // Get initial posts
  const { data: posts } = await supabase
    .from("community_posts")
    .select(`
      id,
      content,
      media_url,
      media_type,
      hashtags,
      vote_count,
      comment_count,
      view_count,
      is_pinned,
      created_at,
      updated_at,
      user:users!community_posts_user_id_fkey (
        id,
        username,
        full_name,
        avatar_url,
        tier
      ),
      category:community_categories!community_posts_category_id_fkey (
        id,
        name,
        slug,
        icon,
        color
      )
    `)
    .eq("is_published", true)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false })
    .limit(20)

  // Get categories for sidebar
  const { data: categories } = await supabase
    .from("community_categories")
    .select("*")
    .eq("is_active", true)
    .order("display_order")

  // Get community stats
  const { count: totalPosts } = await supabase
    .from("community_posts")
    .select("*", { count: "exact", head: true })
    .eq("is_published", true)
    .eq("is_deleted", false)

  const { count: totalUsers } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true)

  const postsWithStatus = (posts || []).map((post) => ({
    ...post,
    is_bookmarked: false,
    has_voted: false,
    hashtags: Array.isArray(post.hashtags) ? post.hashtags : [],
  }))

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar - Community Stats */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="shadow-lg border-0 bg-white dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Community Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Posts</span>
                  <Badge variant="secondary">{totalPosts || 0}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Active Members</span>
                  <Badge variant="secondary">{totalUsers || 0}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Categories</span>
                  <Badge variant="secondary">{categories?.length || 0}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Categories */}
            <Card className="shadow-lg border-0 bg-white dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hash className="h-5 w-5" />
                  Categories
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {categories?.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                  >
                    <span className="text-lg">{category.icon}</span>
                    <div className="flex-1">
                      <span className="text-sm font-medium">{category.name}</span>
                      {category.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">{category.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Page Header */}
            <div className="text-center space-y-4">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Community Feed
              </h1>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Connect with fellow fans, share your thoughts, and stay updated with the latest from the Erigga
                community. Real-time updates keep you in the loop!
              </p>
            </div>

            {/* Create Post Form */}
            <RealtimeCreatePostForm />

            {/* Community Feed */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <MessageSquare className="h-6 w-6" />
                  Latest Posts
                </h2>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <TrendingUp className="h-4 w-4" />
                  <span>Live updates enabled</span>
                </div>
              </div>

              <RealtimeCommunityFeed initialPosts={postsWithStatus} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
