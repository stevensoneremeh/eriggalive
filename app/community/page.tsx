
"use client"

import { Suspense, useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Heart, MessageCircle, Share2, MoreHorizontal, Plus, TrendingUp, Users, Hash, Upload, X, Play, Pause } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"
import type { Database } from "@/types/database"

type CommunityPost = {
  id: number
  content: string
  created_at: string
  vote_count: number
  comment_count: number
  view_count: number
  media_url?: string
  media_type?: string
  user: {
    id: string
    username: string
    full_name: string
    avatar_url?: string
    tier: string
  }
  category: {
    id: number
    name: string
    slug: string
  }
  has_voted: boolean
}

type Category = {
  id: number
  name: string
  slug: string
  description?: string
  is_active: boolean
}

type UserProfile = {
  id: string
  username: string
  full_name: string
  avatar_url?: string
  tier: string
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-300 rounded-full" />
              <div className="space-y-2">
                <div className="h-4 bg-gray-300 rounded w-24" />
                <div className="h-3 bg-gray-300 rounded w-16" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="h-4 bg-gray-300 rounded w-full" />
              <div className="h-4 bg-gray-300 rounded w-3/4" />
              <div className="flex space-x-4">
                <div className="h-8 bg-gray-300 rounded w-16" />
                <div className="h-8 bg-gray-300 rounded w-16" />
                <div className="h-8 bg-gray-300 rounded w-16" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function MediaPlayer({ mediaUrl, mediaType }: { mediaUrl: string; mediaType: string }) {
  const [isPlaying, setIsPlaying] = useState(false)

  if (mediaType === "image") {
    return (
      <div className="mb-4 rounded-lg overflow-hidden">
        <img src={mediaUrl} alt="Post media" className="w-full h-auto max-h-96 object-cover" />
      </div>
    )
  }

  if (mediaType === "video") {
    return (
      <div className="mb-4 rounded-lg overflow-hidden">
        <video controls className="w-full h-auto max-h-96">
          <source src={mediaUrl} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
    )
  }

  if (mediaType === "audio") {
    return (
      <div className="mb-4 p-4 bg-gray-100 rounded-lg">
        <audio controls className="w-full">
          <source src={mediaUrl} type="audio/mpeg" />
          Your browser does not support the audio tag.
        </audio>
      </div>
    )
  }

  return null
}

function PostCard({ post, onVote }: { post: CommunityPost; onVote: (postId: number) => void }) {
  const getTierColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case "blood": return "bg-red-500"
      case "pioneer": return "bg-blue-500"
      case "grassroot": return "bg-green-500"
      default: return "bg-gray-500"
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={post.user.avatar_url || "/placeholder-user.jpg"} />
              <AvatarFallback>{post.user.username.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-sm">{post.user.username}</span>
                <Badge className={`${getTierColor(post.user.tier)} text-white text-xs px-2 py-0.5`}>
                  {post.user.tier}
                </Badge>
              </div>
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <span>{post.category.name}</span>
                <span>•</span>
                <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-gray-800 mb-4 whitespace-pre-wrap">{post.content}</p>
        
        {post.media_url && post.media_type && (
          <MediaPlayer mediaUrl={post.media_url} mediaType={post.media_type} />
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant={post.has_voted ? "default" : "ghost"}
              size="sm"
              onClick={() => onVote(post.id)}
              className="flex items-center space-x-1"
            >
              <Heart className={`w-4 h-4 ${post.has_voted ? "fill-current" : ""}`} />
              <span>{post.vote_count}</span>
            </Button>
            <Button variant="ghost" size="sm" className="flex items-center space-x-1">
              <MessageCircle className="w-4 h-4" />
              <span>{post.comment_count}</span>
            </Button>
            <Button variant="ghost" size="sm" className="flex items-center space-x-1">
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
          <span className="text-xs text-gray-500">{post.view_count} views</span>
        </div>
      </CardContent>
    </Card>
  )
}

function CreatePostDialog({ 
  categories, 
  onPostCreated, 
  userProfile 
}: { 
  categories: Category[]
  onPostCreated: () => void
  userProfile: UserProfile
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [content, setContent] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [mediaPreview, setMediaPreview] = useState<string | null>(null)
  const [mediaType, setMediaType] = useState<string | null>(null)
  const supabase = createClientComponentClient<Database>()

  const validateContent = (text: string): boolean => {
    // Check for URLs
    const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/gi
    if (urlRegex.test(text)) {
      toast.error("Posts cannot contain external links or URLs")
      return false
    }
    return true
  }

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const supportedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/webm', 'video/ogg',
      'audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/ogg'
    ]

    if (!supportedTypes.includes(file.type)) {
      toast.error("Unsupported file type. Please use images (JPG, PNG, GIF, WebP), videos (MP4, WebM, OGG), or audio (MP3, WAV, OGG)")
      return
    }

    // Check file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      toast.error("File too large. Please choose a file smaller than 50MB")
      return
    }

    setMediaFile(file)
    
    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setMediaPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Set media type
    if (file.type.startsWith('image/')) setMediaType('image')
    else if (file.type.startsWith('video/')) setMediaType('video')
    else if (file.type.startsWith('audio/')) setMediaType('audio')
  }

  const removeMedia = () => {
    setMediaFile(null)
    setMediaPreview(null)
    setMediaType(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!content.trim() && !mediaFile) {
      toast.error("Please add some content or upload media")
      return
    }

    if (!selectedCategory) {
      toast.error("Please select a category")
      return
    }

    if (content.trim() && !validateContent(content)) {
      return
    }

    setIsSubmitting(true)

    try {
      let mediaUrl = null
      let uploadedMediaType = null

      // Upload media if present
      if (mediaFile) {
        const fileExt = mediaFile.name.split('.').pop()
        const fileName = `${userProfile.id}-${Date.now()}.${fileExt}`
        const filePath = `community_media/${fileName}`

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('eriggalive-assets')
          .upload(filePath, mediaFile)

        if (uploadError) {
          console.error('Upload error:', uploadError)
          toast.error("Failed to upload media. Please try again.")
          return
        }

        const { data: { publicUrl } } = supabase.storage
          .from('eriggalive-assets')
          .getPublicUrl(uploadData.path)

        mediaUrl = publicUrl
        uploadedMediaType = mediaType
      }

      // Create post
      const { data: newPost, error: postError } = await supabase
        .from('community_posts')
        .insert({
          user_id: userProfile.id,
          category_id: parseInt(selectedCategory),
          content: content.trim(),
          media_url: mediaUrl,
          media_type: uploadedMediaType,
          is_published: true,
          is_deleted: false
        })
        .select(`
          *,
          user:user_profiles!community_posts_user_id_fkey(id, username, full_name, avatar_url, tier),
          category:community_categories!community_posts_category_id_fkey(id, name, slug)
        `)
        .single()

      if (postError) {
        console.error('Post creation error:', postError)
        toast.error("Failed to create post. Please try again.")
        return
      }

      toast.success("Post created successfully!")
      setContent("")
      setSelectedCategory("")
      removeMedia()
      setIsOpen(false)
      onPostCreated()

    } catch (error) {
      console.error('Error creating post:', error)
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Create Post
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Post</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <Avatar className="w-10 h-10">
              <AvatarImage src={userProfile.avatar_url || "/placeholder-user.jpg"} />
              <AvatarFallback>{userProfile.username.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-sm">{userProfile.username}</p>
              <p className="text-xs text-gray-500">Posting as {userProfile.tier}</p>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Category</label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory} required>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Content</label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind? (No external links allowed)"
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Media Upload */}
          <div>
            <label className="text-sm font-medium mb-2 block">Media (Optional)</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              {!mediaFile ? (
                <div className="text-center">
                  <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 mb-2">Upload an image, video, or audio file</p>
                  <Input
                    type="file"
                    accept="image/*,video/*,audio/*"
                    onChange={handleMediaChange}
                    className="hidden"
                    id="media-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('media-upload')?.click()}
                  >
                    Choose File
                  </Button>
                  <p className="text-xs text-gray-500 mt-2">Max 50MB • JPG, PNG, GIF, WebP, MP4, WebM, OGG, MP3, WAV</p>
                </div>
              ) : (
                <div className="relative">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 z-10"
                    onClick={removeMedia}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  
                  {mediaType === 'image' && mediaPreview && (
                    <img src={mediaPreview} alt="Preview" className="w-full h-auto max-h-64 object-cover rounded" />
                  )}
                  
                  {mediaType === 'video' && mediaPreview && (
                    <video src={mediaPreview} controls className="w-full h-auto max-h-64 rounded" />
                  )}
                  
                  {mediaType === 'audio' && (
                    <div className="p-4 bg-gray-100 rounded text-center">
                      <p className="text-sm font-medium mb-2">{mediaFile.name}</p>
                      {mediaPreview && <audio src={mediaPreview} controls className="w-full" />}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Posting..." : "Post"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function TrendingSidebar() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <TrendingUp className="w-5 h-5 mr-2" />
            Trending Topics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {["#EriggaLive", "#NewMusic", "#Community", "#Bars", "#Nigeria"].map((tag, index) => (
              <div key={tag} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Hash className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">{tag}</span>
                </div>
                <span className="text-sm text-gray-500">{(5 - index) * 2}k posts</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Users className="w-5 h-5 mr-2" />
            Top Contributors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { username: "eriggaofficial", votes: 2500, tier: "blood" },
              { username: "warriking", votes: 1800, tier: "pioneer" },
              { username: "southsouth", votes: 1200, tier: "grassroot" },
            ].map((user, index) => (
              <div key={user.username} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                  <Avatar className="w-8 h-8">
                    <AvatarImage src="/placeholder-user.jpg" />
                    <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium text-sm">{user.username}</div>
                    <div className="text-xs text-gray-500">{user.votes} votes</div>
                  </div>
                </div>
                <Badge className={`${user.tier === "blood" ? "bg-red-500" : user.tier === "pioneer" ? "bg-blue-500" : "bg-green-500"} text-white text-xs`}>
                  {user.tier}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function CommunityPage() {
  const { user } = useAuth()
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [sortBy, setSortBy] = useState("newest")
  const supabase = createClientComponentClient<Database>()

  const loadUserProfile = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      if (error) {
        console.error("Error loading user profile:", error)
        return
      }

      setUserProfile(data)
    } catch (error) {
      console.error("Error loading user profile:", error)
    }
  }

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("community_categories")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true })

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error("Error loading categories:", error)
      // Set default categories as fallback
      setCategories([
        { id: 1, name: "General", slug: "general", is_active: true },
        { id: 2, name: "Bars", slug: "bars", is_active: true },
        { id: 3, name: "Discussion", slug: "discussion", is_active: true },
      ])
    }
  }

  const getSamplePosts = (): CommunityPost[] => [
    {
      id: 1,
      content: "Welcome to the Erigga community! 🎵 Share your bars, stories, and connect with fellow fans. This is where real music lovers gather!",
      created_at: new Date().toISOString(),
      vote_count: 12,
      comment_count: 5,
      view_count: 45,
      user: {
        id: "sample-1",
        username: "eriggaofficial",
        full_name: "Erigga",
        avatar_url: "/placeholder-user.jpg",
        tier: "blood",
      },
      category: {
        id: 1,
        name: "General",
        slug: "general",
      },
      has_voted: false,
    },
    {
      id: 2,
      content: "Just dropped some fire bars 🔥\n\n*They say I'm the king of my city*\n*But I tell them I'm just getting started*\n*Paper boy flow, now I'm paper rich*\n*From the streets to the studio, never departed*",
      created_at: new Date(Date.now() - 3600000).toISOString(),
      vote_count: 8,
      comment_count: 3,
      view_count: 28,
      user: {
        id: "sample-2",
        username: "warriking",
        full_name: "Warri King",
        avatar_url: "/placeholder-user.jpg",
        tier: "pioneer",
      },
      category: {
        id: 2,
        name: "Bars",
        slug: "bars",
      },
      has_voted: false,
    }
  ]

  const loadPosts = async () => {
    try {
      setLoading(true)

      let query = supabase
        .from("community_posts")
        .select(`
          *,
          user:user_profiles!community_posts_user_id_fkey(id, username, full_name, avatar_url, tier),
          category:community_categories!community_posts_category_id_fkey(id, name, slug)
        `)
        .eq("is_published", true)
        .eq("is_deleted", false)

      if (selectedCategory !== "all") {
        query = query.eq("category_id", parseInt(selectedCategory))
      }

      // Apply sorting
      if (sortBy === "newest") {
        query = query.order("created_at", { ascending: false })
      } else if (sortBy === "oldest") {
        query = query.order("created_at", { ascending: true })
      } else if (sortBy === "top") {
        query = query.order("vote_count", { ascending: false })
      }

      query = query.limit(20)

      const { data, error } = await query

      if (error) {
        console.error("Error loading posts:", error)
        setPosts(getSamplePosts())
        return
      }

      if (!data || data.length === 0) {
        setPosts(getSamplePosts())
      } else {
        setPosts(data as CommunityPost[])
      }
    } catch (error) {
      console.error("Error loading posts:", error)
      setPosts(getSamplePosts())
    } finally {
      setLoading(false)
    }
  }

  const handleVote = async (postId: number) => {
    if (!user || !userProfile) {
      toast.error("Please log in to vote")
      return
    }

    try {
      const response = await fetch("/api/community/posts/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      })

      const result = await response.json()

      if (result.success) {
        // Update the post optimistically
        setPosts(prevPosts =>
          prevPosts.map(post =>
            post.id === postId
              ? {
                  ...post,
                  vote_count: result.voted ? post.vote_count + 1 : post.vote_count - 1,
                  has_voted: result.voted,
                }
              : post
          )
        )
        toast.success(result.message || "Vote recorded!")
      } else {
        toast.error(result.error || "Failed to vote")
      }
    } catch (error) {
      console.error("Error voting:", error)
      toast.error("Failed to vote")
    }
  }

  useEffect(() => {
    loadCategories()
  }, [])

  useEffect(() => {
    if (user) {
      loadUserProfile()
    }
  }, [user])

  useEffect(() => {
    loadPosts()
  }, [selectedCategory, sortBy])

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Join the Community</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Please log in to access the community and interact with other fans.
            </p>
            <Button className="w-full" onClick={() => window.location.href = "/login?redirect=/community"}>
              Log In
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Community</h1>
              <p className="text-gray-600">Connect with fellow Erigga fans and share your passion for music</p>
            </div>

            {/* Create Post */}
            {categories.length > 0 && userProfile && (
              <div className="mb-6">
                <CreatePostDialog 
                  categories={categories} 
                  onPostCreated={loadPosts} 
                  userProfile={userProfile}
                />
              </div>
            )}

            {/* Filters */}
            <div className="mb-6">
              <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="all">All</TabsTrigger>
                  {categories.slice(0, 3).map((category) => (
                    <TabsTrigger key={category.id} value={category.id.toString()}>
                      {category.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>

              <div className="mt-4 flex items-center justify-between">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="oldest">Oldest</SelectItem>
                    <SelectItem value="top">Most Voted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Posts Feed */}
            <Suspense fallback={<LoadingSkeleton />}>
              {loading ? (
                <LoadingSkeleton />
              ) : (
                <div className="space-y-6">
                  {posts.map((post) => (
                    <PostCard key={post.id} post={post} onVote={handleVote} />
                  ))}
                  {posts.length === 0 && (
                    <Card>
                      <CardContent className="text-center py-12">
                        <p className="text-gray-500 mb-4">No posts found</p>
                        <p className="text-sm text-gray-400">
                          Be the first to start a conversation in this category!
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </Suspense>
          </div>

          {/* Sidebar */}
          <div className="hidden lg:block">
            <TrendingSidebar />
          </div>
        </div>
      </div>
    </div>
  )
}
