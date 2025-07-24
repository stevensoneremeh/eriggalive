"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Heart, MessageCircle, Share2, Plus, Search, TrendingUp } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"

interface Post {
  id: string
  title: string
  content: string
  author_id: string
  created_at: string
  likes_count: number
  comments_count: number
  category: string
  author?: {
    username: string
    full_name: string
    avatar_url?: string
  }
}

interface Category {
  id: string
  name: string
  description: string
  post_count: number
}

export default function CommunityPage() {
  const { user, profile, isAuthenticated, loading: authLoading } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [newPost, setNewPost] = useState({ title: "", content: "", category: "general" })

  const supabase = createClient()

  const loadPosts = async () => {
    try {
      setError(null)

      // Simple query without complex joins
      const { data: postsData, error: postsError } = await supabase
        .from("community_posts")
        .select(`
          id,
          title,
          content,
          author_id,
          created_at,
          likes_count,
          comments_count,
          category
        `)
        .order("created_at", { ascending: false })
        .limit(20)

      if (postsError) {
        console.error("Error loading posts:", postsError)
        // Use fallback data
        setPosts(getFallbackPosts())
        return
      }

      // Get author information separately
      if (postsData && postsData.length > 0) {
        const authorIds = [...new Set(postsData.map((post) => post.author_id))]

        const { data: authorsData, error: authorsError } = await supabase
          .from("users")
          .select("auth_user_id, username, full_name, avatar_url")
          .in("auth_user_id", authorIds)

        if (!authorsError && authorsData) {
          const authorsMap = new Map(authorsData.map((author) => [author.auth_user_id, author]))

          const postsWithAuthors = postsData.map((post) => ({
            ...post,
            author: authorsMap.get(post.author_id) || {
              username: "Unknown User",
              full_name: "Unknown User",
              avatar_url: null,
            },
          }))

          setPosts(postsWithAuthors)
        } else {
          setPosts(
            postsData.map((post) => ({
              ...post,
              author: {
                username: "Unknown User",
                full_name: "Unknown User",
                avatar_url: null,
              },
            })),
          )
        }
      } else {
        setPosts([])
      }
    } catch (error) {
      console.error("Error in loadPosts:", error)
      setError("Failed to load posts")
      setPosts(getFallbackPosts())
    }
  }

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase.from("community_categories").select("*").order("name")

      if (error) {
        console.error("Error loading categories:", error)
        setCategories(getFallbackCategories())
        return
      }

      setCategories(data || getFallbackCategories())
    } catch (error) {
      console.error("Error in loadCategories:", error)
      setCategories(getFallbackCategories())
    }
  }

  const getFallbackPosts = (): Post[] => [
    {
      id: "1",
      title: "Welcome to Erigga Community!",
      content:
        "This is the official community space for all Erigga fans. Share your thoughts, connect with other fans, and stay updated!",
      author_id: "system",
      created_at: new Date().toISOString(),
      likes_count: 25,
      comments_count: 8,
      category: "general",
      author: {
        username: "erigga_official",
        full_name: "Erigga Official",
        avatar_url: null,
      },
    },
    {
      id: "2",
      title: "New Music Coming Soon!",
      content: "Can't wait to share some new tracks with you all. What kind of vibe are you hoping for?",
      author_id: "system",
      created_at: new Date(Date.now() - 86400000).toISOString(),
      likes_count: 42,
      comments_count: 15,
      category: "music",
      author: {
        username: "erigga_official",
        full_name: "Erigga Official",
        avatar_url: null,
      },
    },
  ]

  const getFallbackCategories = (): Category[] => [
    { id: "general", name: "General", description: "General discussions", post_count: 15 },
    { id: "music", name: "Music", description: "Music discussions", post_count: 8 },
    { id: "events", name: "Events", description: "Upcoming events", post_count: 3 },
    { id: "freebies", name: "Freebies", description: "Free content and giveaways", post_count: 5 },
  ]

  const createPost = async () => {
    if (!isAuthenticated || !profile) {
      toast.error("Please sign in to create a post")
      return
    }

    if (!newPost.title.trim() || !newPost.content.trim()) {
      toast.error("Please fill in all fields")
      return
    }

    try {
      const { data, error } = await supabase
        .from("community_posts")
        .insert({
          title: newPost.title,
          content: newPost.content,
          category: newPost.category,
          author_id: user?.id,
          likes_count: 0,
          comments_count: 0,
        })
        .select()
        .single()

      if (error) {
        console.error("Error creating post:", error)
        toast.error("Failed to create post")
        return
      }

      toast.success("Post created successfully!")
      setNewPost({ title: "", content: "", category: "general" })
      setShowCreatePost(false)
      loadPosts() // Reload posts
    } catch (error) {
      console.error("Error creating post:", error)
      toast.error("Failed to create post")
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([loadPosts(), loadCategories()])
      setLoading(false)
    }

    loadData()
  }, [])

  const filteredPosts = posts.filter((post) => {
    const matchesCategory = selectedCategory === "all" || post.category === selectedCategory
    const matchesSearch =
      searchQuery === "" ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
            <p className="text-white mt-4">Loading community...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Erigga Community</h1>
          <p className="text-blue-200">Connect, share, and vibe with fellow fans</p>
        </div>

        {error && (
          <Card className="mb-6 border-red-500 bg-red-50">
            <CardContent className="p-4">
              <p className="text-red-600">{error}</p>
              <Button
                onClick={() => {
                  setError(null)
                  loadPosts()
                }}
                className="mt-2"
                size="sm"
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Categories
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button
                    variant={selectedCategory === "all" ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setSelectedCategory("all")}
                  >
                    All Posts
                  </Button>
                  {categories.map((category) => (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.id ? "default" : "ghost"}
                      className="w-full justify-between"
                      onClick={() => setSelectedCategory(category.id)}
                    >
                      {category.name}
                      <Badge variant="secondary">{category.post_count}</Badge>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Community Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Community Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Posts</span>
                    <span className="font-semibold">{posts.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Categories</span>
                    <span className="font-semibold">{categories.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Users</span>
                    <span className="font-semibold">150+</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Search and Create Post */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search posts..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  {isAuthenticated && (
                    <Button onClick={() => setShowCreatePost(!showCreatePost)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Post
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Create Post Form */}
            {showCreatePost && isAuthenticated && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Create New Post</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Input
                      placeholder="Post title..."
                      value={newPost.title}
                      onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                    />
                    <Textarea
                      placeholder="What's on your mind?"
                      value={newPost.content}
                      onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                      rows={4}
                    />
                    <select
                      value={newPost.category}
                      onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}
                      className="w-full p-2 border rounded-md"
                    >
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <Button onClick={createPost}>Post</Button>
                      <Button variant="outline" onClick={() => setShowCreatePost(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Posts */}
            <div className="space-y-6">
              {filteredPosts.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-gray-500">No posts found. Be the first to create one!</p>
                  </CardContent>
                </Card>
              ) : (
                filteredPosts.map((post) => (
                  <Card key={post.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <Avatar>
                          <AvatarImage src={post.author?.avatar_url || undefined} />
                          <AvatarFallback>{post.author?.username?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{post.author?.full_name || "Unknown User"}</h3>
                            <span className="text-sm text-gray-500">@{post.author?.username || "unknown"}</span>
                            <Badge variant="secondary">{post.category}</Badge>
                            <span className="text-sm text-gray-500">
                              {new Date(post.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <h2 className="text-xl font-bold mb-2">{post.title}</h2>
                          <p className="text-gray-700 mb-4">{post.content}</p>
                          <div className="flex items-center gap-6">
                            <button className="flex items-center gap-2 text-gray-500 hover:text-red-500 transition-colors">
                              <Heart className="h-4 w-4" />
                              <span>{post.likes_count}</span>
                            </button>
                            <button className="flex items-center gap-2 text-gray-500 hover:text-blue-500 transition-colors">
                              <MessageCircle className="h-4 w-4" />
                              <span>{post.comments_count}</span>
                            </button>
                            <button className="flex items-center gap-2 text-gray-500 hover:text-green-500 transition-colors">
                              <Share2 className="h-4 w-4" />
                              <span>Share</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
