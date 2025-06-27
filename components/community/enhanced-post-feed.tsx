"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client" // Client-side Supabase
import { useAuth } from "@/contexts/auth-context" // For client-side auth state if needed beyond initial load
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Search,
  Filter,
  RefreshCw,
  Mic,
  Play,
  Pause,
  Volume2,
  VolumeX,
  AlertCircle,
  Clock,
  ThumbsUp,
  Loader2,
  Eye,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { voteOnPostAction, fetchCommunityPosts } from "@/lib/community-actions" // Import server actions
import type { CommunityPost as CommunityPostType, CommunityCategory } from "@/types/database" // Use your defined types
import { useRouter, useSearchParams, usePathname } from "next/navigation" // For managing URL state for filters

interface EnhancedPostFeedProps {
  initialPosts?: CommunityPostType[]
  categories: CommunityCategory[]
  totalCount?: number
  loggedInAuthUserId: string | null
  className?: string
}

const POSTS_PER_PAGE = 10

export function EnhancedPostFeed({
  initialPosts = [],
  categories,
  // totalCount: initialTotalCount = 0, // We'll fetch total count client-side for dynamic loads
  loggedInAuthUserId,
  className,
}: EnhancedPostFeedProps) {
  const { user: authContextUser, isAuthenticated } = useAuth() // from AuthContext
  const supabase = createClient() // client-side supabase
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // State for posts and loading
  const [posts, setPosts] = useState<CommunityPostType[]>(initialPosts)
  const [isLoading, setIsLoading] = useState(false) // For subsequent loads
  const [isVoting, setIsVoting] = useState<Record<number, boolean>>({})
  const [error, setError] = useState<string | null>(null)

  // Filters and pagination state derived from URL or defaults
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get("page")) || 1)
  const [currentSortBy, setCurrentSortBy] = useState(searchParams.get("sort") || "newest")
  const [currentCategory, setCurrentCategory] = useState(searchParams.get("category") || "all")
  const [currentSearchQuery, setCurrentSearchQuery] = useState(searchParams.get("q") || "")
  const [totalPosts, setTotalPosts] = useState(0) // Will be updated by fetch

  // Audio state
  const [playingAudio, setPlayingAudio] = useState<string | null>(null)
  const [audioMuted, setAudioMuted] = useState(false)

  const getTierColor = useCallback((tier?: string) => {
    switch (tier?.toLowerCase()) {
      case "blood":
        return "bg-red-500 hover:bg-red-600"
      case "pioneer":
        return "bg-blue-500 hover:bg-blue-600"
      case "elder":
        return "bg-purple-500 hover:bg-purple-600"
      case "grassroot":
        return "bg-green-500 hover:bg-green-600"
      default:
        return "bg-gray-500 hover:bg-gray-600"
    }
  }, [])

  const updateURLParams = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())
    if (currentPage > 1) params.set("page", currentPage.toString())
    else params.delete("page")

    if (currentSortBy !== "newest") params.set("sort", currentSortBy)
    else params.delete("sort")

    if (currentCategory !== "all") params.set("category", currentCategory)
    else params.delete("category")

    if (currentSearchQuery) params.set("q", currentSearchQuery)
    else params.delete("q")

    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }, [currentPage, currentSortBy, currentCategory, currentSearchQuery, pathname, router, searchParams])

  const loadPosts = useCallback(
    async (pageToLoad: number, append = false) => {
      setIsLoading(true)
      setError(null)
      try {
        const categoryFilter = currentCategory === "all" || currentCategory === "" ? undefined : Number(currentCategory)
        const result = await fetchCommunityPosts(loggedInAuthUserId, {
          page: pageToLoad,
          limit: POSTS_PER_PAGE,
          sortOrder: currentSortBy as "newest" | "oldest" | "top",
          categoryFilter: categoryFilter,
          searchQuery: currentSearchQuery,
        })

        if (result.error) throw new Error(result.error)

        // @ts-ignore
        setPosts((prev) => (append ? [...prev, ...result.posts] : result.posts))
        // @ts-ignore
        setTotalPosts(result.totalCount || 0) // Assuming fetchCommunityPosts returns totalCount
        setCurrentPage(pageToLoad)
      } catch (err: any) {
        console.error("Error loading posts client-side:", err)
        setError(err.message || "Failed to load posts.")
        // Optionally set sample posts on error if needed
      } finally {
        setIsLoading(false)
      }
    },
    [currentCategory, currentSearchQuery, currentSortBy, loggedInAuthUserId],
  )

  useEffect(() => {
    // Initial load is handled by SSR, this effect is for client-side changes to filters
    // Debounce search query effect
    const handler = setTimeout(() => {
      if (
        searchParams.get("q") !== currentSearchQuery ||
        searchParams.get("sort") !== currentSortBy ||
        searchParams.get("category") !== currentCategory ||
        searchParams.get("page") !== currentPage.toString()
      ) {
        // Only load if query params from URL are different from current state,
        // or if it's not the initial render with initialPosts
        if (
          posts === initialPosts &&
          currentPage === 1 &&
          currentSearchQuery === "" &&
          currentCategory === "all" &&
          currentSortBy === "newest"
        ) {
          // This is the initial state, posts are from SSR.
          // We still need to fetch total count if not provided or if it's 0 from SSR.
          // For simplicity, we can just let it load if we want to ensure client-side fetch logic is robust.
        } else {
          loadPosts(1, false) // Reset to page 1 on filter change
        }
        updateURLParams()
      }
    }, 500) // Debounce search
    return () => clearTimeout(handler)
  }, [
    currentSearchQuery,
    currentSortBy,
    currentCategory,
    updateURLParams,
    loadPosts,
    initialPosts,
    posts,
    currentPage,
    searchParams,
  ])

  const handleVote = useCallback(
    async (postId: number, postCreatorAuthId: string) => {
      if (!isAuthenticated || !loggedInAuthUserId) {
        toast.error("Please log in to vote.")
        router.push("/login?redirect=/community")
        return
      }
      if (isVoting[postId]) return

      setIsVoting((prev) => ({ ...prev, [postId]: true }))

      // Optimistic update
      const originalPosts = [...posts]
      setPosts((prevPosts) =>
        prevPosts.map((p) =>
          p.id === postId
            ? { ...p, vote_count: p.has_voted ? p.vote_count - 1 : p.vote_count + 1, has_voted: !p.has_voted }
            : p,
        ),
      )

      const result = await voteOnPostAction(postId, postCreatorAuthId)
      setIsVoting((prev) => ({ ...prev, [postId]: false }))

      if (result.success) {
        toast.success(result.message || "Vote recorded!")
        // Server action revalidates, so data will eventually be consistent.
        // If immediate consistency is needed without full re-fetch, update post from result.data if available.
      } else {
        toast.error(result.error || "Failed to vote.")
        setPosts(originalPosts) // Revert optimistic update
      }
    },
    [isAuthenticated, loggedInAuthUserId, router, posts, isVoting],
  )

  const handleRefresh = () => {
    loadPosts(1, false)
    updateURLParams()
  }
  const handleLoadMore = () => loadPosts(currentPage + 1, true)

  const MediaPlayer = useCallback(
    ({ mediaUrl, mediaType }: { mediaUrl?: string; mediaType?: string }) => {
      if (!mediaUrl || !mediaType) return null

      if (mediaType === "image") {
        return (
          <div className="my-3 rounded-lg overflow-hidden border dark:border-gray-700">
            <img
              src={mediaUrl || "/placeholder.svg"}
              alt="Post media"
              className="w-full h-auto max-h-[500px] object-contain cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => window.open(mediaUrl, "_blank")}
              loading="lazy"
            />
          </div>
        )
      }
      if (mediaType === "video") {
        return (
          <div className="my-3 rounded-lg overflow-hidden bg-black aspect-video">
            <video controls className="w-full h-full" preload="metadata" playsInline>
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
          <div className="my-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg border dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                {" "}
                <Mic className="h-5 w-5 text-primary" /> <span className="font-medium text-sm">Audio Clip</span>{" "}
              </div>
              <div className="flex items-center space-x-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setAudioMuted(!audioMuted)}>
                  {" "}
                  {audioMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}{" "}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setPlayingAudio(isPlaying ? null : mediaUrl)}
                >
                  {" "}
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}{" "}
                </Button>
              </div>
            </div>
            <audio
              src={mediaUrl}
              controls
              className="w-full h-10"
              muted={audioMuted}
              onPlay={() => setPlayingAudio(mediaUrl)}
              onPause={() => setPlayingAudio(null)}
              onEnded={() => setPlayingAudio(null)}
            >
              {" "}
              Your browser does not support the audio tag.{" "}
            </audio>
          </div>
        )
      }
      return <p className="text-sm text-muted-foreground my-2">Unsupported media type: {mediaType}</p>
    },
    [playingAudio, audioMuted],
  )

  const PostCard = useCallback(
    ({ post }: { post: CommunityPostType }) => (
      <Card className="hover:shadow-lg transition-shadow duration-300 ease-in-out">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="w-11 h-11 border-2 border-transparent group-hover:border-primary transition-colors">
                <AvatarImage src={post.user?.avatar_url || "/placeholder-user.jpg"} alt={post.user?.username} />
                <AvatarFallback>{post.user?.username?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="font-semibold text-sm hover:underline cursor-pointer">
                    {post.user?.username || "Unknown User"}
                  </span>
                  {post.user?.tier && (
                    <Badge
                      variant="default"
                      className={`${getTierColor(post.user.tier)} text-white text-[10px] px-1.5 py-0 leading-tight`}
                    >
                      {post.user.tier}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center space-x-1.5 text-[11px] text-gray-500 dark:text-gray-400">
                  <span className="hover:underline cursor-pointer">{post.category?.name || "General"}</span>
                  <span>•</span>
                  <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 -mr-2 -mt-1"
            >
              {" "}
              <MoreHorizontal className="w-5 h-5" />{" "}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-1 pb-3">
          {post.content && (
            <p className="text-gray-800 dark:text-gray-200 mb-2 whitespace-pre-wrap break-words text-sm leading-relaxed">
              {post.content}
            </p>
          )}
          {post.media_url && post.media_type && <MediaPlayer mediaUrl={post.media_url} mediaType={post.media_type} />}
        </CardContent>
        <CardFooter className="pt-2 pb-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 border-t dark:border-gray-700 px-5">
          <div className="flex items-center space-x-3">
            <Button
              variant={post.has_voted ? "secondary" : "ghost"}
              size="sm"
              onClick={() => handleVote(post.id, post.user.auth_user_id)}
              disabled={isVoting[post.id]}
              className="flex items-center space-x-1.5 h-7 px-2 py-1"
            >
              {isVoting[post.id] ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Heart
                  className={`w-3.5 h-3.5 ${post.has_voted ? "fill-red-500 text-red-500" : "text-gray-500 dark:text-gray-400"}`}
                />
              )}
              <span className="text-xs">{post.vote_count}</span>
            </Button>
            <Button variant="ghost" size="sm" className="flex items-center space-x-1.5 h-7 px-2 py-1">
              {" "}
              <MessageCircle className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />{" "}
              <span className="text-xs">{post.comment_count}</span>{" "}
            </Button>
            <Button variant="ghost" size="sm" className="h-7 px-2 py-1">
              {" "}
              <Share2 className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />{" "}
            </Button>
          </div>
          <div className="flex items-center space-x-1">
            <Eye className="w-3.5 h-3.5" />
            <span>{post.view_count || 0}</span>
          </div>
        </CardFooter>
      </Card>
    ),
    [getTierColor, handleVote, MediaPlayer, isVoting],
  )

  const LoadingSkeletons = () => (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardHeader className="pb-2">
            <div className="flex items-center space-x-3">
              {" "}
              <Skeleton className="w-11 h-11 rounded-full" />{" "}
              <div className="space-y-1.5">
                {" "}
                <Skeleton className="h-4 w-24" /> <Skeleton className="h-3 w-32" />{" "}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-1 pb-3 space-y-2">
            {" "}
            <Skeleton className="h-4 w-full" /> <Skeleton className="h-4 w-5/6" />{" "}
            <Skeleton className="h-40 w-full rounded-md" />{" "}
          </CardContent>
          <CardFooter className="pt-2 pb-3 flex items-center justify-between border-t dark:border-gray-700 px-5">
            {" "}
            <div className="flex space-x-3">
              {" "}
              <Skeleton className="h-7 w-12" /> <Skeleton className="h-7 w-12" /> <Skeleton className="h-7 w-10" />
            </div>{" "}
            <Skeleton className="h-4 w-10" />{" "}
          </CardFooter>
        </Card>
      ))}
    </div>
  )

  const hasMorePosts = posts.length < totalPosts

  return (
    <div className={cn("space-y-6", className)}>
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search posts..."
                value={currentSearchQuery}
                onChange={(e) => setCurrentSearchQuery(e.target.value)}
                className="pl-8 text-sm h-9"
              />
            </div>
            <Select
              value={currentCategory}
              onValueChange={(value) => {
                setCurrentCategory(value)
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-full sm:w-auto text-sm h-9">
                {" "}
                <Filter className="h-3.5 w-3.5 mr-1.5" /> <SelectValue placeholder="Category" />{" "}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={currentSortBy}
              onValueChange={(value) => {
                setCurrentSortBy(value)
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-full sm:w-auto text-sm h-9">
                {" "}
                <SelectValue placeholder="Sort by" />{" "}
              </SelectTrigger>
              <SelectContent>
                {[
                  { value: "newest", label: "Newest", icon: Clock },
                  { value: "top", label: "Top Voted", icon: ThumbsUp },
                  { value: "oldest", label: "Oldest", icon: Clock },
                ].map((opt) => {
                  const Icon = opt.icon
                  return (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex items-center">
                        <Icon className="h-3.5 w-3.5 mr-1.5" />
                        {opt.label}
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isLoading}
              className="w-full sm:w-auto h-9 px-3"
            >
              {" "}
              <RefreshCw className={cn("h-4 w-4", isLoading && currentPage === 1 && "animate-spin")} />{" "}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading && posts.length === 0 && currentPage === 1 ? <LoadingSkeletons /> : null}

      <div className="space-y-4">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      {posts.length === 0 && !isLoading && (
        <Card>
          <CardContent className="text-center py-10">
            <p className="text-gray-500 dark:text-gray-400">No posts found.</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {currentSearchQuery || currentCategory !== "all"
                ? "Try adjusting your filters."
                : "Be the first to share something!"}
            </p>
          </CardContent>
        </Card>
      )}

      {hasMorePosts && !isLoading && (
        <div className="text-center mt-6">
          <Button variant="outline" onClick={handleLoadMore} disabled={isLoading} className="min-w-[120px]">
            {isLoading && currentPage > 1 ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              "Load More Posts"
            )}
          </Button>
        </div>
      )}
      {!hasMorePosts && posts.length > 0 && !isLoading && (
        <p className="text-center text-sm text-muted-foreground py-4">You've reached the end!</p>
      )}
    </div>
  )
}
