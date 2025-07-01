"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Heart, MessageCircle, Share2, Users, Search, Plus, AlertCircle, Loader2, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"

interface Post {
  id: number
  content: string
  vote_count: number
  comment_count: number
  created_at: string
  is_edited: boolean
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
  blood_brotherhood: "bg-red-600 text-white",
  elder: "bg-purple-500 text-white",
  pioneer: "bg-blue-500 text-white",
  grassroot: "bg-green-500 text-white",
}

const TIER_LABELS = {
  admin: "Admin",
  blood_brotherhood: "Blood",
  elder: "Elder",
  pioneer: "Pioneer",
  grassroot: "Grassroot",
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
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const { user, profile, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const supabase = createClient()

  const loadData = useCallback(
    async (showRefreshing = false) => {
      try {
        if (showRefreshing) {
          setRefreshing(true)
        } else {
          setLoading(true)
        }
        setError(null)

        // Load categories first
        const { data: categoriesData, error: categoriesError } = await supabase
          .from("community_categories")
          .select("*")
          .eq("is_active", true)
          .order("display_order", { ascending: true })

        if (categoriesError) {
          console.error("Categories error:", categoriesError)
          // Use fallback categories
          setCategories([
            { id: 1, name: "General", slug: "general", description: "General discussions", is_active: true },
            { id: 2, name: "Music", slug: "music", description: "Music discussions and bars", is_active: true },
            { id: 3, name: "Events", slug: "events", description: "Upcoming events and shows", is_active: true },
          ])
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
      } catch (error: any) {
        console.error("Error loading data:", error)
        setError("Failed to load community data. Please try again.")

        // Set fallback data
        setCategories([
          { id: 1, name: "General", slug: "general", description: "General discussions", is_active: true },
          { id: 2, name: "Music", slug: "music", description: "Music discussions and bars", is_active: true },
          { id: 3, name: "Events", slug: "events", description: "Upcoming events and shows", is_active: true },
        ])

        setPosts([
          {
            id: 1,
            content: "Welcome to the Erigga community! 🎵 Share your bars, stories, and connect with fellow fans.",
            vote_count: 12,
            comment_count: 5,
            created_at: new Date().toISOString(),
            is_edited: false,
            user: {
              id: 1,
              username: "eriggaofficial",
              full_name: "Erigga",
              tier: "blood_brotherhood",
              avatar_url: "/placeholder-user.jpg",
            },
            category: {
              id: 1,
              name: "General",
              slug: "general",
            },
            user_has_voted: false,
          },
        ])
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [supabase, profile?.id, categoryFilter, searchQuery, sortOrder],
  )

  useEffect(() => {
    if (!authLoading) {
      loadData()
    }
  }, [authLoading, loadData])

  const handleCreatePost = async () => {
    if (!user || !profile) {
      toast({
        title: "Authentication Required",
        description: "Please log in to create a post.",
        variant: "destructive",
      })
      return
    }

    if (!newPost.trim()) {
      toast({
        title: "Content Required",
        description: "Please enter some content for your post.",
        variant: "destructive",
      })
      return
    }

    if (!selectedCategory) {
      toast({
        title: "Category Required",
        description: "Please select a category for your post.",
        variant: "destructive",
      })
      return
    }

    setPosting(true)

    try {
      const { data: newPostData, error } = await supabase
        .from("community_posts")
        .insert({
          user_id: profile.id,
          category_id: selectedCategory,
          content: newPost.trim(),
          is_published: true,
          is_deleted: false,
          vote_count: 0,
          comment_count: 0,
        })
        .select(`
          *,
          user:users!community_posts_user_id_fkey (
            id, username, full_name, tier, avatar_url
          ),
          category:community_categories!community_posts_category_id_fkey (
            id, name, slug
          )
        `)
        .single()

      if (error) {
        throw error
      }

      if (newPostData) {
        const formattedPost = {
          ...newPostData,
          user_has_voted: false,
        }
        setPosts((prev) => [formattedPost, ...prev])
        setNewPost("")
        setSelectedCategory(null)

        toast({
          title: "Post Created",
          description: "Your post has been shared with the community!",
        })
      }
    } catch (error: any) {
      console.error("Error creating post:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to create post. Please try again.",
        variant: "destructive",
      })
    } finally {
      setPosting(false)
    }
  }

  const handleVote = async (postId: number, postCreatorId: number) => {
    if (!user || !profile) {
      toast({
        title: "Authentication Required",
        description: "Please log in to vote on posts.",
        variant: "destructive",
      })
      return
    }

    if (postCreatorId === profile.id) {
      toast({
        title: "Cannot Vote",
        description: "You cannot vote on your own post.",
        variant: "destructive",
      })
      return
    }

    const post = posts.find((p) => p.id === postId)
    if (!post) return

    if (post.user_has_voted) {
      toast({
        title: "Already Voted",
        description: "You have already voted on this post.",
        variant: "destructive",
      })
      return
    }

    if (profile.coins < 100) {
      toast({
        title: "Insufficient Coins",
        description: "You need at least 100 Erigga Coins to vote.",
        variant: "destructive",
      })
      return
    }

    try {
      const { error } = await supabase.from("community_post_votes").insert({
        post_id: postId,
        user_id: profile.id,
      })

      if (error) {
        throw error
      }

      // Update local state
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, vote_count: p.vote_count + 1, user_has_voted: true } : p)),
      )

      toast({
        title: "Vote Successful",
        description: "Your vote has been recorded! 100 coins transferred.",
      })
    } catch (error: any) {
      console.error("Error voting:", error)
      toast({
        title: "Vote Failed",
        description: error.message || "Failed to vote. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleRefresh = () => {
    loadData(true)
  }

  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading community...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Erigga Community</h1>
          <p className="text-muted-foreground">Connect with fellow fans, share your bars, and join the conversation</p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              {error}
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">Total Posts</p>
                  <p className="text-2xl font-bold">{posts.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Heart className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-sm font-medium">Total Votes</p>
                  <p className="text-2xl font-bold">{posts.reduce((sum, post) => sum + post.vote_count, 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <MessageCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium">Total Comments</p>
                  <p className="text-2xl font-bold">{posts.reduce((sum, post) => sum + post.comment_count, 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Create Post */}
        {user && profile && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Plus className="h-5 w-5" />
                <span>Create New Post</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarImage src={profile.avatar_url || "/placeholder-user.jpg"} />
                  <AvatarFallback>{profile.username?.[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{profile.full_name}</p>
                  <Badge
                    className={`text-xs ${
                      TIER_COLORS[profile.tier as keyof typeof TIER_COLORS] || TIER_COLORS.grassroot
                    }`}
                  >
                    {TIER_LABELS[profile.tier as keyof typeof TIER_LABELS] || "Grassroot"}
                  </Badge>
                </div>
              </div>

              <Textarea
                placeholder="Share your thoughts, bars, or stories with the community..."
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                className="min-h-[100px]"
                maxLength={2000}
              />

              <div className="flex items-center justify-between">
                <Select
                  value={selectedCategory?.toString() || "0"}
                  onValueChange={(value) => setSelectedCategory(Number(value))}
                >
                  <SelectTrigger className="w-[200px]">
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

                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">{newPost.length}/2000</span>
                  <Button onClick={handleCreatePost} disabled={posting || !newPost.trim() || !selectedCategory}>
                    {posting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Posting...
                      </>
                    ) : (
                      "Post"
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters and Search */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search posts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Select
                value={categoryFilter?.toString() || "0"}
                onValueChange={(value) => setCategoryFilter(value ? Number(value) : null)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">All categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="oldest">Oldest</SelectItem>
                  <SelectItem value="top">Top Voted</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
                {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Posts */}
        <div className="space-y-4">
          {posts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No posts yet</h3>
                <p className="text-muted-foreground mb-4">Be the first to share something with the community!</p>
                {user && profile && (
                  <Button onClick={() => document.querySelector("textarea")?.focus()}>Create First Post</Button>
                )}
              </CardContent>
            </Card>
          ) : (
            posts.map((post) => (
              <Card key={post.id}>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Post Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src={post.user.avatar_url || "/placeholder-user.jpg"} />
                          <AvatarFallback>{post.user.username?.[0]?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center space-x-2">
                            <p className="font-medium">{post.user.full_name}</p>
                            <Badge
                              className={`text-xs ${
                                TIER_COLORS[post.user.tier as keyof typeof TIER_COLORS] || TIER_COLORS.grassroot
                              }`}
                            >
                              {TIER_LABELS[post.user.tier as keyof typeof TIER_LABELS] || "Grassroot"}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <span>@{post.user.username}</span>
                            <span>•</span>
                            <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                            {post.is_edited && (
                              <>
                                <span>•</span>
                                <span>edited</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <Badge variant="secondary">{post.category.name}</Badge>
                    </div>

                    {/* Post Content */}
                    <div className="prose prose-sm max-w-none">
                      <p className="whitespace-pre-wrap">{post.content}</p>
                    </div>

                    {/* Post Actions */}
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center space-x-4">
                        <Button
                          variant={post.user_has_voted ? "default" : "ghost"}
                          size="sm"
                          onClick={() => handleVote(post.id, post.user.id)}
                          disabled={!user || !profile || post.user.id === profile?.id || post.user_has_voted}
                          className="flex items-center space-x-2"
                        >
                          <Heart className={`h-4 w-4 ${post.user_has_voted ? "fill-current" : ""}`} />
                          <span>{post.vote_count}</span>
                        </Button>

                        <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                          <MessageCircle className="h-4 w-4" />
                          <span>{post.comment_count}</span>
                        </Button>

                        <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                          <Share2 className="h-4 w-4" />
                          <span>Share</span>
                        </Button>
                      </div>

                      {user && profile && post.user.id === profile.id && (
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm">
                            Edit
                          </Button>
                          <Button variant="ghost" size="sm" className="text-destructive">
                            Delete
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
