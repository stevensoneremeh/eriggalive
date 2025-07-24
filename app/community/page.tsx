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
import { MessageCircle, ThumbsUp, ThumbsDown, AlertCircle } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

interface Post {
  id: number
  title: string
  content: string
  created_at: string
  user_id: string
  category_id: number
  upvotes: number
  downvotes: number
  user?: {
    username: string
    avatar_url: string | null
    tier: string
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
    const loadPosts = async () => {
      try {
        // First, fetch posts
        const { data: postsData, error: postsError } = await supabase
          .from("community_posts")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(20)

        if (postsError) {
          console.error("Error loading posts:", postsError)
          setError("Failed to fetch posts")
          return
        }

        // Then, fetch users and categories separately
        const userIds = [...new Set(postsData.map((post) => post.user_id))]
        const categoryIds = [...new Set(postsData.map((post) => post.category_id))]

        // Fetch users
        const { data: usersData, error: usersError } = await supabase
          .from("users")
          .select("auth_user_id, username, avatar_url, tier")
          .in("auth_user_id", userIds)

        if (usersError) {
          console.error("Error loading users:", usersError)
        }

        // Fetch categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from("community_categories")
          .select("id, name")
          .in("id", categoryIds)

        if (categoriesError) {
          console.error("Error loading categories:", categoriesError)
        }

        // Create a map of users and categories for easy lookup
        const userMap =
          usersData?.reduce(
            (acc, user) => {
              acc[user.auth_user_id] = user
              return acc
            },
            {} as Record<string, any>,
          ) || {}

        const categoryMap =
          categoriesData?.reduce(
            (acc, category) => {
              acc[category.id] = category
              return acc
            },
            {} as Record<number, any>,
          ) || {}

        // Combine the data
        const enrichedPosts = postsData.map((post) => ({
          ...post,
          user: userMap[post.user_id] || null,
          category: categoryMap[post.category_id] || null,
        }))

        setPosts(enrichedPosts)
      } catch (err) {
        console.error("Error loading posts:", err)
        setError("Failed to fetch posts")
      }
    }

    const loadCategories = async () => {
      try {
        const { data, error } = await supabase
          .from("community_categories")
          .select("*")
          .order("name", { ascending: true })

        if (error) {
          console.error("Error loading categories:", error)
          setError("Failed to fetch categories")
          return
        }

        setCategories(data || [])
      } catch (err) {
        console.error("Error loading categories:", err)
        setError("Failed to fetch categories")
      }
    }

    const loadData = async () => {
      setLoading(true)
      setError(null)
      await Promise.all([loadPosts(), loadCategories()])
      setLoading(false)
    }

    loadData()
  }, [supabase])

  const handleVote = async (postId: number, voteType: "up" | "down") => {
    if (!isAuthenticated) {
      alert("Please sign in to vote")
      return
    }

    try {
      const { error } = await supabase.from("community_votes").insert({
        post_id: postId,
        user_id: profile?.auth_user_id,
        vote_type: voteType === "up" ? "upvote" : "downvote",
      })

      if (error) {
        console.error("Error voting:", error)
        return
      }

      // Update the local state
      setPosts((prevPosts) =>
        prevPosts.map((post) => {
          if (post.id === postId) {
            return {
              ...post,
              upvotes: voteType === "up" ? post.upvotes + 1 : post.upvotes,
              downvotes: voteType === "down" ? post.downvotes + 1 : post.downvotes,
            }
          }
          return post
        }),
      )
    } catch (err) {
      console.error("Error voting:", err)
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
                <Link href="/community/create">Create Post</Link>
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
                <p className="text-muted-foreground">No posts found</p>
                {isAuthenticated && (
                  <Button className="mt-4" asChild>
                    <Link href="/community/create">Create the first post</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredPosts.map((post) => (
                <Card key={post.id}>
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
                          {post.user?.tier && (
                            <Badge variant="outline" className="text-xs">
                              {post.user.tier}
                            </Badge>
                          )}
                          {post.category && (
                            <Badge variant="secondary" className="text-xs">
                              {post.category.name}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <Link href={`/community/post/${post.id}`}>
                      <h3 className="text-xl font-bold mb-2 hover:text-primary transition-colors">{post.title}</h3>
                    </Link>
                    <p className="text-muted-foreground mb-4">
                      {post.content.length > 200 ? `${post.content.substring(0, 200)}...` : post.content}
                    </p>
                    <div className="flex items-center space-x-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground"
                        onClick={() => handleVote(post.id, "up")}
                      >
                        <ThumbsUp className="h-4 w-4 mr-1" />
                        <span>{post.upvotes}</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground"
                        onClick={() => handleVote(post.id, "down")}
                      >
                        <ThumbsDown className="h-4 w-4 mr-1" />
                        <span>{post.downvotes}</span>
                      </Button>
                      <Button variant="ghost" size="sm" className="text-muted-foreground" asChild>
                        <Link href={`/community/post/${post.id}`}>
                          <MessageCircle className="h-4 w-4 mr-1" />
                          <span>Comments</span>
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
                <div className="space-x-2">
                  <Button asChild>
                    <Link href="/login?redirect=/community">Sign In</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/signup">Sign Up</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
