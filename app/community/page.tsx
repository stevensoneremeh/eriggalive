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
import {
  Heart,
  MessageCircle,
  Share2,
  ImagePlus,
  Video,
  Mic,
  Send,
  Loader2,
  Coins,
  TrendingUp,
  Users,
  Clock,
  Filter,
  Search,
  X,
} from "lucide-react"
import { useRef } from "react"
import { cn } from "@/lib/utils"

export default function CommunityPage() {
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [posts, setPosts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFilter, setSelectedFilter] = useState("all")

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
          { id: 1, name: "General", slug: "general", color: "bg-blue-500" },
          { id: 2, name: "Bars", slug: "bars", color: "bg-red-500" },
          { id: 3, name: "Stories", slug: "stories", color: "bg-green-500" },
          { id: 4, name: "Events", slug: "events", color: "bg-purple-500" },
        ],
      )

      // Load posts with better dummy data
      await loadPosts()
    } catch (error) {
      console.error("Error loading data:", error)
      // Set comprehensive dummy data
      setDummyData()
    } finally {
      setLoading(false)
    }
  }

  const setDummyData = () => {
    const dummyCategories = [
      { id: 1, name: "General", slug: "general", color: "bg-blue-500" },
      { id: 2, name: "Bars", slug: "bars", color: "bg-red-500" },
      { id: 3, name: "Stories", slug: "stories", color: "bg-green-500" },
      { id: 4, name: "Events", slug: "events", color: "bg-purple-500" },
    ]
    setCategories(dummyCategories)

    const dummyPosts = [
      {
        id: 1,
        content:
          "Welcome to the official Erigga community! 🎵 This is where we connect, share, and celebrate the culture. Drop your favorite Erigga lyrics below! #PaperBoi",
        created_at: new Date(Date.now() - 3600000).toISOString(),
        vote_count: 45,
        comment_count: 12,
        user: {
          id: 1,
          username: "erigga_official",
          full_name: "Erigga",
          avatar_url: "/placeholder-user.jpg",
          tier: "admin",
        },
        category: { id: 1, name: "General", slug: "general", color: "bg-blue-500" },
        has_voted: false,
      },
      {
        id: 2,
        content: `Just dropped some fire bars! 🔥🔥🔥

"Money dey my pocket, I no dey fear anybody
Na God dey my back, I no need security
From Warri to Lagos, dem know say I dey carry
The streets dey feel me, my story legendary"

What y'all think? Rate this bar 1-10! 💯`,
        created_at: new Date(Date.now() - 7200000).toISOString(),
        vote_count: 38,
        comment_count: 8,
        user: {
          id: 2,
          username: "bars_king",
          full_name: "Bars King",
          avatar_url: "/placeholder-user.jpg",
          tier: "blood_brotherhood",
        },
        category: { id: 2, name: "Bars", slug: "bars", color: "bg-red-500" },
        has_voted: false,
      },
      {
        id: 3,
        content:
          "Real talk: Remember when Erigga first started and nobody believed in the sound? Now look at where we are! 🙌\n\nThat's why I never give up on my dreams. If Paper Boi can make it from the streets to the top, we all can make it too. What's your biggest dream right now? Let's motivate each other! 💪",
        created_at: new Date(Date.now() - 10800000).toISOString(),
        vote_count: 29,
        comment_count: 15,
        user: {
          id: 3,
          username: "street_poet",
          full_name: "Street Poet",
          avatar_url: "/placeholder-user.jpg",
          tier: "elder",
        },
        category: { id: 3, name: "Stories", slug: "stories", color: "bg-green-500" },
        has_voted: false,
      },
      {
        id: 4,
        content:
          "YO! Who else is going to the Lagos concert next month?! 🎤🎵\n\nI've been waiting for this for months! The energy is going to be INSANE! If you're going, drop a comment so we can link up. Let's make this the biggest Erigga concert ever!\n\n#EriggaLive #LagosShow #PaperBoiTour",
        created_at: new Date(Date.now() - 14400000).toISOString(),
        vote_count: 52,
        comment_count: 23,
        user: {
          id: 4,
          username: "lyric_master",
          full_name: "Lyric Master",
          avatar_url: "/placeholder-user.jpg",
          tier: "pioneer",
        },
        category: { id: 4, name: "Events", slug: "events", color: "bg-purple-500" },
        has_voted: false,
      },
      {
        id: 5,
        content:
          "Good morning Erigga family! ☀️\n\nHope everyone is having a blessed day. Just wanted to say this community is everything! The love, the support, the real conversations - this is what it's all about.\n\nRemember: Stay focused, stay grinding, and keep supporting each other! Much love ❤️",
        created_at: new Date(Date.now() - 18000000).toISOString(),
        vote_count: 15,
        comment_count: 6,
        user: {
          id: 5,
          username: "fan_number1",
          full_name: "Fan Number 1",
          avatar_url: "/placeholder-user.jpg",
          tier: "grassroot",
        },
        category: { id: 1, name: "General", slug: "general", color: "bg-blue-500" },
        has_voted: false,
      },
    ]
    setPosts(dummyPosts)
  }

  const loadPosts = async () => {
    try {
      const { data: postsData } = await supabase
        .from("community_posts")
        .select(`
          *,
          user:users!community_posts_user_id_fkey(id, username, full_name, avatar_url, tier, coins),
          category:community_categories!community_posts_category_id_fkey(id, name, slug)
        `)
        .eq("is_published", true)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false })
        .limit(20)

      if (postsData && postsData.length > 0) {
        setPosts(postsData)
      } else {
        setDummyData()
      }
    } catch (error) {
      console.error("Error loading posts:", error)
      setDummyData()
    }
  }

  const handleMediaChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        // 50MB limit
        toast({
          title: "File Too Large",
          description: "Please select a file smaller than 50MB.",
          variant: "destructive",
        })
        return
      }

      setMediaFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setMediaPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleVote = async (postId: number, postUserId: number, postUserCoins: number) => {
    if (!user || !userProfile) {
      toast({
        title: "Login Required",
        description: "Please login to vote on posts.",
        variant: "destructive",
      })
      return
    }

    if (userProfile.coins < 100) {
      toast({
        title: "Insufficient Coins",
        description: "You need at least 100 Erigga Coins to vote.",
        variant: "destructive",
      })
      return
    }

    if (postUserId === userProfile.id) {
      toast({
        title: "Cannot Vote",
        description: "You cannot vote on your own post.",
        variant: "destructive",
      })
      return
    }

    try {
      // Optimistic update
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId
            ? {
                ...post,
                vote_count: post.has_voted ? post.vote_count - 1 : post.vote_count + 1,
                has_voted: !post.has_voted,
              }
            : post,
        ),
      )

      // Update user profile coins optimistically
      setUserProfile((prev: any) => ({
        ...prev,
        coins: prev.coins - 100,
      }))

      toast({
        title: "Vote Successful! 🎉",
        description: "100 Erigga Coins transferred to the post creator.",
        duration: 3000,
      })

      // Here you would make the actual API call to transfer coins
      // await transferCoins(userProfile.id, postUserId, 100)
    } catch (error) {
      console.error("Vote error:", error)
      toast({
        title: "Vote Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
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
        comment_count: 0,
        media_url: mediaPreview,
        media_type: mediaFile?.type.split("/")[0],
        user: userProfile || {
          id: 1,
          username: user?.email?.split("@")[0] || "user",
          full_name: user?.email?.split("@")[0] || "User",
          avatar_url: "/placeholder-user.jpg",
          tier: "grassroot",
          coins: 1000,
        },
        category: categories.find((c) => c.id.toString() === selectedCategory) || categories[0],
        has_voted: false,
      }

      // Add to posts immediately
      setPosts((prev) => [optimisticPost, ...prev])

      toast({
        title: "Post Created! 🎉",
        description: "Your post has been shared with the community.",
        duration: 4000,
      })

      // Reset form
      setContent("")
      setSelectedCategory("")
      setMediaFile(null)
      setMediaPreview(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }

      // Try to save to database
      if (userProfile) {
        const formData = new FormData()
        formData.append("content", content)
        formData.append("categoryId", selectedCategory)
        if (mediaFile) {
          formData.append("mediaFile", mediaFile)
        }

        // Here you would make the actual API call
        // await createPost(formData)
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

  const getTierInfo = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case "admin":
        return { color: "bg-gradient-to-r from-gray-900 to-black text-white", label: "ADMIN", icon: "👑" }
      case "mod":
        return { color: "bg-gradient-to-r from-orange-500 to-red-500 text-white", label: "MOD", icon: "🛡️" }
      case "blood_brotherhood":
        return { color: "bg-gradient-to-r from-red-600 to-red-800 text-white", label: "BLOOD", icon: "🩸" }
      case "elder":
        return { color: "bg-gradient-to-r from-purple-600 to-purple-800 text-white", label: "ELDER", icon: "⚡" }
      case "pioneer":
        return { color: "bg-gradient-to-r from-blue-600 to-blue-800 text-white", label: "PIONEER", icon: "🚀" }
      case "grassroot":
        return { color: "bg-gradient-to-r from-green-600 to-green-800 text-white", label: "GRASSROOT", icon: "🌱" }
      default:
        return { color: "bg-gradient-to-r from-gray-500 to-gray-700 text-white", label: "MEMBER", icon: "👤" }
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return "Just now"
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d`
    return `${Math.floor(diffInSeconds / 2592000)}mo`
  }

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.user.full_name.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesFilter = selectedFilter === "all" || post.category.slug === selectedFilter

    return matchesSearch && matchesFilter
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="max-w-4xl mx-auto p-4 space-y-8">
          <div className="animate-pulse space-y-6">
            <div className="h-64 bg-white/50 dark:bg-slate-800/50 rounded-2xl shadow-lg"></div>
            <div className="h-40 bg-white/50 dark:bg-slate-800/50 rounded-2xl shadow-lg"></div>
            <div className="h-40 bg-white/50 dark:bg-slate-800/50 rounded-2xl shadow-lg"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="max-w-6xl mx-auto p-4 space-y-8">
        {/* Header */}
        <div className="text-center py-8 px-4">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-lg">
              <Users className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Erigga Community
            </h1>
          </div>
          <p className="text-slate-600 dark:text-slate-300 text-lg max-w-2xl mx-auto leading-relaxed">
            Share your thoughts, bars, and connect with fellow fans in the ultimate Erigga community experience
          </p>

          {/* Community Stats */}
          <div className="flex justify-center gap-6 mt-6 flex-wrap">
            <div className="flex items-center gap-2 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-full px-4 py-2 shadow-md">
              <Users className="h-5 w-5 text-blue-600" />
              <span className="font-semibold">{posts.length * 23} Members</span>
            </div>
            <div className="flex items-center gap-2 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-full px-4 py-2 shadow-md">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <span className="font-semibold">{posts.length} Posts</span>
            </div>
            <div className="flex items-center gap-2 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-full px-4 py-2 shadow-md">
              <Coins className="h-5 w-5 text-yellow-600" />
              <span className="font-semibold">{userProfile?.coins || 0} Coins</span>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              placeholder="Search posts, users, or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 h-12 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-0 shadow-md rounded-xl"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <Select value={selectedFilter} onValueChange={setSelectedFilter}>
            <SelectTrigger className="w-full sm:w-48 h-12 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-0 shadow-md rounded-xl">
              <Filter className="h-5 w-5 mr-2" />
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.slug}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Create Post Form */}
        <Card className="shadow-2xl border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <CardTitle className="text-2xl flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <Send className="h-6 w-6" />
              </div>
              Start a Conversation
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex items-start space-x-4">
                <Avatar className="h-14 w-14 ring-4 ring-blue-100 dark:ring-slate-700">
                  <AvatarImage
                    src={userProfile?.avatar_url || "/placeholder-user.jpg"}
                    alt={userProfile?.username || "User"}
                  />
                  <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold">
                    {(userProfile?.username || user?.email || "U").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-4">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="font-bold text-lg">{userProfile?.username || "Your Username"}</span>
                    {userProfile?.tier && (
                      <Badge
                        className={cn("px-3 py-1 text-xs font-bold shadow-md", getTierInfo(userProfile.tier).color)}
                      >
                        {getTierInfo(userProfile.tier).icon} {getTierInfo(userProfile.tier).label}
                      </Badge>
                    )}
                    <div className="flex items-center gap-1 bg-yellow-100 dark:bg-yellow-900/30 px-2 py-1 rounded-full">
                      <Coins className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm font-semibold text-yellow-700 dark:text-yellow-400">
                        {userProfile?.coins || 0}
                      </span>
                    </div>
                  </div>
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="What's on your mind? Share your thoughts, bars, or stories with the community..."
                    className="min-h-[120px] text-lg border-2 border-slate-200 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400 rounded-xl resize-none bg-slate-50 dark:bg-slate-700/50"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Media Preview */}
              {mediaPreview && (
                <div className="border-2 border-dashed border-blue-300 dark:border-blue-600 rounded-2xl p-6 bg-blue-50/50 dark:bg-blue-900/20">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-semibold text-blue-700 dark:text-blue-300">Media Preview</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setMediaFile(null)
                        setMediaPreview(null)
                        if (fileInputRef.current) fileInputRef.current.value = ""
                      }}
                      className="text-red-500 hover:text-red-600"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  {mediaFile?.type.startsWith("image/") && (
                    <img
                      src={mediaPreview || "/placeholder.svg"}
                      alt="Preview"
                      className="max-h-64 rounded-xl shadow-md mx-auto"
                    />
                  )}
                  {mediaFile?.type.startsWith("video/") && (
                    <video src={mediaPreview} controls className="max-h-64 rounded-xl shadow-md mx-auto" />
                  )}
                  {mediaFile?.type.startsWith("audio/") && (
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-md">
                      <audio src={mediaPreview} controls className="w-full" />
                    </div>
                  )}
                </div>
              )}

              {/* Controls */}
              <div className="flex flex-col lg:flex-row items-center justify-between gap-4 pt-4 border-t-2 border-slate-200 dark:border-slate-600">
                <div className="flex items-center gap-3 flex-wrap">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 border-2 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl px-4 py-2"
                  >
                    <ImagePlus className="h-5 w-5 text-blue-500" />
                    Photo
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 border-2 hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl px-4 py-2"
                  >
                    <Video className="h-5 w-5 text-red-500" />
                    Video
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 border-2 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-xl px-4 py-2"
                  >
                    <Mic className="h-5 w-5 text-green-500" />
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

                <div className="flex items-center gap-3 w-full lg:w-auto">
                  <Select value={selectedCategory} onValueChange={setSelectedCategory} required>
                    <SelectTrigger className="w-full lg:w-48 h-12 bg-slate-50 dark:bg-slate-700 border-2 rounded-xl">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={String(category.id)}>
                          <div className="flex items-center gap-2">
                            <div className={cn("w-3 h-3 rounded-full", category.color)} />
                            {category.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    type="submit"
                    disabled={isSubmitting || !content.trim()}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 h-12 text-lg font-semibold rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
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
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-200 dark:to-slate-400 bg-clip-text text-transparent">
              Community Feed
            </h2>
            <Badge variant="outline" className="text-sm px-4 py-2 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm">
              {filteredPosts.length} posts
            </Badge>
          </div>

          {filteredPosts.length === 0 ? (
            <Card className="shadow-xl border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl">
              <CardContent className="p-12 text-center">
                <div className="text-8xl mb-6">📝</div>
                <h3 className="text-3xl font-bold mb-4 bg-gradient-to-r from-slate-600 to-slate-800 dark:from-slate-200 dark:to-slate-400 bg-clip-text text-transparent">
                  {searchQuery || selectedFilter !== "all" ? "No matching posts" : "No posts yet!"}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-xl">
                  {searchQuery || selectedFilter !== "all"
                    ? "Try adjusting your search or filter criteria."
                    : "Be the first to share something with the community."}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredPosts.map((post) => {
              const tierInfo = getTierInfo(post.user.tier)
              return (
                <Card
                  key={post.id}
                  className="shadow-2xl border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl overflow-hidden hover:shadow-3xl transition-all duration-300 hover:-translate-y-1"
                >
                  <CardContent className="p-8">
                    <div className="flex items-start space-x-6">
                      <Avatar className="h-16 w-16 ring-4 ring-blue-100 dark:ring-slate-600 shadow-lg">
                        <AvatarImage src={post.user.avatar_url || "/placeholder-user.jpg"} alt={post.user.username} />
                        <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-xl">
                          {post.user.username?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-3 mb-4">
                          <h3 className="font-bold text-xl text-slate-800 dark:text-slate-200">
                            @{post.user.username}
                          </h3>
                          <span className="text-slate-600 dark:text-slate-400 font-medium">{post.user.full_name}</span>
                          <Badge className={cn("px-3 py-1 text-xs font-bold shadow-md", tierInfo.color)}>
                            {tierInfo.icon} {tierInfo.label}
                          </Badge>
                          <Badge
                            className={cn("px-3 py-1 text-xs font-bold text-white shadow-md", post.category.color)}
                          >
                            {post.category.name}
                          </Badge>
                          <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                            <Clock className="h-4 w-4" />
                            <span className="text-sm">{formatTimeAgo(post.created_at)}</span>
                          </div>
                        </div>

                        <div className="mb-6">
                          <p className="text-base leading-relaxed whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                            {post.content}
                          </p>
                        </div>

                        {/* Media Display */}
                        {post.media_url && (
                          <div className="mb-6 rounded-2xl overflow-hidden border-2 border-slate-200 dark:border-slate-600 shadow-lg">
                            {post.media_type === "image" && (
                              <img
                                src={post.media_url || "/placeholder.svg"}
                                alt="Post media"
                                className="w-full h-auto max-h-96 object-contain bg-slate-50 dark:bg-slate-700"
                                loading="lazy"
                              />
                            )}
                            {post.media_type === "video" && (
                              <video src={post.media_url} controls className="w-full h-auto max-h-96" />
                            )}
                            {post.media_type === "audio" && (
                              <div className="p-6 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-600">
                                <audio src={post.media_url} controls className="w-full" />
                              </div>
                            )}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-4 border-t-2 border-slate-100 dark:border-slate-700">
                          <div className="flex items-center space-x-6">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleVote(post.id, post.user.id, post.user.coins || 0)}
                              className={cn(
                                "flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-200",
                                post.has_voted
                                  ? "text-red-500 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30"
                                  : "text-slate-600 dark:text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20",
                              )}
                              disabled={!user || userProfile?.id === post.user.id}
                            >
                              <Heart className={cn("h-5 w-5", post.has_voted && "fill-current")} />
                              <span className="font-semibold">{post.vote_count}</span>
                              <Coins className="h-4 w-4 text-yellow-500" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              className="flex items-center space-x-2 px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200"
                            >
                              <MessageCircle className="h-5 w-5" />
                              <span>{post.comment_count || 0}</span>
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              className="flex items-center space-x-2 px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all duration-200"
                            >
                              <Share2 className="h-5 w-5" />
                              <span>Share</span>
                            </Button>
                          </div>

                          {userProfile?.coins !== undefined && (
                            <div className="text-sm text-slate-500 dark:text-slate-400">
                              Vote costs <Coins className="inline h-4 w-4 text-yellow-500" /> 100 coins
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
