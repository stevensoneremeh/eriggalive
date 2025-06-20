"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase/client"
import {
  useRealtimePosts,
  useRealtimeNotifications,
  useRealtimePresence,
  type CommunityPost,
} from "@/lib/realtime-community"
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
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"

interface RealtimeCommunityClientProps {
  user: any
  profile: any
  initialPosts: CommunityPost[]
  categories: any[]
}

export function RealtimeCommunityClient({ 
  user, 
  profile, 
  initialPosts, 
  categories 
}: RealtimeCommunityClientProps) {
  const [newPostContent, setNewPostContent] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { toast } = useToast()
  const supabase = createClient()
  
  // Real-time hooks
  const { posts, loading, refreshPosts } = useRealtimePosts(initialPosts)
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useRealtimeNotifications(profile?.id)
  const { onlineUsers } = useRealtimePresence(profile?.id)

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
      // Extract hashtags from content
      const hashtags = newPostContent.match(/#\w+/g)?.map((tag) => tag.slice(1)) || []

      // Create post - real-time subscription will handle UI update
      const { error } = await supabase
        .from("community_posts")
        .insert({
          user_id: profile.id,
          category_id: Number.parseInt(selectedCategory),
          content: newPostContent.trim(),
          hashtags,
        })

      if (error) {
        throw error
      }

      toast({
        title: "Post Created! 🎉",
        description: "Your post has been shared with the community.",
      })

      // Reset form
      setNewPostContent("")
      setSelectedCategory("")
    } catch (error) {
      console.error("Error creating post:", error)
      toast({
        title: "Failed to Create Post",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVote = async (postId: number, hasVoted: boolean) => {
    try {
      const { data, error } = await supabase.rpc("handle_post_vote", {
        p_post_id: postId,
        p_user_id: profile.id,
        p_vote_type: "up",
        p_coin_amount: 100,
      })

      if (error) {
        throw error
      }

      const post = posts.find(p => p.id === postId)
      toast({
        title: data.voted ? "Vote Added! 🎉" : "Vote Removed",
        description: data.voted 
          ? `100 Erigga Coins transferred to @${post?.users.username}` 
          : "Your vote has been removed.",
      })
    } catch (error) {
      console.error("Error voting:", error)
      toast({
        title: "Vote Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleBookmark = async (postId: number) => {
    try {
      // Check if already bookmarked
      const { data: existingBookmark } = await supabase
        .from("user_bookmarks")
        .select("id")
        .eq("user_id", profile.id)
        .eq("post_id", postId)
        .single()

      if (existingBookmark) {
        // Remove bookmark
        await supabase
          .from("user_bookmarks")
          .delete()
          .eq("user_id", profile.id)
          .eq("post_id", postId)
        
        toast({
          title: "Bookmark Removed",
          description: "Post removed from your bookmarks.",
        })
      } else {
        // Add bookmark
        await supabase
          .from("user_bookmarks")
          .insert({
            user_id: profile.id,
            post_id: postId,
          })
        
        toast({
          title: "Post Bookmarked! 📚",
          description: "Post saved to your bookmarks.",
        })
      }
    } catch (error) {
      console.error("Error bookmarking:", error)
      toast({
        title: "Bookmark Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getTierColor = (tier: string) => {
    const colors = {
      admin: "bg-red-500 text-white",
      blood_brotherhood: "bg-red-600 text-white",
      elder: "bg-purple-500 text-white",
      pioneer: "bg-blue-500 text-white",
      grassroot: "bg-green-500 text-white",
    }
    return colors[tier as keyof typeof colors] || "bg-gray-500 text-white"
  }

  const renderContent = (content: string) => {
    // Replace hashtags with styled spans
    let processedContent = content.replace(
      /#(\w+)/g,
      '<span class="text-blue-500 font-medium cursor-pointer hover:text-blue-600">#$1</span>',
    )

    // Replace mentions with styled spans
    processedContent = processedContent.replace(
      /@(\w+)/g,
      '<span class="text-purple-500 font-medium cursor-pointer hover:text-purple-600">@$1</span>',
    )

    return { __html: processedContent }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header with Real-time Stats */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
              <Users className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Real-time Community
            </h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Connect with fellow fans in real-time, share your thoughts, and celebrate the culture together
          </p>
          <div className="flex justify-center gap-6 mt-6 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Circle className="h-3 w-3 text-green-500 fill-current" />
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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar - Categories & Online Users */}
          <div className="lg:col-span-1 space-y-6">
            {/* Categories */}
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

            {/* Online Users */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Circle className="h-5 w-5 text-green-500 fill-current" />
                  Online Now ({onlineUsers.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {onlineUsers.slice(0, 10).map((presence) => (
                  <div key={presence.user_id} className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                        U
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">User #{presence.user_id.slice(-6)}</div>
                      <div className="text-xs text-gray-500 capitalize">{presence.status}</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Create Post */}
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={profile?.avatar_url || "/placeholder-user.jpg"} alt={profile?.username} />
                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold">
                      {profile?.username?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
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

            {/* Real-time Posts Feed */}
            <div className="space-y-6">
              {loading && (
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                  <CardContent className="text-center py-12">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-500">Loading posts...</p>
                  </CardContent>
                </Card>
              )}

              {posts.length === 0 && !loading ? (
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
                            <AvatarImage src={post.users?.avatar_url || "/placeholder-user.jpg"} alt={post.users?.username} />
                            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold">
                              {post.users?.username?.charAt(0).toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-3 mb-1">
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
                            disabled={post.users?.id === profile?.id}
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
                            onClick={() => handleBookmark(post.id)}
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

          { /* Right Sidebar -
