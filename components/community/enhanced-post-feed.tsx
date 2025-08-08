"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Heart, MessageCircle, Share2, MoreHorizontal, Search, Filter, RefreshCw, Mic, Play, Pause, Volume2, VolumeX, AlertCircle, TrendingUp, Clock, ThumbsUp } from 'lucide-react'
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface Category {
 id: number
 name: string
 slug: string
 description?: string
 is_active: boolean
}

interface CommunityPost {
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

interface EnhancedPostFeedProps {
 categories: Category[]
 initialPosts?: CommunityPost[]
 className?: string
}

const POSTS_PER_PAGE = 10

export function EnhancedPostFeed({ categories, initialPosts = [], className }: EnhancedPostFeedProps) {
 const { user, isAuthenticated } = useAuth()
 const supabase = createClient()

 // State
 const [posts, setPosts] = useState<CommunityPost[]>(initialPosts)
 const [loading, setLoading] = useState(false)
 const [error, setError] = useState<string | null>(null)
 const [searchQuery, setSearchQuery] = useState("")
 const [selectedCategory, setSelectedCategory] = useState("all")
 const [sortBy, setSortBy] = useState("newest")
 const [page, setPage] = useState(1)
 const [hasMore, setHasMore] = useState(true)
 const [refreshing, setRefreshing] = useState(false)

 // Audio state
 const [playingAudio, setPlayingAudio] = useState<string | null>(null)
 const [audioMuted, setAudioMuted] = useState(false)

 // Get tier color
 const getTierColor = useCallback((tier: string) => {
   switch (tier.toLowerCase()) {
     case "blood":
       return "bg-red-500"
     case "pioneer":
       return "bg-blue-500"
     case "elder":
       return "bg-purple-500"
     case "grassroot":
       return "bg-green-500"
     default:
       return "bg-gray-500"
   }
 }, [])

 // Load posts
 const loadPosts = useCallback(
   async (pageNum = 1, append = false) => {
     try {
       if (!append) setLoading(true)
       setError(null)

       let query = supabase
         .from("community_posts")
         .select(`
         *,
         user:users!community_posts_user_id_fkey(id, username, full_name, avatar_url, tier),
         category:community_categories!community_posts_category_id_fkey(id, name, slug)
       `)
         .eq("is_published", true)
         .eq("is_deleted", false)

       // Apply filters
       if (selectedCategory !== "all" && selectedCategory !== "") {
         const categoryId = Number.parseInt(selectedCategory)
         if (!isNaN(categoryId)) {
           query = query.eq("category_id", categoryId)
         }
       }

       if (searchQuery.trim()) {
         query = query.ilike("content", `%${searchQuery.trim()}%`)
       }

       // Apply sorting
       switch (sortBy) {
         case "newest":
           query = query.order("created_at", { ascending: false })
           break
         case "oldest":
           query = query.order("created_at", { ascending: true })
           break
         case "trending":
           query = query.order("vote_count", { ascending: false }).order("created_at", { ascending: false })
           break
         case "most_voted":
           query = query.order("vote_count", { ascending: false })
           break
         default:
           query = query.order("created_at", { ascending: false })
       }

       // Pagination
       const from = (pageNum - 1) * POSTS_PER_PAGE
       const to = from + POSTS_PER_PAGE - 1
       query = query.range(from, to)

       const { data, error: fetchError } = await query

       if (fetchError) {
         throw fetchError
       }

       const transformedPosts = (data || []).map((post) => ({
         ...post,
         has_voted: false, // TODO: Implement actual vote checking
         user: post.user || {
           id: "unknown",
           username: "Unknown User",
           full_name: "Unknown User",
           avatar_url: null,
           tier: "grassroot",
         },
         category: post.category || {
           id: 1,
           name: "General",
           slug: "general",
         },
       })) as CommunityPost[]

       if (append) {
         setPosts((prev) => [...prev, ...transformedPosts])
       } else {
         setPosts(transformedPosts)
       }

       setHasMore(transformedPosts.length === POSTS_PER_PAGE)
       setPage(pageNum)
     } catch (error: any) {
       console.error("Error loading posts:", error)
       setError(error.message || "Failed to load posts")

       // Show sample posts on error if no posts exist
       if (!append && posts.length === 0) {
         setPosts(getSamplePosts())
       }
     } finally {
       setLoading(false)
       setRefreshing(false)
     }
   },
   [selectedCategory, searchQuery, sortBy, supabase, posts.length],
 )

 // Sample posts for fallback
 const getSamplePosts = (): CommunityPost[] => [
   {
     id: 1,
     content:
       "Welcome to the Erigga community! 🎵 Share your bars, stories, and connect with fellow fans. This is where real music lovers gather!",
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
     content:
       "Just dropped some fire bars 🔥

*They say I'm the king of my city*
*But I tell them I'm just getting started*
*Paper boy flow, now I'm paper rich*
*From the streets to the studio, never departed*",
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
   },
 ]

 // Handle vote
 const handleVote = useCallback(
   async (postId: number) => {
     if (!isAuthenticated) {
       toast.error("Please log in to vote")
       return
     }

     try {
       // Optimistic update
       setPosts((prev) =>
         prev.map((post) =>
           post.id === postId
             ? {
                 ...post,
                 vote_count: post.has_voted ? post.vote_count - 1 : post.vote_count + 1,
                 has_voted: !post.has_voted,
               }
             : post,
         ),
       )

       // TODO: Implement actual voting logic
       toast.success("Vote recorded!")
     } catch (error) {
       console.error("Error voting:", error)
       toast.error("Failed to vote")
       // Revert optimistic update
       loadPosts(1, false)
     }
   },
   [isAuthenticated, loadPosts],
 )

 // Handle refresh
 const handleRefresh = useCallback(() => {
   setRefreshing(true)
   setPage(1)
   loadPosts(1, false)
 }, [loadPosts])

 // Handle load more
 const handleLoadMore = useCallback(() => {
   if (hasMore && !loading) {
     loadPosts(page + 1, true)
   }
 }, [hasMore, loading, page, loadPosts])

 // Handle search
 const handleSearch = useCallback((query: string) => {
   setSearchQuery(query)
   setPage(1)
 }, [])

 // Handle filter change
 const handleFilterChange = useCallback((type: string, value: string) => {
   if (type === "category") {
     setSelectedCategory(value)
   } else if (type === "sort") {
     setSortBy(value)
   }
   setPage(1)
 }, [])

 // Add new post to feed
 const addNewPost = useCallback((newPost: CommunityPost) => {
   setPosts((prev) => [newPost, ...prev])
 }, [])

 // Media player component
 const MediaPlayer = useCallback(
   ({ mediaUrl, mediaType }: { mediaUrl: string; mediaType: string }) => {
     if (mediaType === "image") {
       return (
         <div className="mb-4 rounded-lg overflow-hidden">
           <img
             src={mediaUrl || "/placeholder.svg"}
             alt="Post media"
             className="w-full h-auto max-h-96 object-cover cursor-pointer hover:scale-105 transition-transform"
             onClick={() => window.open(mediaUrl, "_blank")}
             loading="lazy"
           />
         </div>
       )
     }

     if (mediaType === "video") {
       return (
         <div className="mb-4 rounded-lg overflow-hidden bg-black">
           <video controls className="w-full h-auto max-h-96" preload="metadata" playsInline>
             <source src={mediaUrl} type="video/mp4" />
             <source src={mediaUrl} type="video/webm" />
             <source src={mediaUrl} type="video/ogg" />
             Your browser does not support the video tag.
           </video>
         </div>
       )
     }

     if (mediaType === "audio") {
       const isPlaying = playingAudio === mediaUrl

       return (
         <div className="mb-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
           <div className="flex items-center justify-between mb-3">
             <div className="flex items-center space-x-3">
               <Mic className="h-6 w-6 text-blue-500" />
               <span className="font-medium">Audio</span>
             </div>
             <div className="flex items-center space-x-2">
               <Button variant="ghost" size="sm" onClick={() => setAudioMuted(!audioMuted)}>
                 {audioMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
               </Button>
               <Button
                 variant="ghost"
                 size="sm"
                 onClick={() => {
                   if (isPlaying) {
                     setPlayingAudio(null)
                   } else {
                     setPlayingAudio(mediaUrl)
                   }
                 }}
               >
                 {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
               </Button>
             </div>
           </div>
           <audio
             controls
             className="w-full"
             muted={audioMuted}
             onPlay={() => setPlayingAudio(mediaUrl)}
             onPause={() => setPlayingAudio(null)}
             onEnded={() => setPlayingAudio(null)}
           >
             <source src={mediaUrl} type="audio/mpeg" />
             <source src={mediaUrl} type="audio/wav" />
             <source src={mediaUrl} type="audio/ogg" />
             Your browser does not support the audio tag.
           </audio>
         </div>
       )
     }

     return null
   },
   [playingAudio, audioMuted],
 )

 // Post card component
 const PostCard = useCallback(
   ({ post }: { post: CommunityPost }) => (
     <Card className="hover:shadow-md transition-shadow duration-200">
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
         <p className="text-gray-800 mb-4 whitespace-pre-wrap break-words">{post.content}</p>

         {post.media_url && post.media_type && <MediaPlayer mediaUrl={post.media_url} mediaType={post.media_type} />}

         <div className="flex items-center justify-between">
           <div className="flex items-center space-x-4">
             <Button
               variant={post.has_voted ? "default" : "ghost"}
               size="sm"
               onClick={() => handleVote(post.id)}
               className="flex items-center space-x-1 transition-colors"
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
           <span className="text-xs text-gray-500">{post.view_count || 0} views</span>
         </div>
       </CardContent>
     </Card>
   ),
   [getTierColor, handleVote, MediaPlayer],
 )

 // Loading skeleton
 const LoadingSkeleton = useCallback(
   () => (
     <div className="space-y-6">
       {Array.from({ length: 3 }).map((_, i) => (
         <Card key={i} className="animate-pulse">
           <CardHeader>
             <div className="flex items-center space-x-3">
               <Skeleton className="w-10 h-10 rounded-full" />
               <div className="space-y-2">
                 <Skeleton className="h-4 w-24" />
                 <Skeleton className="h-3 w-16" />
               </div>
             </div>
           </CardHeader>
           <CardContent>
             <div className="space-y-3">
               <Skeleton className="h-4 w-full" />
               <Skeleton className="h-4 w-3/4" />
               <Skeleton className="h-48 w-full" />
               <div className="flex space-x-4">
                 <Skeleton className="h-8 w-16" />
                 <Skeleton className="h-8 w-16" />
                 <Skeleton className="h-8 w-16" />
               </div>
             </div>
           </CardContent>
         </Card>
       ))}
     </div>
   ),
   [],
 )

 // Effects
 useEffect(() => {
   loadPosts(1, false)
 }, [selectedCategory, sortBy])

 useEffect(() => {
   const timeoutId = setTimeout(() => {
     if (searchQuery !== undefined) {
       loadPosts(1, false)
     }
   }, 500)

   return () => clearTimeout(timeoutId)
 }, [searchQuery, loadPosts])

 // Memoized filter options
 const sortOptions = useMemo(
   () => [
     { value: "newest", label: "Newest", icon: Clock },
     { value: "trending", label: "Trending", icon: TrendingUp },
     { value: "most_voted", label: "Most Voted", icon: ThumbsUp },
     { value: "oldest", label: "Oldest", icon: Clock },
   ],
   [],
 )

 return (
   <div className={cn("space-y-6", className)}>
     {/* Filters and Search */}
     <Card>
       <CardContent className="p-4">
         <div className="flex flex-col sm:flex-row gap-4">
           {/* Search */}
           <div className="flex-1 relative">
             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
             <Input
               placeholder="Search posts..."
               value={searchQuery}
               onChange={(e) => handleSearch(e.target.value)}
               className="pl-10"
             />
           </div>

           {/* Category Filter */}
           <Select value={selectedCategory} onValueChange={(value) => handleFilterChange("category", value)}>
             <SelectTrigger className="w-full sm:w-48">
               <Filter className="h-4 w-4 mr-2" />
               <SelectValue placeholder="Category" />
             </SelectTrigger>
             <SelectContent>
               <SelectItem value="all">All Categories</SelectItem>
               {categories.map((category) => (
                 <SelectItem key={category.id} value={category.id.toString()}>
                   {category.name}
                 </SelectItem>
               ))}
             </SelectContent>
           </Select>

           {/* Sort Filter */}
           <Select value={sortBy} onValueChange={(value) => handleFilterChange("sort", value)}>
             <SelectTrigger className="w-full sm:w-48">
               <SelectValue placeholder="Sort by" />
             </SelectTrigger>
             <SelectContent>
               {sortOptions.map((option) => {
                 const Icon = option.icon
                 return (
                   <SelectItem key={option.value} value={option.value}>
                     <div className="flex items-center">
                       <Icon className="h-4 w-4 mr-2" />
                       {option.label}
                     </div>
                   </SelectItem>
                 )
               })}
             </SelectContent>
           </Select>

           {/* Refresh Button */}
           <Button variant="outline" onClick={handleRefresh} disabled={refreshing} className="w-full sm:w-auto">
             <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
           </Button>
         </div>
       </CardContent>
     </Card>

     {/* Error Alert */}
     {error && (
       <Alert variant="destructive">
         <AlertCircle className="h-4 w-4" />
         <AlertDescription>{error}</AlertDescription>
       </Alert>
     )}

     {/* Posts Feed */}
     {loading && posts.length === 0 ? (
       <LoadingSkeleton />
     ) : (
       <div className="space-y-6">
         {posts.map((post) => (
           <PostCard key={post.id} post={post} />
         ))}

         {posts.length === 0 && !loading && (
           <Card>
             <CardContent className="text-center py-12">
               <p className="text-gray-500 mb-4">No posts found</p>
               <p className="text-sm text-gray-400">
                 {searchQuery ? "Try adjusting your search terms" : "Be the first to start a conversation!"}
               </p>
             </CardContent>
           </Card>
         )}

         {/* Load More Button */}
         {hasMore && posts.length > 0 && (
           <div className="text-center">
             <Button variant="outline" onClick={handleLoadMore} disabled={loading} className="min-w-[120px]">
               {loading ? (
                 <>
                   <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                   Loading...
                 </>
               ) : (
                 "Load More"
               )}
             </Button>
           </div>
         )}
       </div>
     )}
   </div>
 )
}
