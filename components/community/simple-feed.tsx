"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useCommunity } from "@/contexts/community-context"
import { EnhancedPostCard } from "./enhanced-post-card"
import { EnhancedCreatePostForm } from "./enhanced-create-post-form"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw } from "lucide-react"

export function SimpleFeed() {
  const { user } = useAuth()
  const { state, loadPosts, loadCategories } = useCommunity()
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    loadCategories()
    loadPosts(true)
  }, [loadCategories, loadPosts])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadPosts(true)
    setIsRefreshing(false)
  }

  const handleLoadMore = () => {
    if (!state.loading && state.hasMore) {
      loadPosts(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Create Post Form */}
      {user && <EnhancedCreatePostForm categories={state.categories} onPostCreated={() => loadPosts(true)} />}

      {/* Refresh Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Community Posts</h2>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Error State */}
      {state.error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <p>Error: {state.error}</p>
          <Button variant="outline" size="sm" onClick={handleRefresh} className="mt-2 bg-transparent">
            Try Again
          </Button>
        </div>
      )}

      {/* Loading State */}
      {state.loading && state.posts.length === 0 && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
      )}

      {/* Posts */}
      <div className="space-y-6">
        {state.posts.map((post) => (
          <EnhancedPostCard
            key={post.id}
            post={post}
            currentUserId={user?.id}
            onPostUpdate={(updatedPost) => {
              // Handle post update
            }}
          />
        ))}
      </div>

      {/* Load More */}
      {state.hasMore && !state.loading && state.posts.length > 0 && (
        <div className="flex justify-center py-4">
          <Button onClick={handleLoadMore} variant="outline">
            Load More Posts
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!state.loading && state.posts.length === 0 && !state.error && (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg">No posts yet.</p>
          {user && <p className="text-gray-500 mt-2">Be the first to share something!</p>}
        </div>
      )}
    </div>
  )
}
