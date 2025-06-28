import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MessageCircle, Share2, TrendingUp, Users } from "lucide-react"
import { CreatePostFormFinal } from "@/components/community/create-post-form-final"
import { VoteButton } from "@/components/community/vote-button"
import { BookmarkButton } from "@/components/community/bookmark-button"

async function getCommunityData() {
  const supabase = await createClient()

  // Get categories
  const { data: categories } = await supabase
    .from("community_categories")
    .select("*")
    .eq("is_active", true)
    .order("display_order")

  // Get posts with user data
  const { data: posts } = await supabase
    .from("community_posts")
    .select(`
      *,
      users!inner (
        id,
        username,
        full_name,
        email,
        avatar_url,
        tier,
        reputation_score
      ),
      community_categories!inner (
        name,
        slug,
        color
      )
    `)
    .eq("is_published", true)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false })
    .limit(20)

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let profile = null
  if (user) {
    const { data: userProfile } = await supabase.from("users").select("*").eq("auth_user_id", user.id).single()
    profile = userProfile
  }

  return {
    categories: categories || [],
    posts: posts || [],
    profile,
    user,
  }
}

function getTierColor(tier: string) {
  const colors = {
    admin: "bg-red-500 text-white",
    blood_brotherhood: "bg-red-600 text-white",
    elder: "bg-purple-500 text-white",
    pioneer: "bg-blue-500 text-white",
    grassroot: "bg-green-500 text-white",
  }
  return colors[tier as keyof typeof colors] || "bg-gray-500 text-white"
}

function formatTimeAgo(date: string) {
  const now = new Date()
  const postDate = new Date(date)
  const diffInSeconds = Math.floor((now.getTime() - postDate.getTime()) / 1000)

  if (diffInSeconds < 60) return "Just now"
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  return `${Math.floor(diffInSeconds / 86400)}d ago`
}

export default async function CommunityPage() {
  const { categories, posts, profile, user } = await getCommunityData()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
              <Users className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Erigga Community
            </h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Connect with fellow fans, share your thoughts, and celebrate the culture together
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Categories */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  Categories
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{category.icon}</span>
                      <div>
                        <div className="font-medium text-sm group-hover:text-blue-600 transition-colors">
                          {category.name}
                        </div>
                        <div className="text-xs text-gray-500">{category.post_count || 0} posts</div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Create Post */}
            {user && <CreatePostFormFinal categories={categories} profile={profile} />}

            {/* Posts Feed */}
            <div className="space-y-6">
              {posts.length === 0 ? (
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                  <CardContent className="text-center py-12">
                    <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
                    <p className="text-gray-500">Be the first to share something with the community!</p>
                  </CardContent>
                </Card>
              ) : (
                posts.map((post) => (
                  <Card
                    key={post.id}
                    className="shadow-lg border-0 bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300"
                  >
                    <CardContent className="p-6">
                      {/* Post Header */}
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                            {post.users.full_name?.[0]?.toUpperCase() || post.users.username?.[0]?.toUpperCase() || "U"}
                          </div>
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <span className="font-semibold text-gray-900">{post.users.full_name}</span>
                              <Badge className={`${getTierColor(post.users.tier)} text-xs font-medium`}>
                                {post.users.tier?.replace("_", " ").toUpperCase()}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <span>@{post.users.username}</span>
                              <span>•</span>
                              <span>{formatTimeAgo(post.created_at)}</span>
                            </div>
                            <Badge
                              variant="outline"
                              className="mt-2"
                              style={{
                                backgroundColor: post.community_categories.color + "15",
                                borderColor: post.community_categories.color,
                                color: post.community_categories.color,
                              }}
                            >
                              {post.community_categories.name}
                            </Badge>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-600">
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Post Content */}
                      <div className="mb-6">
                        <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed text-base">
                          {post.content}
                        </p>
                      </div>

                      {/* Post Actions */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-6">
                          <VoteButton postId={post.id} voteCount={post.vote_count} />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex items-center gap-2 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                          >
                            <MessageCircle className="h-4 w-4" />
                            <span className="font-medium">{post.comment_count}</span>
                          </Button>
                          <BookmarkButton postId={post.id} />
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span>{post.view_count || 0} views</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Community Stats */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5 text-green-600" />
                  Community Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-1">{posts.length}</div>
                  <div className="text-sm text-gray-500">Total Posts</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-1">{categories.length}</div>
                  <div className="text-sm text-gray-500">Categories</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
