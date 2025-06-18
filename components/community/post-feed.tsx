"use client" // This component will fetch data client-side for pagination/sorting

import { useEffect, useState, useCallback } from "react"
import { PostCard, PostCardSkeleton } from "./post-card"
import type { CommunityPost } from "@/types/database"
import { fetchCommunityPosts } from "@/lib/community-actions" // Assuming this can be called client-side or use a client-specific fetcher
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { useInView } from "react-intersection-observer"

interface PostFeedProps {
  userId?: string // Current logged-in user's ID, for vote status
  categoryFilter?: number
  sortOrder?: string
}

export function PostFeed({ userId, categoryFilter, sortOrder }: PostFeedProps) {
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { ref, inView } = useInView({
    threshold: 0,
    triggerOnce: false, // Keep triggering to load more
  })

  const loadMorePosts = useCallback(async () => {
    if (!hasMore || loading) return
    setLoading(true)
    try {
      const {
        posts: newPosts,
        count,
        error: fetchError,
      } = await fetchCommunityPosts(
        userId,
        categoryFilter,
        sortOrder,
        page,
        10, // Limit per page
      )
      if (fetchError) throw new Error(fetchError)

      setPosts((prev) => (page === 1 ? newPosts : [...prev, ...newPosts]))
      setHasMore(newPosts.length === 10) // Assuming limit is 10
      setPage((prev) => prev + 1)
    } catch (err: any) {
      setError(err.message || "Failed to load posts.")
    } finally {
      setLoading(false)
    }
  }, [userId, categoryFilter, sortOrder, page, hasMore, loading])

  // Initial load and when filters/sort change
  useEffect(() => {
    setPosts([]) // Reset posts
    setPage(1) // Reset page
    setHasMore(true) // Reset hasMore
    setLoading(true) // Set loading for initial fetch
    // The actual fetch will be triggered by loadMorePosts due to page reset
    // or by inView if the initial container is small.
    // To ensure initial load, we can call it directly if page is 1.
    // This effect will run, then loadMorePosts will be called.
  }, [categoryFilter, sortOrder, userId])

  useEffect(() => {
    // If page is 1 and not loading, it means filters changed and we need an initial fetch.
    // Or if inView is true and there are more posts to load.
    if ((page === 1 && !loading && posts.length === 0 && hasMore) || (inView && hasMore && !loading)) {
      loadMorePosts()
    }
  }, [page, loading, posts.length, hasMore, inView, loadMorePosts])

  if (loading && posts.length === 0) {
    return <PostFeedSkeleton count={5} />
  }

  if (error && posts.length === 0) {
    return <div className="text-center py-10 text-destructive">Error: {error}</div>
  }

  if (posts.length === 0 && !loading && !hasMore) {
    return <div className="text-center py-10 text-muted-foreground">No posts found. Be the first to share!</div>
  }

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} currentUserId={userId} />
      ))}
      {loading && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      {!loading && hasMore && (
        <div ref={ref} className="flex justify-center py-4">
          <Button variant="outline" onClick={loadMorePosts} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Load More"}
          </Button>
        </div>
      )}
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
