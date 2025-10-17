"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Users,
  TrendingUp,
  Send,
  Eye,
  Hash,
  Coins,
  RefreshCw,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"

interface Post {
  id: number
  user_id: string
  category_id: number
  content: string
  hashtags: string[]
  vote_count: number
  comment_count: number
  view_count: number
  created_at: string
  updated_at: string
  user_profiles: {
    id: string
    username: string
    full_name: string
    avatar_url?: string
    tier: string
    coins: number
    reputation_score: number
  }
  community_categories: {
    id: number
    name: string
    slug: string
    icon: string
    color: string
  }
  has_voted?: boolean
}

interface Category {
  id: number
  name: string
  slug: string
  icon: string
  color: string
  post_count: number
}

interface Profile {
  id: string
  username: string
  full_name: string
  email: string
  avatar_url?: string
  tier: string
  coins: number
  reputation_score: number
  posts_count: number
}

interface CompleteWorkingCommunityClientProps {
  user: any
  profile: Profile | null
  initialPosts: Post[]
  categories: Category[]
}

export function CompleteWorkingCommunityClient({
  user,
  profile,
  initialPosts,
  categories,
}: CompleteWorkingCommunityClientProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [userProfile, setUserProfile] = useState<Profile | null>(profile)
  const [newPostContent, setNewPostContent] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const { toast } = useToast()
  const supabase = createClient()

  // Load user profile if not available
  useEffect(() => {
    if (!userProfile && user) {
      loadUserProfile()
    }
  }, [user, userProfile])

  // Set up real-time subscriptions
  useEffect(() => {
    const channel = supabase
      .channel("community_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "community_posts" }, () => {
        refreshPosts()
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "post_votes" }, () => {
        refreshPosts()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const loadUserProfile = async () => {
    try {
      const response = await fetch("/api/user/profile")
      const data = await response.json()

      if (data.success) {
        setUserProfile(data.profile)
      }
    } catch (error) {
      console.error("Error loading profile:", error)
    }
  }

  const refreshPosts = async () => {
    setIsRefreshing(true)
    try {
      const response = await fetch("/api/community/posts")
      const data = await response.json()

      if (data.success) {
        setPosts(data.posts)
      }
    } catch (error) {
      console.error("Error refreshing posts:", error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newPostContent.trim() || !selectedCategory) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/community/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: newPostContent.trim(),
          categoryId: selectedCategory,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create post")
      }

      toast({
        title: "Post Created! 🎉",
        description: "Your post has been shared with the community.",
      })

      // Reset form
      setNewPostContent("")
      setSelectedCategory("")

      // Refresh posts to show the new one
      await refreshPosts()
    } catch (error) {
      console.error("Error creating post:", error)
      toast({
        title: "Failed to Create Post",
        description: error instanceof Error ? error.message : "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVote = async (postId: number, hasVoted: boolean) => {
    try {
      const response = await fetch("/api/community/vote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postId,
          coinAmount: 100,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to vote")
      }

      if (data.success) {
        toast({
          title: data.voted ? "Vote Added! 🎉" : "Vote Removed",
          description: data.message,
        })

        // Update local state immediately
        setPosts((prevPosts) =>
          prevPosts.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  vote_count: data.voted ? post.vote_count + 1 : post.vote_count - 1,
                  has_voted: data.voted,
                }
              : post,
          ),
        )

        // Update user profile coins
        if (userProfile) {
          setUserProfile((prev) =>
            prev
              ? {
                  ...prev,
                  coins: data.voted ? prev.coins - 100 : prev.coins + 100,
                }
              : null,
          )
        }
      }
    } catch (error) {
      console.error("Error voting:", error)
      toast({
        title: "Vote Failed",
        description: error instanceof Error ? error.message : "Something went wrong. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getTierColor = (tier: string) => {
    const colors = {
      admin: "bg-red-600 text-white",
      blood_brotherhood: "bg-red-700 text-white",
      elder: "bg-purple-600 text-white",
      pioneer: "bg-blue-600 text-white",
      grassroot: "bg-green-600 text-white",
    } as Record<string, string>
    return colors[tier] || "bg-gray-600 text-white"
  }

  const renderContent = (content: string) => {
    let html = content.replace(/#(\w+)/g, '<span class="text-blue-600 font-medium cursor-pointer">#$1</span>')
    html = html.replace(/@(\w+)/g, '<span class="text-purple-600 font-medium cursor-pointer">@$1</span>')
    return { __html: html }
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Setting up your profile...</h1>
          <p className="text-gray-600">Please wait while we create your community profile.</p>
        </div>
      </div>
    )
  }

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
              Complete Working Community
            </h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Full-stack community with Supabase Auth integration, persistent storage, and real-time updates
          </p>
          <div className="flex justify-center gap-6 mt-6 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <MessageCircle className="h-4 w-4" />
              {posts.length} Posts
            </span>
            <span className="flex items-center gap-1">
              <Coins className="h-4 w-4 text-yellow-500" />
              {userProfile.coins} Coins
            </span>
            <span className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              {userProfile.reputation_score} Reputation
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar - Categories */}
          <div className="lg:col-span-1 space-y-6">
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
                        <div className="text-xs text-gray-500">{category.post_count} posts</div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* User Profile Card */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5 text-purple-600" />
                  Your Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={userProfile.avatar_url || "/placeholder-user.jpg"} alt={userProfile.username} />
                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold">
                      {userProfile.username?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">{userProfile.full_name}</div>
                    <div className="text-sm text-gray-500">@{userProfile.username}</div>
                    <Badge className={getTierColor(userProfile.tier)}>
                      {userProfile.tier.replace("_", " ").toUpperCase()}
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-center p-2 bg-yellow-50 rounded-lg">
                    <div className="font-bold text-yellow-600">{userProfile.coins}</div>
                    <div className="text-gray-500">Coins</div>
                  </div>
                  <div className="text-center p-2 bg-purple-50 rounded-lg">
                    <div className="font-bold text-purple-600">{userProfile.reputation_score}</div>
                    <div className="text-gray-500">Reputation</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Create Post */}
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={userProfile.avatar_url || "/placeholder-user.jpg"} alt={userProfile.username} />
                      <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold">
                        {userProfile.username?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{userProfile.full_name}</span>
                        <Badge className={getTierColor(userProfile.tier)}>
                          {userProfile.tier.replace("_", " ").toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500">
                        @{userProfile.username} • {userProfile.email}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={refreshPosts}
                    disabled={isRefreshing}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreatePost} className="space-y-4">
                  <div>
                    <Textarea
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      placeholder="What's on your mind? Share your thoughts with the community... Use #hashtags and @mentions!"
                      className="min-h-[120px] resize-none border-0 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500"
                      maxLength={2000}
                      required
                    />
                    <div className="flex justify-between items-center mt-2 text-sm text-gray-500">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Hash className="h-4 w-4" />
                          Use hashtags
                        </span>
                      </div>
                      <span>{newPostContent.length}/2000</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <Select value={selectedCategory} onValueChange={setSelectedCategory} required>
                      <SelectTrigger className="w-64">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            <div className="flex items-center gap-2">
                              <span>{category.icon}</span>
                              <span>{category.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button
                      type="submit"
                      disabled={isSubmitting || !newPostContent.trim() || !selectedCategory}
                      className="px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Posting...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Send className="h-4 w-4" />
                          Share Post
                        </div>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

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
                          <Avatar className="h-12 w-12 ring-2 ring-gray-200 dark:ring-gray-700">
                            <AvatarImage
                              src={post.user_profiles?.avatar_url || "/placeholder-user.jpg"}
                              alt={post.user_profiles?.username}
                            />
                            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold">
                              {post.user_profiles?.username?.charAt(0).toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <span className="font-semibold text-gray-900">{post.user_profiles?.full_name}</span>
                              <Badge className={getTierColor(post.user_profiles?.tier)}>
                                {post.user_profiles?.tier?.replace("_", " ").toUpperCase()}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <span>@{post.user_profiles?.username}</span>
                              <span>•</span>
                              <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                            </div>
                            <Badge
                              variant="outline"
                              className="mt-2"
                              style={{
                                backgroundColor: post.community_categories?.color + "15",
                                borderColor: post.community_categories?.color,
                                color: post.community_categories?.color,
                              }}
                            >
                              {post.community_categories?.icon} {post.community_categories?.name}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Post Content */}
                      <div className="mb-6">
                        <div
                          className="prose prose-sm max-w-none dark:prose-invert leading-relaxed text-gray-800 dark:text-gray-200"
                          dangerouslySetInnerHTML={renderContent(post.content)}
                        />
                        {post.hashtags && post.hashtags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-4">
                            {post.hashtags.slice(0, 5).map((hashtag: string, index: number) => (
                              <Badge
                                key={index}
                                variant="secondary"
                                className="cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900"
                              >
                                <Hash className="h-3 w-3 mr-1" />
                                {hashtag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Post Actions */}
                      <div className="flex items-center justify-between pt-4 border-t bg-gray-50 dark:bg-gray-800/50 -mx-6 -mb-6 px-6 py-4">
                        <div className="flex items-center gap-1">
                          {/* Vote Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                              "flex items-center gap-2 hover:bg-green-100 dark:hover:bg-green-900/20",
                              post.has_voted && "text-green-600 bg-green-50 dark:bg-green-900/20",
                            )}
                            onClick={() => handleVote(post.id, post.has_voted || false)}
                            disabled={post.user_profiles?.id === userProfile?.id}
                          >
                            <Heart className={cn("h-5 w-5", post.has_voted && "fill-current")} />
                            <span className="font-medium">{post.vote_count}</span>
                            <Coins className="h-4 w-4 text-yellow-500" />
                          </Button>

                          {/* Comments */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex items-center gap-2 hover:bg-blue-100 dark:hover:bg-blue-900/20"
                          >
                            <MessageCircle className="h-4 w-4" />
                            <span>{post.comment_count}</span>
                          </Button>

                          {/* Bookmark */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex items-center gap-2 hover:bg-yellow-100 dark:hover:bg-yellow-900/20"
                          >
                            <Bookmark className="h-4 w-4" />
                          </Button>

                          {/* Share */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex items-center gap-2 hover:bg-purple-100 dark:hover:bg-purple-900/20"
                          >
                            <Share2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <Eye className="h-4 w-4" />
                            <span>{post.view_count || 0}</span>
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
