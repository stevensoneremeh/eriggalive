"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { RealtimeChannel } from "@supabase/supabase-js"
import { PostCard, PostCardSkeleton } from "./post-card"
import type { CommunityPost, Database } from "@/types/database"
import { fetchCommunityPosts } from "@/lib/community-actions"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { useInView } from "react-intersection-observer"
import { Input } from "@/components/ui/input" // For search
import { useDebounce } from "@/hooks/use-debounce" // Custom hook for debouncing search

interface PostFeedProps {
  userId?: string
  categoryFilter?: number
  initialSortOrder?: string
}

export function PostFeed({ userId, categoryFilter, initialSortOrder = "newest" }: PostFeedProps) {
  const supabase = createClientComponentClient<Database>()
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState(initialSortOrder)
  const [searchQuery, setSearchQuery] = useState("")
  const debouncedSearchQuery = useDebounce(searchQuery, 500)

  const { ref, inView } = useInView({ threshold: 0.1, triggerOnce: false })
  const initialLoadDone = useRef(false)

  const loadPosts = useCallback(
    async (reset = false) => {
      if (!hasMore && !reset) return
      setLoading(true)
      const currentPage = reset ? 1 : page
      try {
        const { posts: newPosts, error: fetchError } = await fetchCommunityPosts(userId, {
          categoryFilter,
          sortOrder,
          page: currentPage,
          limit: 10,
          searchQuery: debouncedSearchQuery,
        })

        if (fetchError) throw new Error(fetchError)

        setPosts((prev) => (reset ? newPosts : [...prev, ...newPosts]))
        setHasMore(newPosts.length === 10)
        if (reset) setPage(2)
        else setPage((prev) => prev + 1)
        setError(null)
      } catch (err: any) {
        setError(err.message || "Failed to load posts.")
      } finally {
        setLoading(false)
        if (reset) initialLoadDone.current = true
      }
    },
    [userId, categoryFilter, sortOrder, page, hasMore, debouncedSearchQuery],
  )

  // Initial load and when filters/sort/search change
  useEffect(() => {
    initialLoadDone.current = false
    setPosts([])
    setPage(1)
    setHasMore(true)
    loadPosts(true) // `true` to reset and fetch page 1
  }, [categoryFilter, sortOrder, debouncedSearchQuery, userId]) // userId dependency for re-fetching vote status

  // Infinite scroll trigger
  useEffect(() => {
    if (inView && hasMore && !loading && initialLoadDone.current) {
      loadPosts()
    }
  }, [inView, hasMore, loading, loadPosts])

  // Realtime for new posts
  useEffect(() => {
    const postChannel: RealtimeChannel = supabase
      .channel("community_posts_feed")
      .on<CommunityPost>(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "community_posts" },
        async (payload) => {
          // Check if the new post matches current filters (category, search)
          const newPost = payload.new as CommunityPost
          let matchesFilters = true
          if (categoryFilter && newPost.category_id !== categoryFilter) {
            matchesFilters = false
          }
          // Basic search query check (can be more sophisticated)
          if (debouncedSearchQuery && !newPost.content.toLowerCase().includes(debouncedSearchQuery.toLowerCase())) {
            matchesFilters = false
          }

          if (matchesFilters) {
            // Fetch full post data with user/category details
            const { data: fullPostData, error: fetchError } = await supabase
              .from("community_posts")
              .select(
                `*, user:users!community_posts_user_id_fkey(*), category:community_categories(*), votes:community_post_votes(user_id)`,
              )
              .eq("id", newPost.id)
              .single()

            if (fetchError || !fullPostData) return

            const postWithDetails = {
              ...fullPostData,
              user: fullPostData.user,
              category: fullPostData.category,
              has_voted: userId ? fullPostData.votes.some((v) => v.user_id === userId) : false,
            } as CommunityPost

            setPosts((prevPosts) => {
              // Avoid duplicates if already fetched
              if (prevPosts.find((p) => p.id === postWithDetails.id)) return prevPosts
              // Add to top if sorted by newest, else to bottom (or re-sort)
              return sortOrder === "newest" ? [postWithDetails, ...prevPosts] : [...prevPosts, postWithDetails]
            })
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(postChannel)
    }
  }, [supabase, categoryFilter, debouncedSearchQuery, sortOrder, userId])

  const handlePostDeleted = (postId: number) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId))
  }

  const handlePostUpdated = (updatedPost: CommunityPost) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === updatedPost.id ? { ...p, ...updatedPost, user: p.user, category: p.category } : p)),
    ) // Preserve joined data if not in payload
  }

  if (loading && posts.length === 0 && !initialLoadDone.current) {
    return <PostFeedSkeleton count={5} />
  }

  if (error && posts.length === 0) {
    return <div className="text-center py-10 text-destructive">Error: {error}</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <Input
          type="search"
          placeholder="Search posts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-grow"
        />
        {/* Basic Sort Dropdown - can be improved */}
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          className="p-2 border rounded-md bg-background text-sm h-10"
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="top">Top Voted</option>
        </select>
      </div>

      {posts.length === 0 && !loading && (
        <div className="text-center py-10 text-muted-foreground">
          No posts found. Try adjusting your search or filters.
        </div>
      )}

      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          currentUserId={userId}
          onPostDeleted={handlePostDeleted}
          onPostUpdated={handlePostUpdated}
        />
      ))}
      {loading && posts.length > 0 && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      {!loading && hasMore && (
        <div ref={ref} className="flex justify-center py-4">
          <Button variant="outline" onClick={() => loadPosts()} disabled={loading}>
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

// PostFeedSkeleton remains the same
export function PostFeedSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-6">
      {[...Array(count)].map((_, i) => (
        <PostCardSkeleton key={i} />
      ))}
    </div>
  )
}
