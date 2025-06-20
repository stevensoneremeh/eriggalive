"use client"

import type React from "react"

import { useState } from "react"
import { formatDistanceToNow } from "date-fns"
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Bell,
  Users,
  TrendingUp,
  Send,
  Eye,
  Hash,
  Coins,
  Circle,
  CheckCheck,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import {
  useRealtimePosts,
  useRealtimeNotifications,
  useRealtimePresence,
  type CommunityPost,
} from "@/lib/realtime-community"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"

interface RealtimeCommunityClientProps {
  user: any
  profile: any
  initialPosts: CommunityPost[]
  categories: {
    id: number
    name: string
    icon: string
    color?: string
    post_count?: number
  }[]
}

export function RealtimeCommunityClient({ user, profile, initialPosts, categories }: RealtimeCommunityClientProps) {
  const supabase = createClient()
  const { toast } = useToast()

  /* ──────────────────────────────────────────
   * Local state
   * ────────────────────────────────────────── */
  const [newPostContent, setNewPostContent] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  /* ──────────────────────────────────────────
   * Realtime hooks
   * ────────────────────────────────────────── */
  const { posts, loading } = useRealtimePosts(initialPosts)
  const { notifications, unreadCount, markAllAsRead } = useRealtimeNotifications(profile?.id)
  const { onlineUsers } = useRealtimePresence(profile?.id)

  /* ──────────────────────────────────────────
   * Helpers
   * ────────────────────────────────────────── */
  const getTierColor = (tier: string) => {
    const colors = {
      admin: "bg-red-600 text-white",
      blood_brotherhood: "bg-red-700 text-white",
      elder: "bg-purple-600 text-white",
      pioneer: "bg-blue-600 text-white",
      grassroot: "bg-green-600 text-white",
    } as Record<string, string>
    return colors[tier] ?? "bg-gray-600 text-white"
  }

  const renderContent = (content: string) => {
    // hashtags
    let html = content.replace(/#(\w+)/g, '<span class="text-blue-600 font-medium cursor-pointer">#$1</span>')
    // mentions
    html = html.replace(/@(\w+)/g, '<span class="text-purple-600 font-medium cursor-pointer">@$1</span>')
    return { __html: html }
  }

  /* ──────────────────────────────────────────
   * Actions
   * ────────────────────────────────────────── */
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newPostContent.trim() || !selectedCategory) return

    setIsSubmitting(true)
    try {
      const hashtags = newPostContent.match(/#\w+/g)?.map((t) => t.slice(1)) ?? []

      const { error } = await supabase.from("community_posts").insert({
        user_id: profile.id,
        category_id: Number(selectedCategory),
        content: newPostContent.trim(),
        hashtags,
      })

      if (error) throw error

      toast({
        title: "Post shared!",
        description: "Your post is now live in the community.",
      })

      setNewPostContent("")
      setSelectedCategory("")
    } catch (err) {
      console.error(err)
      toast({
        title: "Failed to create post",
        description: "Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVote = async (postId: number, hasVoted: boolean) => {
    try {
      await supabase.rpc("handle_post_vote", {
        p_post_id: postId,
        p_user_id: profile.id,
        p_vote_type: "up",
        p_coin_amount: 100,
      })
    } catch (err) {
      console.error(err)
    }
  }

  const handleBookmark = async (postId: number) => {
    try {
      const { data } = await supabase
        .from("user_bookmarks")
        .select("id")
        .eq("user_id", profile.id)
        .eq("post_id", postId)
        .single()

      if (data) {
        await supabase.from("user_bookmarks").delete().eq("id", data.id)
      } else {
        await supabase.from("user_bookmarks").insert({
          user_id: profile.id,
          post_id: postId,
        })
      }
    } catch (err) {
      console.error(err)
    }
  }

  /* ──────────────────────────────────────────
   * UI
   * ────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        {/* ── Header ─────────────────────────── */}
        <div className="mb-12 text-center">
          <div className="mx-auto mb-4 inline-flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-purple-600">
              <Users className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Real-time Community
            </h1>
          </div>
          <p className="mx-auto max-w-2xl text-xl text-gray-600 dark:text-gray-300">
            Connect with fellow fans in real-time, share your thoughts, and celebrate together.
          </p>
          <div className="mt-6 flex justify-center gap-6 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Circle className="h-3 w-3 fill-green-500 text-green-500" />
              {onlineUsers.length} Online
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="h-4 w-4" />
              {posts.length} Posts
            </span>
            <span className="flex items-center gap-1">
              <Bell className="h-4 w-4" />
              {unreadCount} Notifications
            </span>
          </div>
        </div>

        {/* ── 3-Column Grid ──────────────────── */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* ► LEFT SIDEBAR ◄ */}
          <div className="space-y-6 lg:col-span-1">
            {/* Categories */}
            <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  Categories
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex cursor-pointer items-center justify-between rounded-lg p-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{cat.icon}</span>
                      <div>
                        <div className="text-sm font-medium">{cat.name}</div>
                        <div className="text-xs text-gray-500">{cat.post_count} posts</div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* ► MAIN CONTENT ◄ */}
          <div className="space-y-8 lg:col-span-2">
            {/* Create Post */}
            <Card className="border-0 bg-white/90 backdrop-blur-sm shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={profile?.avatar_url || "/placeholder-user.jpg"} alt={profile?.username} />
                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 font-bold text-white">
                      {profile?.username?.[0]?.toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="mb-1 flex items-center gap-2">
                      <span className="font-semibold">{profile?.full_name}</span>
                      <Badge className={getTierColor(profile?.tier)}>
                        {profile?.tier?.replace("_", " ").toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500">@{profile?.username}</p>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleCreatePost} className="space-y-4">
                  <Textarea
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    placeholder="What's on your mind? Use #hashtags and @mentions"
                    className="min-h-[120px] resize-none border-0 bg-gray-50 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                    maxLength={2000}
                    required
                  />
                  <div className="mt-2 flex items-center justify-between text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Hash className="h-4 w-4" />
                      Use hashtags
                    </span>
                    <span>
                      {newPostContent.length}
                      /2000
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <Select value={selectedCategory} onValueChange={setSelectedCategory} required>
                      <SelectTrigger className="w-64">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={String(cat.id)}>
                            <div className="flex items-center gap-2">
                              <span>{cat.icon}</span>
                              {cat.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button
                      type="submit"
                      disabled={isSubmitting || !newPostContent.trim() || !selectedCategory}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 hover:from-blue-700 hover:to-purple-700"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
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
            {loading && (
              <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
                <CardContent className="py-12 text-center">
                  <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
                  <p className="text-gray-500">Loading posts…</p>
                </CardContent>
              </Card>
            )}

            {!loading && posts.length === 0 && (
              <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
                <CardContent className="py-12 text-center">
                  <MessageCircle className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                  <h3 className="mb-2 text-lg font-medium text-gray-900">No posts yet</h3>
                  <p className="text-gray-500">Be the first to share something!</p>
                </CardContent>
              </Card>
            )}

            {posts.map((post) => (
              <Card
                key={post.id}
                className="border-0 bg-white/90 backdrop-blur-sm shadow-lg transition-all duration-300 hover:shadow-xl"
              >
                <CardContent className="p-6">
                  {/* Header */}
                  <div className="mb-6 flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12 ring-2 ring-gray-200 dark:ring-gray-700">
                        <AvatarImage
                          src={post.users?.avatar_url ?? "/placeholder-user.jpg"}
                          alt={post.users?.username}
                        />
                        <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 font-bold text-white">
                          {post.users?.username?.[0]?.toUpperCase() ?? "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="mb-1 flex items-center gap-3">
                          <span className="font-semibold text-gray-900">{post.users?.full_name}</span>
                          <Badge className={getTierColor(post.users?.tier)}>
                            {post.users?.tier?.replace("_", " ").toUpperCase()}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span>@{post.users?.username}</span>
                          <span>•</span>
                          <span>{post.users?.email}</span>
                          <span>•</span>
                          <span>
                            {formatDistanceToNow(new Date(post.created_at), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="mb-6">
                    <div
                      className="prose prose-sm max-w-none leading-relaxed text-gray-800 dark:prose-invert dark:text-gray-200"
                      dangerouslySetInnerHTML={renderContent(post.content)}
                    />
                  </div>

                  {/* Actions */}
                  <div className="-mx-6 -mb-6 flex items-center justify-between border-t bg-gray-50 px-6 py-4 dark:bg-gray-800/50">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "flex items-center gap-2 hover:bg-green-100 dark:hover:bg-green-900/20",
                          post.has_voted && "bg-green-50 text-green-600 dark:bg-green-900/20",
                        )}
                        onClick={() => handleVote(post.id, post.has_voted)}
                        disabled={post.users?.id === profile.id}
                      >
                        <Heart className={cn("h-5 w-5", post.has_voted && "fill-current")} />
                        <span className="font-medium">{post.vote_count}</span>
                        <Coins className="h-4 w-4 text-yellow-500" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex items-center gap-2 hover:bg-blue-100 dark:hover:bg-blue-900/20"
                      >
                        <MessageCircle className="h-4 w-4" />
                        <span>{post.comment_count}</span>
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex items-center gap-2 hover:bg-yellow-100 dark:hover:bg-yellow-900/20"
                        onClick={() => handleBookmark(post.id)}
                      >
                        <Bookmark className="h-4 w-4" />
                      </Button>

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
                        <span>{post.view_count ?? 0}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* ► RIGHT SIDEBAR ◄ */}
          <div className="space-y-6 lg:col-span-1">
            {/* Notifications */}
            <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Bell className="h-5 w-5 text-purple-600" />
                  Notifications
                  {unreadCount > 0 && (
                    <Badge variant="secondary" className="ml-auto">
                      {unreadCount}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center">No notifications</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={cn(
                        "flex items-start gap-3 rounded-lg p-3",
                        !n.read && "bg-purple-50 dark:bg-purple-900/20",
                      )}
                    >
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage src={n.actor_avatar || "/placeholder-user.jpg"} alt={n.actor_username} />
                        <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 font-bold text-white">
                          {n.actor_username?.[0]?.toUpperCase() ?? "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm leading-5">
                          <span className="font-medium">{n.actor_username}</span> {n.message}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      {!n.read && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => supabase.from("notifications").update({ read: true }).eq("id", n.id)}
                        >
                          <CheckCheck className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))
                )}

                {unreadCount > 0 && (
                  <Button
                    onClick={markAllAsRead}
                    variant="outline"
                    className="w-full bg-purple-600/10 text-purple-700 hover:bg-purple-600/20 dark:bg-purple-900/30 dark:text-purple-300"
                  >
                    Mark all as read
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
