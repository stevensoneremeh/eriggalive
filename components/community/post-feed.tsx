"use client"

import { useEffect, useCallback } from "react"
import { PostCard, PostCardSkeleton } from "./post-card"
import { useCommunity } from "@/contexts/community-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Search, RefreshCw } from "lucide-react"
import { useDebounce } from "@/hooks/use-debounce"

interface PostFeedProps {
  userId?: string
  categoryFilter?: number
  sortOrder?: string
}

export function PostFeed({ userId, categoryFilter, sortOrder = "newest" }: PostFeedProps) {
  const { state, loadPosts, setFilters } = useCommunity()
  const { posts, loading, error, hasMore, filters } = state

  const debouncedSearchQuery = useDebounce(filters.search, 500)

  // Update filters when props change
  useEffect(() => {
    setFilters({
      category: categoryFilter,
      sort: sortOrder as "newest" | "oldest" | "top",
    })
  }, [categoryFilter, sortOrder, setFilters])

  // Load posts when debounced search changes
  useEffect(() => {
    if (debouncedSearchQuery !== filters.search) {
      setFilters({ search: debouncedSearchQuery })
    }
  }, [debouncedSearchQuery, filters.search, setFilters])

  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore) {
      loadPosts(false)
    }
  }, [loading, hasMore, loadPosts])

  const handleRefresh = useCallback(() => {
    loadPosts(true)
  }, [loadPosts])

  const handleSearchChange = useCallback(
    (value: string) => {
      setFilters({ search: value })
    },
    [setFilters],
  )

  const handleSortChange = useCallback(
    (value: string) => {
      setFilters({ sort: value as "newest" | "oldest" | "top" })
    },
    [setFilters],
  )

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
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={filters.sort} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="top">Top Voted</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="text-center py-10 text-destructive">
          <p>Error: {error}</p>
          <Button variant="outline" onClick={handleRefresh} className="mt-4">
            Try Again
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!loading && posts.length === 0 && !error && (
        <div className="text-center py-10 text-muted-foreground">
          <p>No posts found. {filters.search ? "Try adjusting your search." : "Be the first to post!"}</p>
        </div>
      )}

      {/* Posts */}
      <div className="space-y-6">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} currentUserId={userId} />
        ))}
      </div>

      {/* Load More */}
      {hasMore && posts.length > 0 && (
        <div className="flex justify-center py-4">
          <Button variant="outline" onClick={handleLoadMore} disabled={loading}>
            {loading ? (
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
      {/* Controls skeleton */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-grow">
          <div className="h-10 bg-muted rounded-md animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-10 w-[140px] bg-muted rounded-md animate-pulse" />
          <div className="h-10 w-10 bg-muted rounded-md animate-pulse" />
        </div>
      </div>

      {/* Posts skeleton */}
      {[...Array(count)].map((_, i) => (
        <PostCardSkeleton key={i} />
      ))}
    </div>
  )
}
