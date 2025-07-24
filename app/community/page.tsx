"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { MessageCircle, ThumbsUp, AlertCircle, Plus } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

interface Post {
  id: number
  content: string
  created_at: string
  user_id: number
  category_id: number
  vote_count: number
  comment_count: number
  user?: {
    username: string
    avatar_url: string | null
    tier: string
    full_name: string
  }
  category?: {
    name: string
  }
}

interface Category {
  id: number
  name: string
  description: string
}

export default function CommunityPage() {
  const { isAuthenticated, profile } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<number | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError(null)

      try {
        // Load posts with user and category data using joins
        const { data: postsData, error: postsError } = await supabase
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
              name
            )
          `)
          .eq("is_published", true)
          .eq("is_deleted", false)
          .order("created_at", { ascending: false })
          .limit(20)

        if (postsError) {
          console.error("Error loading posts:", postsError)
          // Fallback to mock data if database fails
          setPosts([
            {
              id: 1,
              content: "Welcome to the Erigga community! Share your thoughts and connect with fellow fans.",
              created_at: new Date().toISOString(),
              user_id: 1,
              category_id: 1,
              vote_count: 5,
              comment_count: 2,
              user: {
                username: "eriggaofficial",
                full_name: "Erigga",
                avatar_url: null,
                tier: "blood",
              },
              category: {
                name: "General",
              },
            },
            {
              id: 2,
              content: "Just dropped some fire bars! What do you think about the new sound?",
              created_at: new Date(Date.now() - 3600000).toISOString(),
              user_id: 2,
              category_id: 2,
              vote_count: 12,
              comment_count: 8,
              user: {
                username: "warriking",
                full_name: "Warri King",
                avatar_url: null,
                tier: "pioneer",
              },
              category: {
                name: "Music",
              },
            },
          ])
        } else {
          setPosts(postsData || [])
        }

        // Load categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from("community_categories")
          .select("*")
          .eq("is_active", true)
          .order("name", { ascending: true })

        if (categoriesError) {
          console.error("Error loading categories:", categoriesError)
          // Fallback to mock categories
          setCategories([
            { id: 1, name: "General", description: "General discussions" },
            { id: 2, name: "Music", description: "Music discussions" },
            { id: 3, name: "Bars", description: "Share your bars" },
            { id: 4, name: "Events", description: "Upcoming events" },
          ])
        } else {
          setCategories(categoriesData || [])
        }
      } catch (err) {
        console.error("Error loading data:", err)
        setError("Failed to load community data. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [supabase])

  const handleVote = async (postId: number) => {
    if (!isAuthenticated || !profile) {
      alert("Please sign in to vote")
      return
    }

    try {
      // Check if user already voted
      const { data: existingVote } = await supabase
        .from("community_post_votes")
        .select("*")
        .eq("post_id", postId)
        .eq("user_id", profile.id)
        .single()

      if (existingVote) {
        // Remove vote
        await supabase.from("community_post_votes").delete().eq("post_id", postId).eq("user_id", profile.id)

        // Update local state
        setPosts((prevPosts) =>
          prevPosts.map((post) => (post.id === postId ? { ...post, vote_count: post.vote_count - 1 } : post)),
        )
      } else {
        // Add vote
        await supabase.from("community_post_votes").insert({
          post_id: postId,
          user_id: profile.id,
        })

        // Update local state
        setPosts((prevPosts) =>
          prevPosts.map((post) => (post.id === postId ? { ...post, vote_count: post.vote_count + 1 } : post)),
        )
      }
    } catch (err) {
      console.error("Error voting:", err)
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case "blood":
      case "blood_brotherhood":
        return "bg-red-500 text-white"
      case "elder":
        return "bg-purple-500 text-white"
      case "pioneer":
        return "bg-blue-500 text-white"
      case "grassroot":
        return "bg-green-500 text-white"
      default:
        return "bg-gray-500 text-white"
    }
  }

  const filteredPosts = activeCategory ? posts.filter((post) => post.category_id === activeCategory) : posts

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <Skeleton className="h-10 w-full" />
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4 mb-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-6 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={() => window.location.reload()}>Refresh Page</Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Community</h1>
            {isAuthenticated && (
              <Button asChild>
                <Link href="/community/create">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Post
                </Link>
              </Button>
            )}
          </div>

          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all" onClick={() => setActiveCategory(null)}>
                All Posts
              </TabsTrigger>
              <TabsTrigger value="popular">Popular</TabsTrigger>
              <TabsTrigger value="recent">Recent</TabsTrigger>
            </TabsList>
          </Tabs>

          {filteredPosts.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No posts found</p>
                {isAuthenticated && (
                  <Button asChild>
                    <Link href="/community/create">Create the first post</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredPosts.map((post) => (
                <Card key={post.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4 mb-4">
                      <Avatar>
                        <AvatarImage src={post.user?.avatar_url || "/placeholder-user.jpg"} />
                        <AvatarFallback>{post.user?.username?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{post.user?.username || "Unknown User"}</p>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-muted-foreground">
                            {new Date(post.created_at).toLocaleDateString()}
                          </span>
                          {post.user?.tier && <Badge className={getTierColor(post.user.tier)}>{post.user.tier}</Badge>}
                          {post.category && (
                            <Badge variant="secondary" className="text-xs">
                              {post.category.name}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-foreground whitespace-pre-wrap">
                        {post.content.length > 300 ? `${post.content.substring(0, 300)}...` : post.content}
                      </p>
                    </div>

                    <div className="flex items-center space-x-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-primary"
                        onClick={() => handleVote(post.id)}
                      >
                        <ThumbsUp className="h-4 w-4 mr-1" />
                        <span>{post.vote_count}</span>
                      </Button>

                      <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary" asChild>
                        <Link href={`/community/post/${post.id}`}>
                          <MessageCircle className="h-4 w-4 mr-1" />
                          <span>{post.comment_count} Comments</span>
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button
                  variant={activeCategory === null ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveCategory(null)}
                >
                  All Categories
                </Button>
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={activeCategory === category.id ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setActiveCategory(category.id)}
                  >
                    {category.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {!isAuthenticated && (
            <Card>
              <CardHeader>
                <CardTitle>Join the Community</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Sign in to participate in discussions, create posts, and vote.
                </p>
                <div className="space-y-2">
                  <Button className="w-full" asChild>
                    <Link href="/login?redirect=/community">Sign In</Link>
                  </Button>
                  <Button variant="outline" className="w-full bg-transparent" asChild>
                    <Link href="/signup">Sign Up</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {isAuthenticated && profile && (
            <Card>
              <CardHeader>
                <CardTitle>Your Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-3 mb-4">
                  <Avatar>
                    <AvatarImage src={profile.avatar_url || "/placeholder-user.jpg"} />
                    <AvatarFallback>{profile.username?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{profile.username}</p>
                    <Badge className={getTierColor(profile.tier || "grassroot")}>{profile.tier || "grassroot"}</Badge>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>Coins: {profile.coins_balance || 0}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
