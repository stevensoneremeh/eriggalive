"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context" // Keep your existing auth
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Heart, MessageCircle, Share2 } from "lucide-react"
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
    name: string
    slug: string
  }
  user_has_voted: boolean
}

interface Category {
  id: number
  name: string
  slug: string
  icon: string
  color: string
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

  // Use your existing auth context
  const { user, profile } = useAuth()
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Load categories
      const { data: categoriesData } = await supabase.from("community_categories").select("*").order("display_order")

      setCategories(categoriesData || [])

      // Load posts with user data
      const { data: postsData } = await supabase
        .from("community_posts")
        .select(`
          *,
          user:users!community_posts_user_id_fkey (
            id, username, full_name, tier, avatar_url
          ),
          category:community_categories!community_posts_category_id_fkey (
            name, slug
          )
        `)
        .eq("is_published", true)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false })
        .limit(20)

      if (postsData) {
        // Check which posts current user has voted on
        let userVotes: number[] = []
        if (profile) {
          const { data: votesData } = await supabase.from("community_votes").select("post_id").eq("user_id", profile.id)

          userVotes = votesData?.map((v) => v.post_id) || []
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
        description: "Failed to load community data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const createPost = async () => {
    if (!newPost.trim() || !profile) return

    setPosting(true)
    try {
      const { data, error } = await supabase
        .from("community_posts")
        .insert({
          user_id: profile.id,
          category_id: selectedCategory,
          content: newPost.trim(),
        })
        .select()
        .single()

      if (error) throw error

      toast({
        title: "Success!",
        description: "Your post has been created",
      })

      setNewPost("")
      setSelectedCategory(null)
      loadData() // Reload posts
    } catch (error) {
      console.error("Error creating post:", error)
      toast({
        title: "Error",
        description: "Failed to create post",
        variant: "destructive",
      })
    } finally {
      setPosting(false)
    }
  }

  const voteOnPost = async (postId: number) => {
    if (!profile) return

    try {
      // Check if already voted
      const { data: existingVote } = await supabase
        .from("community_votes")
        .select("id")
        .eq("post_id", postId)
        .eq("user_id", profile.id)
        .single()

      if (existingVote) {
        // Remove vote
        await supabase.from("community_votes").delete().eq("post_id", postId).eq("user_id", profile.id)

        // Update post vote count
        await supabase.rpc("decrement_post_votes", { post_id: postId })
      } else {
        // Add vote
        await supabase.from("community_votes").insert({
          post_id: postId,
          user_id: profile.id,
        })

        // Update post vote count
        await supabase.rpc("increment_post_votes", { post_id: postId })
      }

      loadData() // Reload to update counts
    } catch (error) {
      console.error("Error voting:", error)
      toast({
        title: "Error",
        description: "Failed to vote on post",
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
                </CardContent>
              </Card>
            )}

            {/* Categories */}
            <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">Categories</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="space-y-2">
                  {categories.map((category) => (
                    <div
                      key={category.id}
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                        selectedCategory === category.id
                          ? "bg-blue-100 dark:bg-blue-900"
                          : "hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                      onClick={() => setSelectedCategory(category.id)}
                    >
                      <div className="flex items-center space-x-2">
                        <span>{category.icon}</span>
                        <span className="text-sm">{category.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Create Post */}
            {profile && (
              <Card className="mb-6 border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Share your thoughts</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="What's on your mind?"
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    className="mb-4 border-0 bg-gray-50 dark:bg-gray-700"
                    rows={3}
                  />
                  {selectedCategory && (
                    <div className="mb-4">
                      <Badge variant="outline">{categories.find((c) => c.id === selectedCategory)?.name}</Badge>
                    </div>
                  )}
                  <Button
                    onClick={createPost}
                    disabled={!newPost.trim() || posting || !selectedCategory}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    {posting ? "Posting..." : "Post"}
                  </Button>
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

                    {/* Post Content */}
                    <div className="mb-4">
                      <p className="text-gray-800 dark:text-gray-200 leading-relaxed">{post.content}</p>
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
                        <span>{post.vote_count}</span>
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex items-center space-x-2 text-gray-500 hover:text-blue-500"
                      >
                        <MessageCircle className="h-4 w-4" />
                        <span>{post.comment_count}</span>
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
                    <p className="text-gray-500 dark:text-gray-400">No posts yet. Be the first to share something!</p>
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
