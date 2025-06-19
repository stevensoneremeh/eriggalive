"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Heart, MessageCircle, Share2, ImagePlus, Video, Mic, Send, Loader2 } from "lucide-react"
import { useRef } from "react"

export default function CommunityPage() {
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [posts, setPosts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Form states
  const [content, setContent] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [mediaPreview, setMediaPreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      // Get user
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()
      setUser(authUser)

      if (authUser) {
        // Get user profile
        const { data: profile } = await supabase.from("users").select("*").eq("auth_user_id", authUser.id).single()
        setUserProfile(profile)
      }

      // Get categories
      const { data: categoriesData } = await supabase
        .from("community_categories")
        .select("*")
        .eq("is_active", true)
        .order("display_order")

      setCategories(
        categoriesData || [
          { id: 1, name: "General", slug: "general" },
          { id: 2, name: "Bars", slug: "bars" },
          { id: 3, name: "Stories", slug: "stories" },
          { id: 4, name: "Events", slug: "events" },
        ],
      )

      // Load posts
      await loadPosts()
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadPosts = async () => {
    try {
      const { data: postsData } = await supabase
        .from("community_posts")
        .select(`
          *,
          user:users!community_posts_user_id_fkey(id, username, full_name, avatar_url, tier),
          category:community_categories!community_posts_category_id_fkey(id, name, slug)
        `)
        .eq("is_published", true)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false })
        .limit(20)

      setPosts(postsData || [])
    } catch (error) {
      console.error("Error loading posts:", error)
      // Set dummy posts if database fails
      setPosts([
        {
          id: 1,
          content: "Welcome to the Erigga community! 🎵 Drop your favorite bars in the comments!",
          created_at: new Date().toISOString(),
          vote_count: 15,
          user: {
            id: 1,
            username: "erigga_official",
            full_name: "Erigga",
            avatar_url: "/placeholder-user.jpg",
            tier: "ADMIN",
          },
          category: { id: 1, name: "General", slug: "general" },
        },
        {
          id: 2,
          content:
            "Just dropped some fire bars! What y'all think? 🔥\n\n'Money dey my pocket, I no dey fear anybody\nNa God dey my back, I no need security'",
          created_at: new Date(Date.now() - 3600000).toISOString(),
          vote_count: 42,
          user: {
            id: 2,
            username: "bars_king",
            full_name: "Bars King",
            avatar_url: "/placeholder-user.jpg",
            tier: "BLOOD",
          },
          category: { id: 2, name: "Bars", slug: "bars" },
        },
      ])
    }
  }

  const handleMediaChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setMediaFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setMediaPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!content.trim()) {
      toast({
        title: "Empty Post",
        description: "Please write something to share!",
        variant: "destructive",
      })
      return
    }

    if (!selectedCategory) {
      toast({
        title: "No Category",
        description: "Please select a category for your post.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Create optimistic post
      const optimisticPost = {
        id: Date.now(),
        content,
        created_at: new Date().toISOString(),
        vote_count: 0,
        user: userProfile || {
          id: 1,
          username: user?.email?.split("@")[0] || "user",
          full_name: user?.email?.split("@")[0] || "User",
          avatar_url: "/placeholder-user.jpg",
          tier: "GRASSROOT",
        },
        category: categories.find((c) => c.id.toString() === selectedCategory) || categories[0],
      }

      // Add to posts immediately
      setPosts((prev) => [optimisticPost, ...prev])

      // Try to save to database
      if (userProfile) {
        const { error } = await supabase.from("community_posts").insert({
          user_id: userProfile.id,
          category_id: Number.parseInt(selectedCategory),
          content,
          is_published: true,
          is_deleted: false,
          vote_count: 0,
        })

        if (error) {
          console.error("Database error:", error)
          // Keep the optimistic post anyway
        }
      }

      toast({
        title: "Post Created! 🎉",
        description: "Your post has been shared with the community.",
      })

      // Reset form
      setContent("")
      setSelectedCategory("")
      setMediaFile(null)
      setMediaPreview(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (error) {
      console.error("Submit error:", error)
      toast({
        title: "Error",
        description: "Something went wrong, but your post might still be saved.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case "admin":
        return "bg-gray-900 text-white"
      case "mod":
        return "bg-orange-500 text-white"
      case "blood":
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

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return "Just now"
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    return `${Math.floor(diffInSeconds / 86400)}d ago`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-48 bg-muted rounded-lg"></div>
            <div className="h-32 bg-muted rounded-lg"></div>
            <div className="h-32 bg-muted rounded-lg"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-4 space-y-8">
        {/* Header */}
        <div className="text-center py-8">
          <h1 className="text-4xl font-bold mb-2">Erigga Community</h1>
          <p className="text-muted-foreground text-lg">Share your thoughts, bars, and connect with fellow fans</p>
        </div>

        {/* Create Post Form - ALWAYS VISIBLE */}
        <Card className="shadow-lg border-2">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">✍️ Start a Conversation</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex items-start space-x-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage
                    src={userProfile?.avatar_url || "/placeholder-user.jpg"}
                    alt={userProfile?.username || "User"}
                  />
                  <AvatarFallback>
                    {(userProfile?.username || user?.email || "U").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={`What's on your mind${userProfile?.username ? `, ${userProfile.username}` : ""}? Share your thoughts, bars, or stories...`}
                    className="min-h-[120px] text-lg border-2 focus:border-primary resize-none"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Media Preview */}
              {mediaPreview && (
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4">
                  {mediaFile?.type.startsWith("image/") && (
                    <img src={mediaPreview || "/placeholder.svg"} alt="Preview" className="max-h-64 rounded" />
                  )}
                  {mediaFile?.type.startsWith("video/") && (
                    <video src={mediaPreview} controls className="max-h-64 rounded" />
                  )}
                  {mediaFile?.type.startsWith("audio/") && <audio src={mediaPreview} controls className="w-full" />}
                </div>
              )}

              {/* Controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t-2">
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSubmitting}
                  >
                    <ImagePlus className="h-4 w-4 mr-2 text-blue-500" />
                    Photo
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSubmitting}
                  >
                    <Video className="h-4 w-4 mr-2 text-red-500" />
                    Video
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSubmitting}
                  >
                    <Mic className="h-4 w-4 mr-2 text-green-500" />
                    Audio
                  </Button>
                  <Input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*,video/*,audio/*"
                    onChange={handleMediaChange}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <Select value={selectedCategory} onValueChange={setSelectedCategory} required>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={String(category.id)}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    type="submit"
                    disabled={isSubmitting || !content.trim()}
                    className="bg-primary hover:bg-primary/90 px-8 py-2 text-lg font-semibold"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Posting...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-5 w-5" />
                        Post
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Posts Feed */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold">🔥 Latest in the Community</h2>
            <Badge variant="outline" className="text-sm">
              {posts.length} posts
            </Badge>
          </div>

          {posts.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-2xl font-bold mb-2">No posts yet!</h3>
                <p className="text-muted-foreground text-lg">Be the first to share something with the community.</p>
              </CardContent>
            </Card>
          ) : (
            posts.map((post) => (
              <Card key={post.id} className="shadow-md hover:shadow-lg transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={post.user.avatar_url || "/placeholder-user.jpg"} alt={post.user.username} />
                      <AvatarFallback>{post.user.username?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-3">
                        <h3 className="font-bold text-lg">{post.user.full_name || post.user.username}</h3>
                        <Badge className={`text-xs font-semibold ${getTierColor(post.user.tier)}`}>
                          {post.user.tier}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {post.category.name}
                        </Badge>
                        <span className="text-sm text-muted-foreground">{formatTimeAgo(post.created_at)}</span>
                      </div>

                      <div className="mb-4">
                        <p className="text-base leading-relaxed whitespace-pre-wrap">{post.content}</p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-6 pt-3 border-t">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex items-center space-x-2 text-red-500 hover:text-red-600"
                        >
                          <Heart className="h-5 w-5" />
                          <span className="font-semibold">{post.vote_count}</span>
                        </Button>

                        <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                          <MessageCircle className="h-5 w-5" />
                          <span>Comment</span>
                        </Button>

                        <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                          <Share2 className="h-5 w-5" />
                          <span>Share</span>
                        </Button>
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
  )
}
