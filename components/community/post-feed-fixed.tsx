"use client"

import { useEffect, useState, useCallback } from "react"
import { PostCard, PostCardSkeleton } from "./post-card-fixed"
import type { CommunityPost } from "@/types/database"
import { fetchCommunityPosts } from "@/lib/community-actions-fixed"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Search } from "lucide-react"
import { useDebounce } from "@/hooks/use-debounce"

interface PostFeedProps {
  userId?: string
  categoryFilter?: number
  initialSortOrder?: string
}

export function PostFeed({ userId, categoryFilter, initialSortOrder = "newest" }: PostFeedProps) {
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState(initialSortOrder)
  const [searchQuery, setSearchQuery] = useState("")
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  const debouncedSearchQuery = useDebounce(searchQuery, 500)

  const loadPosts = useCallback(
    async (reset = false) => {
      if (loading && !reset) return

      const currentPage = reset ? 1 : page
      if (reset) {
        setLoading(true)
      } else {
        setLoadingMore(true)
      }

      try {
        const { posts: newPosts, error: fetchError } = await fetchCommunityPosts(userId, {
          categoryFilter,
          sortOrder,
          page: currentPage,
          limit: 10,
          searchQuery: debouncedSearchQuery,
        })

        if (fetchError) {
          throw new Error(fetchError)
        }

        if (reset) {
          setPosts(newPosts)
          setPage(2)
        } else {
          setPosts((prev) => [...prev, ...newPosts])
          setPage((prev) => prev + 1)
        }

        setHasMore(newPosts.length === 10)
        setError(null)
      } catch (err: any) {
        console.error("Load posts error:", err)
        setError(err.message || "Failed to load posts")
        if (reset) {
          setPosts([])
        }
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [userId, categoryFilter, sortOrder, debouncedSearchQuery, page, loading],
  )

  // Initial load and when filters change
  useEffect(() => {
    setPosts([])
    setPage(1)
    setHasMore(true)
    setError(null)
    loadPosts(true)
  }, [categoryFilter, sortOrder, debouncedSearchQuery, userId])

  const handlePostDeleted = (postId: number) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId))
  }

  const handlePostUpdated = (updatedPost: CommunityPost) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === updatedPost.id ? { ...p, ...updatedPost, user: p.user, category: p.category } : p)),
    )
  }

  if (loading && posts.length === 0) {
    return <PostFeedSkeleton count={5} />
  }

  return (
    <div className="space-y-6">
      {/* Search and Sort Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="search"
            placeholder="Search posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={sortOrder} onValueChange={setSortOrder}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="oldest">Oldest</SelectItem>
            <SelectItem value="top">Top Voted</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Error State */}
      {error && (
        <div className="text-center py-10 text-destructive">
          <p>Error: {error}</p>
          <Button variant="outline" onClick={() => loadPosts(true)} className="mt-4">
            Try Again
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!loading && posts.length === 0 && !error && (
        <div className="text-center py-10 text-muted-foreground">
          <p>No posts found. Try adjusting your search or filters.</p>
        </div>
      )}

      {/* Posts */}
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          currentUserId={userId}
          onPostDeleted={handlePostDeleted}
          onPostUpdated={handlePostUpdated}
        />
      ))}

      {/* Load More */}
      {hasMore && posts.length > 0 && (
        <div className="flex justify-center py-4">
          <Button variant="outline" onClick={() => loadPosts()} disabled={loadingMore}>
            {loadingMore ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Load More"
            )}
          </Button>
        </div>
      )}

      {/* End of Posts */}
      {!hasMore && posts.length > 0 && (
        <p className="text-center text-muted-foreground py-4">You've reached the end!</p>
      )}
    </div>
  )
}

export function PostFeedSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-6">
      {[...Array(count)].map((_, i) => (
        <PostCardSkeleton key={i} />
      ))}
    </div>
  )
}
