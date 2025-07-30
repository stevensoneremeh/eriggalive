import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Heart, MessageCircle, Share2, Bookmark, TrendingUp, Users, Trophy, Star } from "lucide-react"
import { createPost, voteOnPost, bookmarkPost } from "@/lib/community-actions-working"

async function getCommunityData() {
  const supabase = await createClient()

  // Get categories
  const { data: categories } = await supabase
    .from("community_categories")
    .select("*")
    .eq("is_active", true)
    .order("display_order")

  // Get posts with user data and category data
  const { data: posts } = await supabase
    .from("community_posts")
    .select(`
      *,
      users!inner (
        id,
        username,
        full_name,
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

  // Get trending hashtags
  const { data: hashtags } = await supabase
    .from("hashtags")
    .select("*")
    .eq("is_trending", true)
    .order("usage_count", { ascending: false })
    .limit(10)

  // Get leaderboard data
  const { data: topUsers } = await supabase
    .from("users")
    .select("id, username, full_name, avatar_url, tier, reputation_score, posts_count, followers_count")
    .order("reputation_score", { ascending: false })
    .limit(10)

  return {
    categories: categories || [],
    posts: posts || [],
    hashtags: hashtags || [],
    topUsers: topUsers || [],
  }
}

function getTierColor(tier: string) {
  const colors = {
    admin: "bg-red-500",
    blood_brotherhood: "bg-red-600",
    elder: "bg-purple-500",
    pioneer: "bg-blue-500",
    grassroot: "bg-green-500",
  }
  return colors[tier as keyof typeof colors] || "bg-gray-500"
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

export default async function CommunityWorkingPage() {
  const { categories, posts, hashtags, topUsers } = await getCommunityData()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Erigga Community
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Connect, share, and celebrate the culture with fellow fans</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Categories */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Categories
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {categories.map((category) => (
                  <Button key={category.id} variant="ghost" className="w-full justify-start">
                    <span className="mr-2">{category.icon || "📂"}</span>
                    {category.name}
                    <Badge variant="secondary" className="ml-auto">
                      {category.post_count || 0}
                    </Badge>
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Trending Hashtags */}
            {hashtags.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Trending
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {hashtags.map((hashtag) => (
                      <Badge
                        key={hashtag.id}
                        variant="outline"
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                      >
                        #{hashtag.name} ({hashtag.usage_count})
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Create Post */}
            <Card>
              <CardHeader>
                <CardTitle>Share Your Thoughts</CardTitle>
              </CardHeader>
              <CardContent>
                <form action={createPost} className="space-y-4">
                  <Textarea
                    name="content"
                    placeholder="What's on your mind? Use #hashtags and @mentions..."
                    className="min-h-[100px]"
                    required
                  />
                  <div className="flex justify-between items-center">
                    <Select name="categoryId" required>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.icon || "📂"} {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button type="submit">Share Post</Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Posts Feed */}
            <div className="space-y-6">
              {posts.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <div className="text-6xl mb-4">🎵</div>
                    <h3 className="text-xl font-semibold mb-2">No posts yet!</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Be the first to share something with the community.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                posts.map((post) => (
                  <Card key={post.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      {/* Post Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                            {post.users?.username?.[0]?.toUpperCase() ||
                              post.users?.full_name?.[0]?.toUpperCase() ||
                              "U"}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{post.users?.full_name || "Unknown User"}</span>
                              <Badge className={`${getTierColor(post.users?.tier || "grassroot")} text-white text-xs`}>
                                {(post.users?.tier || "grassroot").replace("_", " ").toUpperCase()}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <span>@{post.users?.username || "unknown"}</span>
                              <span>•</span>
                              <span>{formatTimeAgo(post.created_at)}</span>
                              <span>•</span>
                              <Badge
                                variant="outline"
                                style={{
                                  backgroundColor: (post.community_categories?.color || "#3B82F6") + "20",
                                  color: post.community_categories?.color || "#3B82F6",
                                }}
                              >
                                {post.community_categories?.name || "General"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Post Content */}
                      <div className="mb-4">
                        <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{post.content}</p>
                        {post.hashtags && post.hashtags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {post.hashtags.map((hashtag: string, index: number) => (
                              <Badge key={index} variant="secondary" className="cursor-pointer">
                                #{hashtag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Post Actions */}
                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="flex items-center gap-4">
                          <form action={voteOnPost.bind(null, post.id)}>
                            <Button
                              variant="ghost"
                              size="sm"
                              type="submit"
                              className="flex items-center gap-2 hover:text-red-500"
                            >
                              <Heart className="h-4 w-4" />
                              <span>{post.vote_count || 0}</span>
                            </Button>
                          </form>
                          <Button variant="ghost" size="sm" className="flex items-center gap-2 hover:text-blue-500">
                            <MessageCircle className="h-4 w-4" />
                            <span>{post.comment_count || 0}</span>
                          </Button>
                          <form action={bookmarkPost.bind(null, post.id)}>
                            <Button variant="ghost" size="sm" type="submit" className="hover:text-yellow-500">
                              <Bookmark className="h-4 w-4" />
                            </Button>
                          </form>
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Community Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{posts.length}</div>
                  <div className="text-sm text-gray-500">Total Posts</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{topUsers.length}</div>
                  <div className="text-sm text-gray-500">Active Members</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{categories.length}</div>
                  <div className="text-sm text-gray-500">Categories</div>
                </div>
              </CardContent>
            </Card>

            {/* Top Contributors */}
            {topUsers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5" />
                    Top Contributors
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {topUsers.slice(0, 5).map((user, index) => (
                    <div key={user.id} className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold">
                        {index + 1}
                      </div>
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                        {user.username?.[0]?.toUpperCase() || user.full_name?.[0]?.toUpperCase() || "U"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{user.full_name || "Unknown User"}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          {user.reputation_score || 0}
                        </div>
                      </div>
                      <Badge className={`${getTierColor(user.tier || "grassroot")} text-white text-xs`}>
                        {(user.tier || "grassroot").replace("_", " ").toUpperCase()}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
