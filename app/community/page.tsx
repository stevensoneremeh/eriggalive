"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Heart, MessageCircle, Share2, Users, TrendingUp, Search, Plus, Filter } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Post {
  id: number
  content: string
  vote_count: number
  comment_count: number
  created_at: string
  user: {
    id: number
    username: string
    full_name: string
    tier: string
    avatar_url?: string
  }
  category: {
    id: number
    name: string
    slug: string
  }
  user_has_voted: boolean
}

interface Category {
  id: number
  name: string
  slug: string
  description?: string
  is_active: boolean
}

const TIER_COLORS = {
  admin: "bg-red-500 text-white",
  blood: "bg-red-600 text-white",
  elder: "bg-purple-500 text-white",
  pioneer: "bg-blue-500 text-white",
  grassroot: "bg-green-500 text-white",
}

export default function CommunityPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [newPost, setNewPost] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)
  const [sortOrder, setSortOrder] = useState("newest")
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<number | null>(null)

  const { user, profile } = useAuth()
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [sortOrder, categoryFilter, searchQuery])

  const loadData = async () => {
    try {
      setLoading(true)

      // Load categories first
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("community_categories")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true })

      if (categoriesError) {
        console.error("Categories error:", categoriesError)
      } else {
        setCategories(categoriesData || [])
      }

      // Build posts query
      let postsQuery = supabase
        .from("community_posts")
        .select(`
          *,
          user:users!community_posts_user_id_fkey (
            id, username, full_name, tier, avatar_url
          ),
          category:community_categories!community_posts_category_id_fkey (
            id, name, slug
          )
        `)
        .eq("is_published", true)
        .eq("is_deleted", false)

      // Apply filters
      if (categoryFilter) {
        postsQuery = postsQuery.eq("category_id", categoryFilter)
      }

      if (searchQuery) {
        postsQuery = postsQuery.ilike("content", `%${searchQuery}%`)
      }

      // Apply sorting
      switch (sortOrder) {
        case "oldest":
          postsQuery = postsQuery.order("created_at", { ascending: true })
          break
        case "top":
          postsQuery = postsQuery.order("vote_count", { ascending: false }).order("created_at", { ascending: false })
          break
        case "newest":
        default:
          postsQuery = postsQuery.order("created_at", { ascending: false })
          break
      }

      postsQuery = postsQuery.limit(20)

      const { data: postsData, error: postsError } = await postsQuery

      if (postsError) {
        console.error("Posts error:", postsError)
        throw postsError
      }

      if (postsData) {
        // Check which posts current user has voted on
        let userVotes: number[] = []
        if (profile?.id) {
          const { data: votesData, error: votesError } = await supabase
            .from("community_post_votes")
            .select("post_id")
            .eq("user_id", profile.id)

          if (!votesError && votesData) {
            userVotes = votesData.map((v) => v.post_id)
          }
        }

        const formattedPosts = postsData.map((post) => ({
          ...post,
          user_has_voted: userVotes.includes(post.id),
        }))

        setPosts(formattedPosts)
      }
    } catch (error) {
      console.error("Error loading data:", error)
      toast({
        title: "Error",
        description: "Failed to load community data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const createPost = async () => {
    if (!newPost.trim() || !profile || !selectedCategory) {
      toast({
        title: "Missing Information",
        description: "Please select a category and write your post content.",
        variant: "destructive",
      })
      return
    }

    setPosting(true)
    try {
      const { data, error } = await supabase
        .from("community_posts")
        .insert({
          user_id: profile.id,
          category_id: selectedCategory,
          content: newPost.trim(),
          is_published: true,
          is_deleted: false,
        })
        .select()
        .single()

      if (error) throw error

      toast({
        title: "Success!",
        description: "Your post has been created successfully.",
      })

      setNewPost("")
      setSelectedCategory(null)
      await loadData()
    } catch (error) {
      console.error("Error creating post:", error)
      toast({
        title: "Error",
        description: "Failed to create post. Please try again.",
        variant: "destructive",
      })
    } finally {
      setPosting(false)
    }
  }

  const voteOnPost = async (postId: number) => {
    if (!profile?.id) {
      toast({
        title: "Authentication Required",
        description: "Please log in to vote on posts.",
        variant: "destructive",
      })
      return
    }

    try {
      // Check if already voted
      const { data: existingVote, error: voteCheckError } = await supabase
        .from("community_post_votes")
        .select("id")
        .eq("post_id", postId)
        .eq("user_id", profile.id)
        .maybeSingle()

      if (voteCheckError && voteCheckError.code !== "PGRST116") {
        throw voteCheckError
      }

      if (existingVote) {
        // Remove vote
        const { error: deleteError } = await supabase
          .from("community_post_votes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", profile.id)

        if (deleteError) throw deleteError

        // Update post vote count
        const { error: updateError } = await supabase.rpc("decrement_post_votes", { post_id: postId })

        if (updateError) {
          // Fallback to manual update if RPC doesn't exist
          await supabase
            .from("community_posts")
            .update({ vote_count: supabase.raw("GREATEST(vote_count - 1, 0)") })
            .eq("id", postId)
        }

        toast({
          title: "Vote Removed",
          description: "Your vote has been removed.",
        })
      } else {
        // Add vote
        const { error: insertError } = await supabase.from("community_post_votes").insert({
          post_id: postId,
          user_id: profile.id,
        })

        if (insertError) throw insertError

        // Update post vote count
        const { error: updateError } = await supabase.rpc("increment_post_votes", { post_id: postId })

        if (updateError) {
          // Fallback to manual update if RPC doesn't exist
          await supabase
            .from("community_posts")
            .update({ vote_count: supabase.raw("vote_count + 1") })
            .eq("id", postId)
        }

        toast({
          title: "Vote Added",
          description: "Thanks for voting!",
        })
      }

      await loadData()
    } catch (error) {
      console.error("Error voting:", error)
      toast({
        title: "Error",
        description: "Failed to vote on post. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading community...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-6xl mx-auto p-4">
        {/* Header */}
        <div className="text-center py-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Erigga Community
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Connect, share, and engage with fellow fans</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* User Info */}
            {profile && (
              <Card className="mb-6 border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={profile.avatar_url || "/placeholder.svg"} />
                      <AvatarFallback>{profile.full_name?.[0] || profile.username?.[0] || "U"}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{profile.full_name}</p>
                      <p className="text-sm text-gray-500">@{profile.username}</p>
                      <Badge
                        className={`text-xs ${TIER_COLORS[profile.tier as keyof typeof TIER_COLORS] || "bg-gray-500 text-white"}`}
                      >
                        {profile.tier}
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-purple-600">{profile.coins || 0}</p>
                      <p className="text-xs text-gray-500">Coins</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-blue-600">{profile.level || 1}</p>
                      <p className="text-xs text-gray-500">Level</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Community Stats */}
            <Card className="mb-6 border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Community Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <Users className="h-4 w-4 text-blue-600 mx-auto mb-1" />
                      <div className="text-2xl font-bold text-blue-600">12,450</div>
                      <div className="text-xs text-blue-600">Members</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <MessageCircle className="h-4 w-4 text-green-600 mx-auto mb-1" />
                      <div className="text-2xl font-bold text-green-600">{posts.length}</div>
                      <div className="text-xs text-green-600">Posts</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Categories */}
            <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">Categories</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="space-y-2">
                  <div
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                      categoryFilter === null
                        ? "bg-blue-100 dark:bg-blue-900/50"
                        : "hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                    onClick={() => setCategoryFilter(null)}
                  >
                    <span className="text-sm font-medium">All Categories</span>
                  </div>
                  {categories.map((category) => (
                    <div
                      key={category.id}
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                        categoryFilter === category.id
                          ? "bg-blue-100 dark:bg-blue-900/50"
                          : "hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                      onClick={() => setCategoryFilter(category.id)}
                    >
                      <span className="text-sm font-medium">{category.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Search and Filter Controls */}
            <Card className="mb-6 border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <div className="flex items-center space-x-2 flex-1">
                    <Search className="h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search posts..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="border-0 bg-gray-50 dark:bg-gray-700"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Filter className="h-4 w-4 text-gray-400" />
                    <Select value={sortOrder} onValueChange={setSortOrder}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Newest</SelectItem>
                        <SelectItem value="oldest">Oldest</SelectItem>
                        <SelectItem value="top">Top Voted</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Create Post */}
            {profile && (
              <Card className="mb-6 border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Plus className="w-5 h-5 mr-2" />
                    Share your thoughts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="What's on your mind?"
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    className="mb-4 border-0 bg-gray-50 dark:bg-gray-700"
                    rows={3}
                  />
                  <div className="flex items-center justify-between">
                    <Select
                      value={selectedCategory?.toString() || ""}
                      onValueChange={(value) => setSelectedCategory(Number(value))}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={createPost}
                      disabled={!newPost.trim() || posting || !selectedCategory}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    >
                      {posting ? "Posting..." : "Post"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Posts Feed */}
            <div className="space-y-6">
              {posts.map((post) => (
                <Card
                  key={post.id}
                  className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:shadow-xl transition-shadow"
                >
                  <CardContent className="p-6">
                    {/* Post Header */}
                    <div className="flex items-center space-x-3 mb-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={post.user?.avatar_url || "/placeholder.svg"} />
                        <AvatarFallback>{post.user?.full_name?.[0] || post.user?.username?.[0] || "U"}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <p className="font-semibold">{post.user?.full_name}</p>
                          <Badge
                            className={`text-xs ${TIER_COLORS[post.user?.tier as keyof typeof TIER_COLORS] || "bg-gray-500 text-white"}`}
                          >
                            {post.user?.tier}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500">@{post.user?.username}</p>
                      </div>
                      <div className="text-sm text-gray-500">{new Date(post.created_at).toLocaleDateString()}</div>
                    </div>

                    {/* Category Badge */}
                    {post.category && (
                      <div className="mb-3">
                        <Badge variant="secondary" className="text-xs">
                          {post.category.name}
                        </Badge>
                      </div>
                    )}

                    {/* Post Content */}
                    <div className="mb-4">
                      <p className="text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                        {post.content}
                      </p>
                    </div>

                    {/* Post Actions */}
                    <div className="flex items-center space-x-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => voteOnPost(post.id)}
                        className={`flex items-center space-x-2 ${
                          post.user_has_voted ? "text-red-500 hover:text-red-600" : "text-gray-500 hover:text-red-500"
                        }`}
                        disabled={!profile}
                      >
                        <Heart className={`h-4 w-4 ${post.user_has_voted ? "fill-current" : ""}`} />
                        <span>{post.vote_count || 0}</span>
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex items-center space-x-2 text-gray-500 hover:text-blue-500"
                      >
                        <MessageCircle className="h-4 w-4" />
                        <span>{post.comment_count || 0}</span>
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex items-center space-x-2 text-gray-500 hover:text-green-500"
                      >
                        <Share2 className="h-4 w-4" />
                        <span>Share</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {posts.length === 0 && (
                <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                  <CardContent className="p-12 text-center">
                    <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">No posts yet</h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      Be the first to share something with the community!
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
