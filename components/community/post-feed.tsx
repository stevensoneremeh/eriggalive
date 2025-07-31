"use client"

import { useState, useEffect, useCallback } from "react"
import { PostCard } from "./post-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Search, RefreshCw } from "lucide-react"
import { useDebounce } from "@/hooks/use-debounce"
import { fetchCommunityPosts } from "@/lib/community-actions"

interface PostFeedProps {
  initialPosts: any[]
  userId?: string
  onVoteUpdate?: (postId: number, newVoteCount: number, hasVoted: boolean) => void
  categories: any[]
  categoryFilter?: number
  sortOrder?: string
}

export function PostFeed({
  initialPosts,
  userId,
  onVoteUpdate,
  categories,
  categoryFilter,
  sortOrder = "newest",
}: PostFeedProps) {
  const [posts, setPosts] = useState(initialPosts)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSort, setSelectedSort] = useState(sortOrder)
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(categoryFilter)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)

  const debouncedSearchQuery = useDebounce(searchQuery, 500)

  const loadPosts = useCallback(
    async (isRefresh = false) => {
      setLoading(true)

      try {
        const currentPage = isRefresh ? 1 : page
        const result = await fetchCommunityPosts(userId, {
          categoryFilter: selectedCategory,
          sortOrder: selectedSort,
          page: currentPage,
          limit: 10,
          searchQuery: debouncedSearchQuery,
        })

        if (result.error) {
          console.error("Error loading posts:", result.error)
          return
        }

        if (isRefresh) {
          setPosts(result.posts)
          setPage(2)
        } else {
          setPosts((prev) => [...prev, ...result.posts])
          setPage((prev) => prev + 1)
        }

        setHasMore(result.posts.length === 10)
      } catch (error) {
        console.error("Error loading posts:", error)
      } finally {
        setLoading(false)
      }
    },
    [userId, selectedCategory, selectedSort, debouncedSearchQuery, page],
  )

  useEffect(() => {
    setPosts(initialPosts)
  }, [initialPosts])

  useEffect(() => {
    if (debouncedSearchQuery !== searchQuery || selectedSort !== sortOrder || selectedCategory !== categoryFilter) {
      loadPosts(true)
    }
  }, [debouncedSearchQuery, selectedSort, selectedCategory])

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      loadPosts(false)
    }
  }

  const handleRefresh = () => {
    loadPosts(true)
  }

  const handleVoteUpdate = (postId: number, newVoteCount: number, hasVoted: boolean) => {
    setPosts((prev) =>
      prev.map((post) => (post.id === postId ? { ...post, vote_count: newVoteCount, has_voted: hasVoted } : post)),
    )
    onVoteUpdate?.(postId, newVoteCount, hasVoted)
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

        <div className="flex items-center gap-2">
          <Select
            value={selectedCategory?.toString() || "all"}
            onValueChange={(value) => setSelectedCategory(value ? Number(value) : undefined)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All Categories" />
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

          <Select value={selectedSort} onValueChange={setSelectedSort}>
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

      {/* Empty State */}
      {!loading && posts.length === 0 && (
        <div className="text-center py-10 text-muted-foreground">
          <p>No posts found. {searchQuery ? "Try adjusting your search." : "Be the first to post!"}</p>
        </div>
      )}

      {/* Posts */}
      <div className="space-y-6">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} currentUserId={userId} onVoteUpdate={handleVoteUpdate} />
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
