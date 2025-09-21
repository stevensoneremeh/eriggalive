"use client"

import { useState, useEffect } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CreatePost } from "@/components/create-post"
import { UserTierBadge } from "@/components/user-tier-badge"
import { VoteButtons } from "@/components/vote-buttons"
import { MessageCircle, TrendingUp, Clock, Users, Hash, Filter, RefreshCw } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import { formatDistanceToNow } from "date-fns"
import type { CommunityPost, CommunityCategory } from "@/types/database"

interface PostWithUser extends CommunityPost {
  user: {
    id: string
    username: string
    full_name: string
    avatar_url?: string
    tier: string
  }
  category: {
    id: string
    name: string
    color: string
    icon: string
  }
}

export default function CommunityPage() {
  const { user } = useAuth()
  const [posts, setPosts] = useState<PostWithUser[]>([])
  const [categories, setCategories] = useState<CommunityCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<"recent" | "popular">("recent")

  const loadCategories = async () => {
    try {
      const response = await fetch("/api/community/categories")
      const data = await response.json()

      if (data.categories) {
        setCategories(data.categories)
      }
    } catch (error) {
      console.error("Error loading categories:", error)
      toast.error("Failed to load categories")
    }
  }

  const loadPosts = async (categoryId?: string) => {
    try {
      setLoading(true)
      const params = new URLSearchParams()

      if (categoryId) {
        params.append("category", categoryId)
      }

      const response = await fetch(`/api/community/posts?${params}`)
      const data = await response.json()

      if (response.ok && data.posts) {
        const sortedPosts = [...data.posts]

        if (sortBy === "popular") {
          sortedPosts.sort((a, b) => b.vote_count - a.vote_count)
        } else {
          sortedPosts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        }

        setPosts(sortedPosts)
      } else {
        toast.error("Failed to load posts")
      }
    } catch (error) {
      console.error("Error loading posts:", error)
      toast.error("Failed to load posts")
    } finally {
      setLoading(false)
    }
  }

  const handleVote = async (postId: string) => {
    if (!user) {
      toast.error("Please log in to vote")
      return
    }

    try {
      const response = await fetch(`/api/community/posts/${postId}/vote`, {
        method: "POST",
      })

      const data = await response.json()

      if (response.ok) {
        // Update the post in the local state
        setPosts((prev) =>
          prev.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  vote_count: data.vote_count || post.vote_count,
                  user_voted: data.voted,
                }
              : post,
          ),
        )

        toast.success(data.message || "Vote updated")
      } else {
        toast.error(data.error || "Failed to vote")
      }
    } catch (error) {
      console.error("Error voting:", error)
      toast.error("Failed to vote")
    }
  }

  const handlePostCreated = () => {
    loadPosts(selectedCategory || undefined)
  }

  const handleCategoryChange = (categoryId: string | null) => {
    setSelectedCategory(categoryId)
    loadPosts(categoryId || undefined)
  }

  useEffect(() => {
    loadCategories()
    loadPosts()
  }, [sortBy])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Community
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                  Connect, share, and engage with fellow Erigga fans
                </p>
              </div>

              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => loadPosts(selectedCategory || undefined)}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-1">
              <div className="space-y-6">
                {/* Categories */}
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm dark:bg-gray-800/80">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Filter className="h-5 w-5" />
                      Categories
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Button
                        variant={selectedCategory === null ? "default" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => handleCategoryChange(null)}
                      >
                        <Hash className="h-4 w-4 mr-2" />
                        All Posts
                      </Button>
                      {categories.map((category) => (
                        <Button
                          key={category.id}
                          variant={selectedCategory === category.id ? "default" : "ghost"}
                          className="w-full justify-start"
                          onClick={() => handleCategoryChange(category.id)}
                        >
                          <span className="mr-2">{category.icon}</span>
                          {category.name}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Sort Options */}
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm dark:bg-gray-800/80">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Sort By
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Tabs value={sortBy} onValueChange={(value) => setSortBy(value as "recent" | "popular")}>
                      <TabsList className="w-full">
                        <TabsTrigger value="recent" className="flex-1">
                          <Clock className="h-4 w-4 mr-2" />
                          Recent
                        </TabsTrigger>
                        <TabsTrigger value="popular" className="flex-1">
                          <TrendingUp className="h-4 w-4 mr-2" />
                          Popular
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </CardContent>
                </Card>

                {/* Community Stats */}
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm dark:bg-gray-800/80">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Community Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Total Posts</span>
                        <span className="font-semibold">{posts.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Categories</span>
                        <span className="font-semibold">{categories.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Active Users</span>
                        <span className="font-semibold">{new Set(posts.map((p) => p.user.id)).size}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <div className="space-y-6">
                {/* Create Post */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  <CreatePost categories={categories} onPostCreated={handlePostCreated} />
                </motion.div>

                {/* Posts Feed */}
                <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                  ) : posts.length === 0 ? (
                    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm dark:bg-gray-800/80">
                      <CardContent className="text-center py-12">
                        <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No posts yet</h3>
                        <p className="text-gray-600 dark:text-gray-300">
                          {selectedCategory
                            ? "No posts in this category yet. Be the first to share something!"
                            : "Be the first to start a conversation in the community!"}
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <AnimatePresence>
                      {posts.map((post, index) => (
                        <motion.div
                          key={post.id}
                          variants={itemVariants}
                          initial="hidden"
                          animate="visible"
                          exit="hidden"
                          transition={{ delay: index * 0.1 }}
                          whileHover={{ y: -4 }}
                          className="group"
                        >
                          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 hover:shadow-xl transition-all duration-300">
                            <CardContent className="p-6">
                              {/* Post Header */}
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center space-x-3">
                                  <Avatar className="h-10 w-10 ring-2 ring-white shadow-sm">
                                    <AvatarImage
                                      src={post.user.avatar_url || "/placeholder-user.jpg"}
                                      alt={post.user.username}
                                    />
                                    <AvatarFallback className="bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold">
                                      {post.user.full_name?.charAt(0) || post.user.username?.charAt(0) || "U"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <p className="font-semibold text-gray-900 dark:text-white">
                                        {post.user.full_name || post.user.username}
                                      </p>
                                      <UserTierBadge tier={post.user.tier} size="sm" />
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">@{post.user.username}</p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  {post.category && (
                                    <Badge
                                      variant="secondary"
                                      className="text-xs"
                                      style={{
                                        backgroundColor: `${post.category.color}20`,
                                        color: post.category.color,
                                        borderColor: `${post.category.color}40`,
                                      }}
                                    >
                                      <span className="mr-1">{post.category.icon}</span>
                                      {post.category.name}
                                    </Badge>
                                  )}
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                                  </span>
                                </div>
                              </div>

                              {/* Post Title */}
                              {post.title && (
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                  {post.title}
                                </h3>
                              )}

                              {/* Post Content */}
                              <div className="mb-4">
                                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{post.content}</p>

                                {post.media_url && (
                                  <div className="mt-4">
                                    {post.media_type?.startsWith("image") ? (
                                      <img
                                        src={post.media_url || "/placeholder.svg"}
                                        alt="Post media"
                                        className="rounded-lg max-w-full h-auto shadow-md"
                                      />
                                    ) : post.media_type?.startsWith("video") ? (
                                      <video
                                        src={post.media_url}
                                        controls
                                        className="rounded-lg max-w-full h-auto shadow-md"
                                      />
                                    ) : (
                                      <a
                                        href={post.media_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800 underline"
                                      >
                                        View attachment
                                      </a>
                                    )}
                                  </div>
                                )}
                              </div>

                              <Separator className="my-4" />

                              {/* Post Actions */}
                              <div className="flex items-center justify-between">
                                <VoteButtons
                                  postId={post.id}
                                  initialVoteCount={post.vote_count}
                                  initialUserVoted={post.user_voted || false}
                                  onVote={() => handleVote(post.id)}
                                />

                                <div className="flex items-center gap-4">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                                  >
                                    <MessageCircle className="h-4 w-4 mr-1" />
                                    {post.comment_count || 0}
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  )}
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
