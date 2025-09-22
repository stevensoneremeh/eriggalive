
"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import {
  Heart,
  MessageCircle,
  Share2,
  Plus,
  Search,
  Filter,
  TrendingUp,
  Clock,
  Users,
  Image as ImageIcon,
  Send,
  Crown,
  ThumbsUp,
  Eye,
  Hash,
  Calendar,
  Loader2,
  ChevronDown,
  ChevronUp,
  Reply
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"

interface Category {
  id: number
  name: string
  slug: string
  description: string
  color: string
  icon: string
  display_order: number
}

interface User {
  id: string
  username: string
  full_name: string
  avatar_url: string
  tier: string
}

interface Comment {
  id: number
  post_id: string
  user_id: string
  content: string
  like_count: number
  reply_count: number
  parent_comment_id?: number | null
  created_at: string
  user: User
  user_liked: boolean
}

interface Post {
  id: number
  title?: string
  content: string
  media_url?: string
  user_id: string
  category_id: number
  vote_count: number
  comment_count: number
  hashtags: string[]
  created_at: string
  updated_at: string
  user: User
  category: {
    id: number
    name: string
    color: string
    icon: string
  }
  user_voted: boolean
}

export default function CommunityPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [posts, setPosts] = useState<Post[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<string>("newest")
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false)
  const [createPostLoading, setCreatePostLoading] = useState(false)
  const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set())
  const [comments, setComments] = useState<{ [postId: number]: Comment[] }>({})
  const [loadingComments, setLoadingComments] = useState<Set<number>>(new Set())
  const [newComment, setNewComment] = useState<{ [postId: number]: string }>({})
  const [submittingComment, setSubmittingComment] = useState<Set<number>>(new Set())
  
  // Create post form
  const [newPost, setNewPost] = useState({
    title: "",
    content: "",
    category_id: 1,
    hashtags: "",
    media_url: "",
    media_type: ""
  })
  const [uploadingImage, setUploadingImage] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load categories
      const categoriesResponse = await fetch("/api/community/categories")
      const categoriesData = await categoriesResponse.json()
      
      if (categoriesData.success) {
        setCategories(categoriesData.categories)
      }

      // Load posts
      const postsResponse = await fetch("/api/community/posts")
      const postsData = await postsResponse.json()
      
      if (postsData.success) {
        setPosts(postsData.posts)
      }
    } catch (error) {
      console.error("Error loading community data:", error)
      toast({
        title: "Error",
        description: "Failed to load community data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setUploadingImage(true)
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/profile/upload-image', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (data.success) {
        setNewPost({
          ...newPost,
          media_url: data.imageUrl,
          media_type: 'image'
        })
        toast({
          title: "Image Uploaded",
          description: "Your image has been uploaded successfully"
        })
      } else {
        throw new Error(data.error || "Failed to upload image")
      }
    } catch (error: any) {
      toast({
        title: "Upload Error",
        description: error.message || "Failed to upload image",
        variant: "destructive"
      })
    } finally {
      setUploadingImage(false)
    }
  }

  const createPost = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to create a post",
        variant: "destructive"
      })
      return
    }

    if (!newPost.content.trim()) {
      toast({
        title: "Content Required",
        description: "Please enter some content for your post",
        variant: "destructive"
      })
      return
    }

    try {
      setCreatePostLoading(true)
      
      const hashtags = newPost.hashtags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)

      const response = await fetch("/api/community/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: newPost.title || null,
          content: newPost.content,
          category_id: newPost.category_id,
          hashtags,
          media_url: newPost.media_url || null,
          media_type: newPost.media_type || null
        })
      })

      const data = await response.json()

      if (data.success) {
        setPosts(prevPosts => [data.post, ...prevPosts])
        setNewPost({ title: "", content: "", category_id: 1, hashtags: "", media_url: "", media_type: "" })
        setIsCreatePostOpen(false)
        
        toast({
          title: "Success!",
          description: "Your post has been created successfully"
        })
      } else {
        throw new Error(data.error || "Failed to create post")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create post",
        variant: "destructive"
      })
    } finally {
      setCreatePostLoading(false)
    }
  }

  const toggleVote = async (postId: number) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to vote on posts",
        variant: "destructive"
      })
      return
    }

    try {
      const response = await fetch(`/api/community/posts/${postId}/vote`, {
        method: "POST"
      })

      const data = await response.json()

      if (data.success) {
        setPosts(prevPosts => 
          prevPosts.map(post => 
            post.id === postId 
              ? { 
                  ...post, 
                  user_voted: data.voted, 
                  vote_count: data.voteCount 
                }
              : post
          )
        )
      }
    } catch (error) {
      console.error("Error toggling vote:", error)
    }
  }

  const loadComments = async (postId: number) => {
    if (loadingComments.has(postId)) return
    
    setLoadingComments(prev => new Set([...prev, postId]))
    
    try {
      const response = await fetch(`/api/community/posts/${postId}/comments`)
      const data = await response.json()
      
      if (data.success) {
        setComments(prev => ({
          ...prev,
          [postId]: data.comments
        }))
      }
    } catch (error) {
      console.error("Error loading comments:", error)
    } finally {
      setLoadingComments(prev => {
        const newSet = new Set(prev)
        newSet.delete(postId)
        return newSet
      })
    }
  }

  const toggleComments = async (postId: number) => {
    if (expandedComments.has(postId)) {
      setExpandedComments(prev => {
        const newSet = new Set(prev)
        newSet.delete(postId)
        return newSet
      })
    } else {
      setExpandedComments(prev => new Set([...prev, postId]))
      if (!comments[postId]) {
        await loadComments(postId)
      }
    }
  }

  const submitComment = async (postId: number) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to comment",
        variant: "destructive"
      })
      return
    }

    const content = newComment[postId]?.trim()
    if (!content) {
      toast({
        title: "Content Required",
        description: "Please enter a comment",
        variant: "destructive"
      })
      return
    }

    setSubmittingComment(prev => new Set([...prev, postId]))

    try {
      const response = await fetch(`/api/community/posts/${postId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ content })
      })

      const data = await response.json()

      if (data.success) {
        setComments(prev => ({
          ...prev,
          [postId]: [data.comment, ...(prev[postId] || [])]
        }))
        
        setNewComment(prev => ({
          ...prev,
          [postId]: ""
        }))

        // Update post comment count
        setPosts(prevPosts => 
          prevPosts.map(post => 
            post.id === postId 
              ? { ...post, comment_count: post.comment_count + 1 }
              : post
          )
        )

        toast({
          title: "Comment Posted!",
          description: "Your comment has been added successfully"
        })
      } else {
        throw new Error(data.error || "Failed to post comment")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to post comment",
        variant: "destructive"
      })
    } finally {
      setSubmittingComment(prev => {
        const newSet = new Set(prev)
        newSet.delete(postId)
        return newSet
      })
    }
  }

  const toggleCommentLike = async (postId: number, commentId: number) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to like comments",
        variant: "destructive"
      })
      return
    }

    try {
      const response = await fetch(`/api/community/posts/${postId}/comments/${commentId}/like`, {
        method: "POST"
      })

      const data = await response.json()

      if (data.success) {
        setComments(prev => ({
          ...prev,
          [postId]: prev[postId]?.map(comment => 
            comment.id === commentId 
              ? { 
                  ...comment, 
                  user_liked: data.liked, 
                  like_count: data.likeCount 
                }
              : comment
          ) || []
        }))
      }
    } catch (error) {
      console.error("Error toggling comment like:", error)
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case "erigga_citizen":
        return "bg-green-100 text-green-800 border-green-200"
      case "erigga_indigen":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "enterprise":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getTierDisplayName = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case "erigga_citizen":
        return "Erigga Citizen"
      case "erigga_indigen":
        return "Erigga Indigen"
      case "enterprise":
        return "Enterprise"
      default:
        return "Erigga Citizen"
    }
  }

  const filteredPosts = posts
    .filter(post => {
      if (selectedCategory !== "all" && post.category_id !== parseInt(selectedCategory)) {
        return false
      }
      if (searchQuery && !post.content.toLowerCase().includes(searchQuery.toLowerCase()) && 
          !post.title?.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case "most_liked":
          return b.vote_count - a.vote_count
        case "most_commented":
          return b.comment_count - a.comment_count
        case "newest":
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="flex items-center space-x-2 text-white">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="text-lg">Loading community...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-black/80 via-gray-900/80 to-black/80 backdrop-blur-md border-b border-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <motion.h1
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl font-bold bg-gradient-to-r from-purple-500 via-pink-400 to-red-500 bg-clip-text text-transparent mb-4"
            >
              Erigga Community
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-gray-300"
            >
              Connect with fellow fans, share your thoughts, and be part of the movement
            </motion.p>
          </div>

          {/* Actions and Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6"
          >
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search posts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-800/50 border-gray-700 text-white placeholder-gray-400"
                />
              </div>

              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48 bg-gray-800/50 border-gray-700 text-white">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="all" className="text-white hover:bg-gray-700">
                    All Categories
                  </SelectItem>
                  {categories.map(category => (
                    <SelectItem 
                      key={category.id} 
                      value={category.id.toString()}
                      className="text-white hover:bg-gray-700"
                    >
                      <span className="flex items-center gap-2">
                        <span>{category.icon}</span>
                        {category.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48 bg-gray-800/50 border-gray-700 text-white">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="newest" className="text-white hover:bg-gray-700">
                    <span className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Newest First
                    </span>
                  </SelectItem>
                  <SelectItem value="oldest" className="text-white hover:bg-gray-700">Oldest First</SelectItem>
                  <SelectItem value="most_liked" className="text-white hover:bg-gray-700">
                    <span className="flex items-center gap-2">
                      <ThumbsUp className="h-4 w-4" />
                      Most Liked
                    </span>
                  </SelectItem>
                  <SelectItem value="most_commented" className="text-white hover:bg-gray-700">
                    <span className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      Most Discussed
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Dialog open={isCreatePostOpen} onOpenChange={setIsCreatePostOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Post
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-800 border-gray-700 text-white">
                <DialogHeader>
                  <DialogTitle>Create New Post</DialogTitle>
                  <DialogDescription className="text-gray-400">
                    Share your thoughts with the Erigga community
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select 
                      value={newPost.category_id.toString()} 
                      onValueChange={(value) => setNewPost({...newPost, category_id: parseInt(value)})}
                    >
                      <SelectTrigger className="bg-gray-700 border-gray-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-700 border-gray-600">
                        {categories.map(category => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            <span className="flex items-center gap-2">
                              <span>{category.icon}</span>
                              {category.name}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="title">Title (Optional)</Label>
                    <Input
                      id="title"
                      placeholder="Enter post title..."
                      value={newPost.title}
                      onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>

                  <div>
                    <Label htmlFor="content">Content *</Label>
                    <Textarea
                      id="content"
                      placeholder="What's on your mind?"
                      value={newPost.content}
                      onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                      className="bg-gray-700 border-gray-600 text-white min-h-[100px]"
                    />
                  </div>

                  <div>
                    <Label htmlFor="hashtags">Hashtags</Label>
                    <Input
                      id="hashtags"
                      placeholder="erigga, music, paperboi (comma separated)"
                      value={newPost.hashtags}
                      onChange={(e) => setNewPost({...newPost, hashtags: e.target.value})}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>

                  <div>
                    <Label htmlFor="image">Add Image (Optional)</Label>
                    <Input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                    {uploadingImage && (
                      <div className="flex items-center mt-2 text-sm text-gray-400">
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Uploading image...
                      </div>
                    )}
                    {newPost.media_url && (
                      <div className="mt-2">
                        <img 
                          src={newPost.media_url} 
                          alt="Preview" 
                          className="w-32 h-32 object-cover rounded-lg"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsCreatePostOpen(false)}
                      disabled={createPostLoading}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={createPost}
                      disabled={createPostLoading || !newPost.content.trim()}
                      className="bg-gradient-to-r from-purple-600 to-pink-600"
                    >
                      {createPostLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Create Post
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </motion.div>

          {/* Category Pills */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex flex-wrap gap-2 justify-center"
          >
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("all")}
              className={selectedCategory === "all" ? "bg-purple-600 hover:bg-purple-700" : "border-gray-600 text-gray-300 hover:bg-gray-700"}
            >
              All Posts
            </Button>
            {categories.map(category => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id.toString() ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id.toString())}
                className={
                  selectedCategory === category.id.toString() 
                    ? "bg-purple-600 hover:bg-purple-700" 
                    : "border-gray-600 text-gray-300 hover:bg-gray-700"
                }
                style={{
                  backgroundColor: selectedCategory === category.id.toString() ? category.color : 'transparent',
                  borderColor: category.color
                }}
              >
                <span className="mr-1">{category.icon}</span>
                {category.name}
              </Button>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Posts Feed */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <AnimatePresence>
            {filteredPosts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-12"
              >
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center">
                  <Users className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No posts found</h3>
                <p className="text-gray-400 mb-6">
                  {searchQuery ? "Try adjusting your search" : "Be the first to start a conversation!"}
                </p>
                <Button
                  onClick={() => setIsCreatePostOpen(true)}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Post
                </Button>
              </motion.div>
            ) : (
              <div className="space-y-6">
                {filteredPosts.map((post, index) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-all duration-300">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={post.user.avatar_url} alt={post.user.username} />
                              <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                                {post.user.username.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-semibold text-white">{post.user.full_name}</span>
                                <span className="text-gray-400">@{post.user.username}</span>
                                <Badge className={getTierColor(post.user.tier)} variant="outline">
                                  <Crown className="h-3 w-3 mr-1" />
                                  {getTierDisplayName(post.user.tier)}
                                </Badge>
                              </div>
                              <div className="flex items-center space-x-2 text-sm text-gray-400">
                                <Badge 
                                  variant="outline" 
                                  style={{ borderColor: post.category.color, color: post.category.color }}
                                  className="bg-transparent"
                                >
                                  <span className="mr-1">{post.category.icon}</span>
                                  {post.category.name}
                                </Badge>
                                <span>•</span>
                                <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        {post.title && (
                          <h3 className="text-xl font-semibold text-white">{post.title}</h3>
                        )}
                        
                        <p className="text-gray-300 whitespace-pre-wrap">{post.content}</p>

                        {post.media_url && (
                          <div className="rounded-lg overflow-hidden">
                            <img 
                              src={post.media_url} 
                              alt="Post media"
                              className="w-full max-h-96 object-cover"
                            />
                          </div>
                        )}

                        {post.hashtags.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {post.hashtags.map((hashtag, index) => (
                              <Badge key={index} variant="secondary" className="bg-gray-700 text-gray-300">
                                <Hash className="h-3 w-3 mr-1" />
                                {hashtag}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {/* Post Actions */}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                          <div className="flex items-center space-x-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleVote(post.id)}
                              className={`flex items-center space-x-2 ${
                                post.user_voted 
                                  ? "text-red-500 hover:text-red-400" 
                                  : "text-gray-400 hover:text-red-400"
                              }`}
                            >
                              <Heart className={`h-4 w-4 ${post.user_voted ? 'fill-current' : ''}`} />
                              <span>{post.vote_count}</span>
                            </Button>

                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="flex items-center space-x-2 text-gray-400 hover:text-blue-400"
                              onClick={() => toggleComments(post.id)}
                            >
                              <MessageCircle className="h-4 w-4" />
                              <span>{post.comment_count}</span>
                              {expandedComments.has(post.id) ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>

                            <Button variant="ghost" size="sm" className="flex items-center space-x-2 text-gray-400 hover:text-green-400">
                              <Share2 className="h-4 w-4" />
                              <span>Share</span>
                            </Button>
                          </div>

                          <div className="flex items-center text-sm text-gray-500">
                            <Eye className="h-4 w-4 mr-1" />
                            <span>{Math.floor(Math.random() * 1000) + 50} views</span>
                          </div>
                        </div>

                        {/* Comments Section */}
                        <AnimatePresence>
                          {expandedComments.has(post.id) && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="border-t border-gray-700 pt-4 space-y-4"
                            >
                              {/* Add Comment Form */}
                              {user && (
                                <div className="flex space-x-3">
                                  <Avatar className="h-8 w-8 flex-shrink-0">
                                    <AvatarImage src={user.user_metadata?.avatar_url} alt="You" />
                                    <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm">
                                      {user.email?.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 space-y-2">
                                    <Textarea
                                      placeholder="Write a comment..."
                                      value={newComment[post.id] || ""}
                                      onChange={(e) => setNewComment(prev => ({
                                        ...prev,
                                        [post.id]: e.target.value
                                      }))}
                                      className="bg-gray-700 border-gray-600 text-white min-h-[80px] resize-none"
                                    />
                                    <div className="flex justify-end">
                                      <Button
                                        size="sm"
                                        onClick={() => submitComment(post.id)}
                                        disabled={!newComment[post.id]?.trim() || submittingComment.has(post.id)}
                                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                                      >
                                        {submittingComment.has(post.id) ? (
                                          <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Posting...
                                          </>
                                        ) : (
                                          <>
                                            <Send className="h-4 w-4 mr-2" />
                                            Comment
                                          </>
                                        )}
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Comments List */}
                              {loadingComments.has(post.id) ? (
                                <div className="flex items-center justify-center py-4">
                                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                                  <span className="ml-2 text-gray-400">Loading comments...</span>
                                </div>
                              ) : comments[post.id] && comments[post.id].length > 0 ? (
                                <div className="space-y-4">
                                  {comments[post.id].map((comment) => (
                                    <div key={comment.id} className="flex space-x-3">
                                      <Avatar className="h-8 w-8 flex-shrink-0">
                                        <AvatarImage src={comment.user.avatar_url} alt={comment.user.username} />
                                        <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm">
                                          {comment.user.username.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="flex-1">
                                        <div className="bg-gray-700 rounded-lg p-3">
                                          <div className="flex items-center space-x-2 mb-1">
                                            <span className="font-medium text-white text-sm">{comment.user.full_name}</span>
                                            <span className="text-gray-400 text-xs">@{comment.user.username}</span>
                                            <Badge className={getTierColor(comment.user.tier)} variant="outline">
                                              <Crown className="h-2 w-2 mr-1" />
                                              {getTierDisplayName(comment.user.tier)}
                                            </Badge>
                                            <span className="text-gray-500 text-xs">
                                              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                            </span>
                                          </div>
                                          <p className="text-gray-300 text-sm">{comment.content}</p>
                                        </div>
                                        
                                        <div className="flex items-center space-x-4 mt-2">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => toggleCommentLike(post.id, comment.id)}
                                            className={`flex items-center space-x-1 text-xs ${
                                              comment.user_liked 
                                                ? "text-red-500 hover:text-red-400" 
                                                : "text-gray-400 hover:text-red-400"
                                            }`}
                                          >
                                            <Heart className={`h-3 w-3 ${comment.user_liked ? 'fill-current' : ''}`} />
                                            <span>{comment.like_count}</span>
                                          </Button>
                                          
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="flex items-center space-x-1 text-xs text-gray-400 hover:text-blue-400"
                                          >
                                            <Reply className="h-3 w-3" />
                                            <span>Reply</span>
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-6 text-gray-400">
                                  <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                  <p>No comments yet. Be the first to comment!</p>
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
