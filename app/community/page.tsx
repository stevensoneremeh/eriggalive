"use client"

import { useEffect } from "react"

import { useState } from "react"

import { Suspense } from "react"
import { CommunityFeed } from "@/components/community/community-feed"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Users, MessageCircle, TrendingUp, Award } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { createCommunityPost, voteOnPost } from "@/lib/community-actions"
import { toast } from "sonner"

interface Category {
  id: number
  name: string
  slug: string
  icon: string
  color: string
}

interface Post {
  id: number
  content: string
  media_url?: string
  media_type?: string
  hashtags: string[]
  vote_count: number
  comment_count: number
  view_count: number
  created_at: string
  user: {
    id: number
    username: string
    full_name: string
    avatar_url?: string
    tier: string
  }
  category: {
    id: number
    name: string
    slug: string
    icon: string
    color: string
  }
  has_voted: boolean
}

function CommunityStats() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-blue-500" />
            <div>
              <p className="text-sm font-medium">Members</p>
              <p className="text-2xl font-bold">2.5K</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <MessageCircle className="h-4 w-4 text-green-500" />
            <div>
              <p className="text-sm font-medium">Posts</p>
              <p className="text-2xl font-bold">1.2K</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4 text-orange-500" />
            <div>
              <p className="text-sm font-medium">Active</p>
              <p className="text-2xl font-bold">456</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Award className="h-4 w-4 text-purple-500" />
            <div>
              <p className="text-sm font-medium">Top Bars</p>
              <p className="text-2xl font-bold">89</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function CommunityPageContent() {
  const { profile, isAuthenticated, isLoading } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)

  // Form state
  const [newPostContent, setNewPostContent] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("newest")

  useEffect(() => {
    loadPosts()
    loadCategories()
  }, [])

  const loadPosts = async () => {
    try {
      const response = await fetch("/api/community/posts")
      const data = await response.json()

      if (data.error) {
        console.error("Error loading posts:", data.error)
        toast.error("Failed to load posts")
      } else {
        setPosts(data.posts || [])
      }
    } catch (error) {
      console.error("Error loading posts:", error)
      toast.error("Failed to load posts")
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const response = await fetch("/api/community/categories")
      const data = await response.json()

      if (data.error) {
        console.error("Error loading categories:", data.error)
      } else {
        setCategories(data.categories || [])
      }
    } catch (error) {
      console.error("Error loading categories:", error)
    }
  }

  const handleCreatePost = async () => {
    if (!newPostContent.trim() || !selectedCategory) {
      toast.error("Please fill in all required fields")
      return
    }

    setCreating(true)

    try {
      const formData = new FormData()
      formData.append("content", newPostContent)
      formData.append("categoryId", selectedCategory)

      const result = await createCommunityPost(formData)

      if (result.success) {
        toast.success("Post created successfully!")
        setNewPostContent("")
        setSelectedCategory("")
        setShowCreateForm(false)
        loadPosts() // Reload posts
      } else {
        toast.error(result.error || "Failed to create post")
      }
    } catch (error) {
      console.error("Error creating post:", error)
      toast.error("Failed to create post")
    } finally {
      setCreating(false)
    }
  }

  const handleVote = async (postId: number) => {
    if (!isAuthenticated) {
      toast.error("Please sign in to vote")
      return
    }

    try {
      const result = await voteOnPost(postId)

      if (result.success) {
        // Update local state
        setPosts((prev) =>
          prev.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  vote_count: result.voted ? post.vote_count + 1 : post.vote_count - 1,
                  has_voted: result.voted,
                }
              : post,
          ),
        )
        toast.success(result.voted ? "Vote added!" : "Vote removed!")
      } else {
        toast.error(result.error || "Failed to vote")
      }
    } catch (error) {
      console.error("Error voting:", error)
      toast.error("Failed to vote")
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case "blood":
        return "bg-red-500"
      case "elder":
        return "bg-purple-500"
      case "pioneer":
        return "bg-blue-500"
      case "grassroot":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.user.username.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  const sortedPosts = [...filteredPosts].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      case "oldest":
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      case "popular":
        return b.vote_count - a.vote_count
      default:
        return 0
    }
  })

  if (loading || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <Skeleton className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Community</h1>
        <p className="text-muted-foreground">
          Connect with fellow fans, share your bars, and stay updated with the latest from Erigga's community.
        </p>
      </div>

      <CommunityStats />

      <Suspense fallback={<CommunityFeedSkeleton />}>
        <CommunityFeed />
      </Suspense>
    </div>
  )
}

function CommunityFeedSkeleton() {
  return (
    <div className="space-y-6">
      {/* Create Post Skeleton */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full mb-4" />
          <div className="flex justify-between">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-20" />
          </div>
        </CardContent>
      </Card>

      {/* Post Skeletons */}
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <div className="flex items-center space-x-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-16 w-full mb-4" />
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
              </div>
              <Skeleton className="h-8 w-8" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function CommunityPage() {
  return (
    <Suspense fallback={<CommunityFeedSkeleton />}>
      <CommunityPageContent />
    </Suspense>
  )
}
