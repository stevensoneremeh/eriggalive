"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Heart, MessageCircle, Share2, Coins, TrendingUp, User } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface UserType {
  id: number
  username: string
  full_name: string
  tier: string
  avatar_url?: string
  coins: number
  reputation_score: number
}

interface Post {
  id: number
  content: string
  vote_count: number
  comment_count: number
  created_at: string
  user: UserType
  user_has_voted: boolean
}

interface Category {
  id: number
  name: string
  slug: string
  icon: string
  color: string
  post_count: number
}

const TIER_COLORS = {
  admin: "bg-red-500 text-white",
  mod: "bg-purple-500 text-white",
  grassroot: "bg-green-500 text-white",
  pioneer: "bg-blue-500 text-white",
  elder: "bg-yellow-500 text-black",
  blood: "bg-red-600 text-white",
}

export default function WorkingFinalCommunityPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [currentUser, setCurrentUser] = useState<UserType | null>(null)
  const [newPost, setNewPost] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Get current user
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()

      if (authUser) {
        const { data: userData } = await supabase.from("users").select("*").eq("auth_user_id", authUser.id).single()

        setCurrentUser(userData)
      }

      // Load categories
      const { data: categoriesData } = await supabase.from("community_categories").select("*").order("display_order")

      setCategories(categoriesData || [])

      // Load posts with user data
      const { data: postsData } = await supabase
        .from("community_posts")
        .select(`
          *,
          users!community_posts_user_id_fkey (
            id,
            username,
            full_name,
            tier,
            avatar_url,
            coins,
            reputation_score
          )
        `)
        .eq("is_published", true)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false })
        .limit(20)

      if (postsData) {
        // Check which posts current user has voted on
        let userVotes: number[] = []
        if (currentUser) {
          const { data: votesData } = await supabase.from("post_votes").select("post_id").eq("user_id", currentUser.id)

          userVotes = votesData?.map((v) => v.post_id) || []
        }

        const formattedPosts = postsData.map((post) => ({
          id: post.id,
          content: post.content,
          vote_count: post.vote_count || 0,
          comment_count: post.comment_count || 0,
          created_at: post.created_at,
          user: post.users,
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
    if (!newPost.trim() || !currentUser) return

    setPosting(true)
    try {
      const { data, error } = await supabase
        .from("community_posts")
        .insert({
          user_id: currentUser.id,
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
    if (!currentUser) return

    try {
      const { data, error } = await supabase.rpc("vote_on_post", {
        p_post_id: postId,
        p_user_id: currentUser.id,
      })

      if (error) throw error

      toast({
        title: data ? "Voted!" : "Vote removed",
        description: data ? "You voted and spent 100 coins" : "Vote removed and coins refunded",
      })

      loadData() // Reload to update vote counts and user coins
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
            {currentUser && (
              <Card className="mb-6 border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={currentUser.avatar_url || "/placeholder.svg"} />
                      <AvatarFallback>
                        <User className="h-6 w-6" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{currentUser.full_name}</p>
                      <p className="text-sm text-gray-500">@{currentUser.username}</p>
                      <Badge
                        className={`text-xs ${TIER_COLORS[currentUser.tier as keyof typeof TIER_COLORS] || "bg-gray-500 text-white"}`}
                      >
                        {currentUser.tier}
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-between text-sm">
                    <div className="flex items-center">
                      <Coins className="h-4 w-4 mr-1 text-yellow-500" />
                      <span>{currentUser.coins}</span>
                    </div>
                    <div className="flex items-center">
                      <TrendingUp className="h-4 w-4 mr-1 text-green-500" />
                      <span>{currentUser.reputation_score}</span>
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
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                      onClick={() => setSelectedCategory(category.id)}
                    >
                      <div className="flex items-center space-x-2">
                        <span>{category.icon}</span>
                        <span className="text-sm">{category.name}</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {category.post_count}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Create Post */}
            {currentUser && (
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
                    disabled={!newPost.trim() || posting}
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
                        <AvatarFallback>
                          <User className="h-5 w-5" />
                        </AvatarFallback>
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
                        disabled={!currentUser}
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
