"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  MessageSquare,
  Heart,
  Share2,
  TrendingUp,
  Search,
  Filter,
  Plus,
  Music,
  Calendar,
  Send,
  ImageIcon,
  Video,
  Mic,
  MoreHorizontal,
  Flag,
  Bookmark,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"

interface Post {
  id: string
  author: {
    username: string
    avatar: string
    tier: string
    verified?: boolean
  }
  content: string
  timestamp: string
  likes: number
  comments: number
  shares: number
  views: number
  type: "text" | "image" | "video" | "music"
  media?: string
  category: string
  isLiked?: boolean
  isBookmarked?: boolean
}

interface Comment {
  id: string
  author: {
    username: string
    avatar: string
    tier: string
  }
  content: string
  timestamp: string
  likes: number
  isLiked?: boolean
}

const categories = [
  { id: "general", name: "General Discussion" },
  { id: "music", name: "Music & Tracks" },
  { id: "events", name: "Events & Concerts" },
  { id: "bars", name: "Bars & Lyrics" },
  { id: "news", name: "News & Updates" },
]

const mockPosts: Post[] = [
  {
    id: "1",
    author: {
      username: "EriggaFan001",
      avatar: "/placeholder-user.jpg",
      tier: "pioneer",
      verified: true,
    },
    content:
      "Just listened to the new track \"Paper Boi\" and it's absolutely fire! 🔥 The lyrics hit different this time. What's your favorite line from the song?",
    timestamp: "2 hours ago",
    likes: 45,
    comments: 12,
    shares: 8,
    views: 234,
    type: "text",
    category: "music",
    isLiked: false,
    isBookmarked: false,
  },
  {
    id: "2",
    author: {
      username: "WarriPikin",
      avatar: "/placeholder-user.jpg",
      tier: "elder",
    },
    content:
      "Throwback to when Erigga performed at the Warri concert! Still gives me chills 🎤 The energy was unmatched!",
    timestamp: "4 hours ago",
    likes: 78,
    comments: 23,
    shares: 15,
    views: 456,
    type: "image",
    media: "/placeholder.jpg",
    category: "events",
    isLiked: true,
    isBookmarked: true,
  },
  {
    id: "3",
    author: {
      username: "SouthSouthVibes",
      avatar: "/placeholder-user.jpg",
      tier: "grassroot",
    },
    content:
      "Anyone else excited for the upcoming album? The snippets on his story are crazy! 🎵 Can't wait to hear the full project.",
    timestamp: "6 hours ago",
    likes: 32,
    comments: 18,
    shares: 5,
    views: 189,
    type: "text",
    category: "news",
    isLiked: false,
    isBookmarked: false,
  },
]

const mockComments: { [key: string]: Comment[] } = {
  "1": [
    {
      id: "c1",
      author: {
        username: "MusicLover23",
        avatar: "/placeholder-user.jpg",
        tier: "pioneer",
      },
      content: "The line about 'rising from the streets' hits so hard! 💯",
      timestamp: "1 hour ago",
      likes: 8,
      isLiked: false,
    },
    {
      id: "c2",
      author: {
        username: "WarriRepresent",
        avatar: "/placeholder-user.jpg",
        tier: "elder",
      },
      content: "Erigga never disappoints! This track is going straight to my playlist 🔥",
      timestamp: "30 minutes ago",
      likes: 12,
      isLiked: true,
    },
  ],
}

const trendingTopics = [
  { tag: "#PaperBoi", posts: 234, growth: "+45%" },
  { tag: "#EriggaLive", posts: 189, growth: "+32%" },
  { tag: "#WarriToTheWorld", posts: 156, growth: "+28%" },
  { tag: "#SouthSouthMusic", posts: 98, growth: "+15%" },
  { tag: "#NewAlbum2024", posts: 87, growth: "+67%" },
]

const communityStats = {
  totalMembers: 12547,
  activeToday: 1834,
  postsToday: 456,
  trending: 23,
}

export default function CommunityPage() {
  const { isAuthenticated, profile, loading } = useAuth()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("feed")
  const [posts, setPosts] = useState<Post[]>(mockPosts)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<{ [key: string]: Comment[] }>(mockComments)
  const [newComment, setNewComment] = useState("")
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [newPost, setNewPost] = useState({
    content: "",
    category: "general",
    media: null as File | null,
  })

  const getTierColor = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case "admin":
        return "bg-red-500"
      case "mod":
        return "bg-purple-500"
      case "elder":
        return "bg-yellow-500"
      case "blood":
        return "bg-orange-500"
      case "pioneer":
        return "bg-blue-500"
      default:
        return "bg-green-500"
    }
  }

  const getTierLabel = (tier: string) => {
    return tier?.charAt(0).toUpperCase() + tier?.slice(1) || "Member"
  }

  const handleLikePost = (postId: string) => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please login to like posts",
        variant: "destructive",
      })
      return
    }

    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          const isLiked = !post.isLiked
          return {
            ...post,
            isLiked,
            likes: isLiked ? post.likes + 1 : post.likes - 1,
          }
        }
        return post
      }),
    )

    toast({
      title: "Success",
      description: "Post liked!",
    })
  }

  const handleBookmarkPost = (postId: string) => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please login to bookmark posts",
        variant: "destructive",
      })
      return
    }

    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          return { ...post, isBookmarked: !post.isBookmarked }
        }
        return post
      }),
    )

    toast({
      title: "Success",
      description: "Post bookmarked!",
    })
  }

  const handleSharePost = (postId: string) => {
    const post = posts.find((p) => p.id === postId)
    if (post) {
      navigator.clipboard.writeText(`Check out this post by ${post.author.username}: ${post.content}`)
      toast({
        title: "Link Copied",
        description: "Post link copied to clipboard",
      })
    }
  }

  const handleCreatePost = () => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please login to create posts",
        variant: "destructive",
      })
      return
    }

    if (!newPost.content.trim()) {
      toast({
        title: "Content Required",
        description: "Please enter some content for your post",
        variant: "destructive",
      })
      return
    }

    const post: Post = {
      id: Date.now().toString(),
      author: {
        username: profile?.username || "User",
        avatar: profile?.avatar_url || "/placeholder-user.jpg",
        tier: profile?.tier || "grassroot",
      },
      content: newPost.content,
      timestamp: "Just now",
      likes: 0,
      comments: 0,
      shares: 0,
      views: 1,
      type: "text",
      category: newPost.category,
      isLiked: false,
      isBookmarked: false,
    }

    setPosts((prev) => [post, ...prev])
    setNewPost({ content: "", category: "general", media: null })
    setShowCreatePost(false)

    toast({
      title: "Post Created",
      description: "Your post has been shared with the community!",
    })
  }

  const handleAddComment = (postId: string) => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please login to comment",
        variant: "destructive",
      })
      return
    }

    if (!newComment.trim()) return

    const comment: Comment = {
      id: Date.now().toString(),
      author: {
        username: profile?.username || "User",
        avatar: profile?.avatar_url || "/placeholder-user.jpg",
        tier: profile?.tier || "grassroot",
      },
      content: newComment,
      timestamp: "Just now",
      likes: 0,
      isLiked: false,
    }

    setComments((prev) => ({
      ...prev,
      [postId]: [...(prev[postId] || []), comment],
    }))

    setPosts((prev) => prev.map((post) => (post.id === postId ? { ...post, comments: post.comments + 1 } : post)))

    setNewComment("")
    toast({
      title: "Comment Added",
      description: "Your comment has been posted!",
    })
  }

  const filteredPosts = posts.filter(
    (post) =>
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.author.username.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 pt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-700 rounded w-1/4"></div>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-48 bg-gray-700 rounded-lg"></div>
                ))}
              </div>
              <div className="space-y-4">
                <div className="h-32 bg-gray-700 rounded-lg"></div>
                <div className="h-48 bg-gray-700 rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Community</h1>
              <p className="text-gray-300">Connect with fellow Erigga fans from around the world</p>
            </div>

            {isAuthenticated && (
              <Dialog open={showCreatePost} onOpenChange={setShowCreatePost}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Post
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-gray-900 border-gray-700">
                  <DialogHeader>
                    <DialogTitle className="text-white">Create New Post</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Select
                      value={newPost.category}
                      onValueChange={(value) => setNewPost((prev) => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id} className="text-white hover:bg-gray-700">
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Textarea
                      placeholder="What's on your mind?"
                      value={newPost.content}
                      onChange={(e) => setNewPost((prev) => ({ ...prev, content: e.target.value }))}
                      className="bg-gray-800 border-gray-700 text-white min-h-[120px]"
                    />
                    <div className="flex justify-between">
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                          <ImageIcon className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                          <Video className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                          <Mic className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button onClick={handleCreatePost} className="bg-gradient-to-r from-orange-500 to-red-500">
                        <Send className="h-4 w-4 mr-2" />
                        Post
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* Community Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <Card className="bg-white/10 backdrop-blur border-white/20">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-white">12.5K</div>
                <div className="text-sm text-gray-300">Total Members</div>
              </CardContent>
            </Card>
            <Card className="bg-white/10 backdrop-blur border-white/20">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-400">1.8K</div>
                <div className="text-sm text-gray-300">Active Today</div>
              </CardContent>
            </Card>
            <Card className="bg-white/10 backdrop-blur border-white/20">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">456</div>
                <div className="text-sm text-gray-300">Posts Today</div>
              </CardContent>
            </Card>
            <Card className="bg-white/10 backdrop-blur border-white/20">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-400">23</div>
                <div className="text-sm text-gray-300">Trending Topics</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search posts, users, or topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
            />
          </div>
          <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-white/10 border-white/20">
                <TabsTrigger value="feed" className="data-[state=active]:bg-white/20 text-white">
                  Feed
                </TabsTrigger>
                <TabsTrigger value="trending" className="data-[state=active]:bg-white/20 text-white">
                  Trending
                </TabsTrigger>
                <TabsTrigger value="music" className="data-[state=active]:bg-white/20 text-white">
                  Music
                </TabsTrigger>
                <TabsTrigger value="events" className="data-[state=active]:bg-white/20 text-white">
                  Events
                </TabsTrigger>
              </TabsList>

              <TabsContent value="feed" className="space-y-6 mt-6">
                {!isAuthenticated && (
                  <Card className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border-orange-500/30">
                    <CardContent className="p-6 text-center">
                      <h3 className="text-xl font-semibold text-white mb-2">Join the Conversation!</h3>
                      <p className="text-gray-300 mb-4">Sign up to post, comment, and connect with other fans</p>
                      <div className="flex gap-3 justify-center">
                        <Link href="/login">
                          <Button
                            variant="outline"
                            className="bg-transparent border-white/30 text-white hover:bg-white/10"
                          >
                            Login
                          </Button>
                        </Link>
                        <Link href="/signup">
                          <Button className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600">
                            Sign Up
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {filteredPosts.map((post) => (
                  <Card key={post.id} className="bg-white/10 backdrop-blur border-white/20">
                    <CardContent className="p-6">
                      {/* Post Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={post.author.avatar || "/placeholder.svg"} />
                            <AvatarFallback>{post.author.username.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold text-white">{post.author.username}</span>
                              {post.author.verified && <span className="text-blue-400">✓</span>}
                              <Badge className={`${getTierColor(post.author.tier)} text-white text-xs`}>
                                {getTierLabel(post.author.tier)}
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-400">
                              {post.timestamp} • {post.category}
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Post Content */}
                      <div className="mb-4">
                        <p className="text-white leading-relaxed">{post.content}</p>
                        {post.media && post.type === "image" && (
                          <div className="mt-3 rounded-lg overflow-hidden">
                            <img
                              src={post.media || "/placeholder.svg"}
                              alt="Post media"
                              className="w-full h-64 object-cover"
                            />
                          </div>
                        )}
                      </div>

                      {/* Post Stats */}
                      <div className="flex items-center space-x-4 text-sm text-gray-400 mb-3">
                        <span>{post.views} views</span>
                        <span>•</span>
                        <span>{post.likes} likes</span>
                        <span>•</span>
                        <span>{post.comments} comments</span>
                      </div>

                      {/* Post Actions */}
                      <div className="flex items-center justify-between pt-3 border-t border-white/10">
                        <div className="flex items-center space-x-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleLikePost(post.id)}
                            className={`${post.isLiked ? "text-red-400" : "text-gray-400"} hover:text-red-400 hover:bg-red-400/10`}
                          >
                            <Heart className={`h-4 w-4 mr-2 ${post.isLiked ? "fill-current" : ""}`} />
                            {post.likes}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedPost(post)}
                            className="text-gray-400 hover:text-blue-400 hover:bg-blue-400/10"
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            {post.comments}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSharePost(post.id)}
                            className="text-gray-400 hover:text-green-400 hover:bg-green-400/10"
                          >
                            <Share2 className="h-4 w-4 mr-2" />
                            Share
                          </Button>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleBookmarkPost(post.id)}
                            className={`${post.isBookmarked ? "text-yellow-400" : "text-gray-400"} hover:text-yellow-400`}
                          >
                            <Bookmark className={`h-4 w-4 ${post.isBookmarked ? "fill-current" : ""}`} />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-red-400">
                            <Flag className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="trending" className="space-y-6 mt-6">
                <Card className="bg-white/10 backdrop-blur border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <TrendingUp className="h-5 w-5 mr-2" />
                      Trending Now
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {trendingTopics.map((topic, index) => (
                      <div
                        key={topic.tag}
                        className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-gray-400 font-mono">#{index + 1}</span>
                          <div>
                            <div className="font-semibold text-white">{topic.tag}</div>
                            <div className="text-sm text-gray-400">{topic.posts} posts</div>
                          </div>
                        </div>
                        <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                          {topic.growth}
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="music" className="space-y-6 mt-6">
                <Card className="bg-white/10 backdrop-blur border-white/20">
                  <CardContent className="p-8 text-center">
                    <Music className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-2xl font-semibold text-white mb-2">Music Discussions</h3>
                    <p className="text-gray-400 mb-6">
                      Share your favorite tracks, discuss lyrics, and discover new music
                    </p>
                    <Button className="bg-gradient-to-r from-orange-500 to-red-500">Start Music Discussion</Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="events" className="space-y-6 mt-6">
                <Card className="bg-white/10 backdrop-blur border-white/20">
                  <CardContent className="p-8 text-center">
                    <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-2xl font-semibold text-white mb-2">Upcoming Events</h3>
                    <p className="text-gray-400 mb-6">Stay updated on concerts, fan meetups, and special events</p>
                    <Button className="bg-gradient-to-r from-orange-500 to-red-500">View All Events</Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* User Profile Card */}
            {isAuthenticated && profile && (
              <Card className="bg-white/10 backdrop-blur border-white/20">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={profile.avatar_url || "/placeholder-user.jpg"} />
                      <AvatarFallback className="text-lg">
                        {profile.username?.charAt(0)?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-white">{profile.username}</h3>
                      <Badge className={`${getTierColor(profile.tier)} text-white text-xs`}>
                        {getTierLabel(profile.tier)}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-gray-300">
                      <span>Level:</span>
                      <span className="text-white font-medium">{profile.level}</span>
                    </div>
                    <div className="flex justify-between text-gray-300">
                      <span>Points:</span>
                      <span className="text-white font-medium">{profile.points}</span>
                    </div>
                    <div className="flex justify-between text-gray-300">
                      <span>Coins:</span>
                      <span className="text-yellow-400 font-medium">{profile.coins}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Trending Topics */}
            <Card className="bg-white/10 backdrop-blur border-white/20">
              <CardHeader>
                <CardTitle className="text-white text-lg">Trending Topics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {trendingTopics.slice(0, 5).map((topic, index) => (
                  <div
                    key={topic.tag}
                    className="flex items-center justify-between hover:bg-white/5 p-2 rounded cursor-pointer"
                  >
                    <span className="text-blue-400 hover:text-blue-300 text-sm">{topic.tag}</span>
                    <span className="text-xs text-gray-400">{topic.posts}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-white/10 backdrop-blur border-white/20">
              <CardHeader>
                <CardTitle className="text-white text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/vault">
                  <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10">
                    <Music className="h-4 w-4 mr-2" />
                    Browse Music
                  </Button>
                </Link>
                <Link href="/chat">
                  <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Join Chat
                  </Button>
                </Link>
                <Link href="/tickets">
                  <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10">
                    <Calendar className="h-4 w-4 mr-2" />
                    View Events
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Community Guidelines */}
            <Card className="bg-white/10 backdrop-blur border-white/20">
              <CardHeader>
                <CardTitle className="text-white text-lg">Community Guidelines</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-300 space-y-2">
                  <li>• Be respectful to all members</li>
                  <li>• No spam or self-promotion</li>
                  <li>• Keep discussions music-related</li>
                  <li>• Report inappropriate content</li>
                  <li>• Support fellow fans</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Comments Modal */}
        {selectedPost && (
          <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
            <DialogContent className="bg-gray-900 border-gray-700 max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-white">Comments</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Original Post */}
                <div className="p-4 bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-3 mb-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={selectedPost.author.avatar || "/placeholder.svg"} />
                      <AvatarFallback>{selectedPost.author.username.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <span className="font-semibold text-white">{selectedPost.author.username}</span>
                      <div className="text-sm text-gray-400">{selectedPost.timestamp}</div>
                    </div>
                  </div>
                  <p className="text-gray-200">{selectedPost.content}</p>
                </div>

                {/* Comments */}
                <div className="space-y-4">
                  {(comments[selectedPost.id] || []).map((comment) => (
                    <div key={comment.id} className="flex space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={comment.author.avatar || "/placeholder.svg"} />
                        <AvatarFallback>{comment.author.username.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="bg-gray-800 rounded-lg p-3">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-semibold text-white text-sm">{comment.author.username}</span>
                            <Badge className={`${getTierColor(comment.author.tier)} text-white text-xs`}>
                              {getTierLabel(comment.author.tier)}
                            </Badge>
                            <span className="text-xs text-gray-400">{comment.timestamp}</span>
                          </div>
                          <p className="text-gray-200 text-sm">{comment.content}</p>
                        </div>
                        <div className="flex items-center space-x-4 mt-2">
                          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-red-400 h-6 px-2">
                            <Heart className={`h-3 w-3 mr-1 ${comment.isLiked ? "fill-current text-red-400" : ""}`} />
                            {comment.likes}
                          </Button>
                          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-blue-400 h-6 px-2">
                            Reply
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Comment */}
                {isAuthenticated && (
                  <div className="flex space-x-3 pt-4 border-t border-gray-700">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile?.avatar_url || "/placeholder-user.jpg"} />
                      <AvatarFallback>{profile?.username?.charAt(0)?.toUpperCase() || "U"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-2">
                      <Textarea
                        placeholder="Write a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="bg-gray-800 border-gray-700 text-white min-h-[80px]"
                      />
                      <div className="flex justify-end">
                        <Button
                          onClick={() => handleAddComment(selectedPost.id)}
                          className="bg-gradient-to-r from-orange-500 to-red-500"
                          disabled={!newComment.trim()}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Comment
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  )
}
