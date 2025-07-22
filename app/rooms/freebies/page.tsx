"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import {
  Heart,
  Download,
  Star,
  TrendingUp,
  Users,
  ThumbsUp,
  ThumbsDown,
  Plus,
  Gift,
  Sparkles,
  Crown,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"

interface FreebieItem {
  id: number
  title: string
  description: string
  file_url: string
  thumbnail_url?: string
  vote_count: number
  download_count: number
  created_at: string
  user_has_voted: boolean
  type: "track" | "video" | "image" | "document"
  user: {
    username: string
    full_name: string | null
    avatar_url: string | null
    tier: string
  }
}

interface FreebiePost {
  id: string
  title: string
  content: string
  upvotes: number
  downvotes: number
  created_at: string
  user: {
    username: string
    full_name: string | null
    avatar_url: string | null
    tier: string
  }
  user_vote?: "up" | "down" | null
}

const TIER_COLORS = {
  grassroot: "text-green-500",
  pioneer: "text-blue-500",
  elder: "text-purple-500",
  blood_brotherhood: "text-red-500",
}

const TIER_ICONS = {
  grassroot: Star,
  pioneer: Sparkles,
  elder: Crown,
  blood_brotherhood: Gift,
}

export default function FreebiesRoom() {
  const [freebies, setFreebies] = useState<FreebieItem[]>([])
  const [posts, setPosts] = useState<FreebiePost[]>([])
  const [loading, setLoading] = useState(true)
  const [newPostTitle, setNewPostTitle] = useState("")
  const [newPostContent, setNewPostContent] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const { user, profile } = useAuth()
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      await Promise.all([loadFreebies(), loadPosts()])
    } catch (error) {
      console.error("Error loading data:", error)
      toast({
        title: "Error",
        description: "Failed to load content",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadFreebies = async () => {
    try {
      const { data: freebiesData } = await supabase
        .from("freebies")
        .select(`
          *,
          user:users!freebies_user_id_fkey(
            username,
            full_name,
            avatar_url,
            tier
          )
        `)
        .eq("is_active", true)
        .order("vote_count", { ascending: false })

      if (freebiesData) {
        let userVotes: number[] = []
        if (profile) {
          const { data: votesData } = await supabase
            .from("freebie_votes")
            .select("freebie_id")
            .eq("user_id", profile.id)

          userVotes = votesData?.map((v) => v.freebie_id) || []
        }

        const formattedFreebies = freebiesData.map((item) => ({
          ...item,
          user_has_voted: userVotes.includes(item.id),
        }))

        setFreebies(formattedFreebies)
      }
    } catch (error) {
      console.error("Error loading freebies:", error)
    }
  }

  const loadPosts = async () => {
    try {
      const { data: postsData } = await supabase
        .from("freebies_posts")
        .select(`
          *,
          user:users!freebies_posts_user_id_fkey(
            username,
            full_name,
            avatar_url,
            tier
          )
        `)
        .order("created_at", { ascending: false })
        .limit(20)

      if (postsData) {
        let userVotes: Record<string, string> = {}
        if (profile) {
          const { data: votesData } = await supabase
            .from("freebies_post_votes")
            .select("post_id, vote_type")
            .eq("user_id", profile.id)

          userVotes =
            votesData?.reduce(
              (acc, vote) => {
                acc[vote.post_id] = vote.vote_type
                return acc
              },
              {} as Record<string, string>,
            ) || {}
        }

        const formattedPosts = postsData.map((post) => ({
          ...post,
          user_vote: (userVotes[post.id] as "up" | "down" | null) || null,
        }))

        setPosts(formattedPosts)
      }
    } catch (error) {
      console.error("Error loading posts:", error)
    }
  }

  const createPost = async () => {
    if (!profile || !newPostTitle.trim() || !newPostContent.trim()) return

    try {
      setSubmitting(true)
      const { data, error } = await supabase
        .from("freebies_posts")
        .insert({
          title: newPostTitle.trim(),
          content: newPostContent.trim(),
          user_id: profile.id,
        })
        .select(`
          *,
          user:users!freebies_posts_user_id_fkey(
            username,
            full_name,
            avatar_url,
            tier
          )
        `)
        .single()

      if (error) throw error

      setPosts((prev) => [{ ...data, user_vote: null }, ...prev])
      setNewPostTitle("")
      setNewPostContent("")

      toast({
        title: "Success",
        description: "Your post has been created!",
      })
    } catch (error) {
      console.error("Error creating post:", error)
      toast({
        title: "Error",
        description: "Failed to create post",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const voteOnPost = async (postId: string, voteType: "up" | "down") => {
    if (!profile) {
      toast({
        title: "Sign in required",
        description: "Please sign in to vote on posts",
        variant: "destructive",
      })
      return
    }

    try {
      const { data: existingVote } = await supabase
        .from("freebies_post_votes")
        .select("vote_type")
        .eq("post_id", postId)
        .eq("user_id", profile.id)
        .single()

      if (existingVote?.vote_type === voteType) {
        await supabase.from("freebies_post_votes").delete().eq("post_id", postId).eq("user_id", profile.id)
      } else {
        await supabase.from("freebies_post_votes").upsert({
          post_id: postId,
          user_id: profile.id,
          vote_type: voteType,
        })
      }

      loadPosts()
    } catch (error) {
      console.error("Error voting on post:", error)
      toast({
        title: "Error",
        description: "Failed to vote on post",
        variant: "destructive",
      })
    }
  }

  const voteOnFreebie = async (freebieId: number) => {
    if (!profile) {
      toast({
        title: "Sign in required",
        description: "Please sign in to vote on freebies",
        variant: "destructive",
      })
      return
    }

    try {
      const { data: existingVote } = await supabase
        .from("freebie_votes")
        .select("id")
        .eq("freebie_id", freebieId)
        .eq("user_id", profile.id)
        .single()

      if (existingVote) {
        await supabase.from("freebie_votes").delete().eq("freebie_id", freebieId).eq("user_id", profile.id)
        await supabase.rpc("decrement_freebie_votes", { freebie_id: freebieId })
        toast({ title: "Vote removed", description: "Your vote has been removed" })
      } else {
        await supabase.from("freebie_votes").insert({ freebie_id: freebieId, user_id: profile.id })
        await supabase.rpc("increment_freebie_votes", { freebie_id: freebieId })
        toast({ title: "Voted!", description: "Your vote has been counted" })
      }

      loadFreebies()
    } catch (error) {
      console.error("Error voting:", error)
      toast({ title: "Error", description: "Failed to vote", variant: "destructive" })
    }
  }

  const downloadFreebie = async (freebieId: number, fileUrl: string, title: string) => {
    try {
      await supabase.rpc("increment_freebie_downloads", { freebie_id: freebieId })

      const link = document.createElement("a")
      link.href = fileUrl
      link.download = title
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({ title: "Download started", description: "Your download has begun" })
      loadFreebies()
    } catch (error) {
      console.error("Error downloading:", error)
      toast({ title: "Error", description: "Failed to download file", variant: "destructive" })
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "track":
        return "🎵"
      case "video":
        return "🎬"
      case "image":
        return "🖼️"
      case "document":
        return "📄"
      default:
        return "📁"
    }
  }

  const getTierIcon = (tier: string) => {
    const Icon = TIER_ICONS[tier as keyof typeof TIER_ICONS] || Star
    return Icon
  }

  const getTierColor = (tier: string) => {
    return TIER_COLORS[tier as keyof typeof TIER_COLORS] || "text-gray-500"
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading freebies room...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto p-4">
        <div className="text-center py-8">
          <div className="flex items-center justify-center mb-4">
            <Gift className="h-10 w-10 text-yellow-500 mr-3" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-yellow-600 via-orange-600 to-red-600 bg-clip-text text-transparent">
              Freebies Room
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-lg mt-2">
            Discover exclusive free content, vote on community posts, and share your thoughts
          </p>
          <div className="flex justify-center gap-8 mt-6 text-sm text-gray-500">
            <span className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              {freebies.length} Freebies Available
            </span>
            <span className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Community Driven
            </span>
            <span className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              {posts.length} Community Posts
            </span>
          </div>
        </div>

        <Tabs defaultValue="freebies" className="space-y-8">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
            <TabsTrigger value="freebies" className="flex items-center gap-2">
              <Gift className="h-4 w-4" />
              Free Downloads
            </TabsTrigger>
            <TabsTrigger value="posts" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Community Posts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="freebies" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {freebies.map((freebie) => {
                const TierIcon = getTierIcon(freebie.user.tier)
                const tierColor = getTierColor(freebie.user.tier)

                return (
                  <Card
                    key={freebie.id}
                    className="border-0 shadow-xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 hover:scale-105"
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-3xl">{getTypeIcon(freebie.type)}</span>
                        <Badge variant="secondary" className="text-xs font-semibold">
                          {freebie.type.toUpperCase()}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg line-clamp-2 mb-2">{freebie.title}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={freebie.user.avatar_url || "/placeholder.svg"} />
                          <AvatarFallback className="text-xs">
                            {freebie.user.username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-muted-foreground">
                          {freebie.user.full_name || freebie.user.username}
                        </span>
                        <TierIcon className={cn("h-3 w-3", tierColor)} />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">
                        {freebie.description}
                      </p>

                      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                        <span className="flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          {freebie.vote_count} votes
                        </span>
                        <span className="flex items-center gap-1">
                          <Download className="h-3 w-3" />
                          {freebie.download_count} downloads
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => voteOnFreebie(freebie.id)}
                          className={cn(
                            "flex items-center gap-2 flex-1 transition-all",
                            freebie.user_has_voted
                              ? "text-red-500 border-red-500 bg-red-50 hover:bg-red-100"
                              : "hover:text-red-500 hover:border-red-500",
                          )}
                        >
                          <Heart className={cn("h-4 w-4", freebie.user_has_voted && "fill-current")} />
                          {freebie.user_has_voted ? "Voted" : "Vote"}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => downloadFreebie(freebie.id, freebie.file_url, freebie.title)}
                          className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 shadow-lg"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {freebies.length === 0 && (
              <Card className="border-0 shadow-xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
                <CardContent className="p-12 text-center">
                  <Gift className="h-20 w-20 text-gray-400 mx-auto mb-6" />
                  <h3 className="text-2xl font-semibold mb-3">No freebies available</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-lg">
                    Check back later for exclusive free content!
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="posts" className="space-y-6">
            {profile && (
              <Card className="border-0 shadow-xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Share Your Thoughts
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    placeholder="Post title..."
                    value={newPostTitle}
                    onChange={(e) => setNewPostTitle(e.target.value)}
                    className="text-lg font-semibold"
                  />
                  <Textarea
                    placeholder="What's on your mind about freebies?"
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    rows={3}
                  />
                  <Button
                    onClick={createPost}
                    disabled={!newPostTitle.trim() || !newPostContent.trim() || submitting}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                  >
                    {submitting ? "Posting..." : "Create Post"}
                  </Button>
                </CardContent>
              </Card>
            )}

            <div className="space-y-6">
              {posts.map((post) => {
                const TierIcon = getTierIcon(post.user.tier)
                const tierColor = getTierColor(post.user.tier)

                return (
                  <Card
                    key={post.id}
                    className="border-0 shadow-xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-300"
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={post.user.avatar_url || "/placeholder.svg"} />
                          <AvatarFallback>{post.user.username.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{post.user.full_name || post.user.username}</span>
                            <TierIcon className={cn("h-4 w-4", tierColor)} />
                            <Badge variant="outline" className={cn("text-xs", tierColor)}>
                              {post.user.tier.charAt(0).toUpperCase() + post.user.tier.slice(1)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div>
                        <h3 className="text-xl font-semibold mb-2">{post.title}</h3>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{post.content}</p>
                      </div>

                      <div className="flex items-center gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => voteOnPost(post.id, "up")}
                          className={cn(
                            "flex items-center gap-2 transition-all",
                            post.user_vote === "up" && "text-green-600 bg-green-50 hover:bg-green-100",
                          )}
                        >
                          <ThumbsUp className={cn("h-4 w-4", post.user_vote === "up" && "fill-current")} />
                          <span>{post.upvotes}</span>
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => voteOnPost(post.id, "down")}
                          className={cn(
                            "flex items-center gap-2 transition-all",
                            post.user_vote === "down" && "text-red-600 bg-red-50 hover:bg-red-100",
                          )}
                        >
                          <ThumbsDown className={cn("h-4 w-4", post.user_vote === "down" && "fill-current")} />
                          <span>{post.downvotes}</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {posts.length === 0 && (
              <Card className="border-0 shadow-xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
                <CardContent className="p-12 text-center">
                  <Users className="h-20 w-20 text-gray-400 mx-auto mb-6" />
                  <h3 className="text-2xl font-semibold mb-3">No posts yet</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-lg">
                    Be the first to share your thoughts about freebies!
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
