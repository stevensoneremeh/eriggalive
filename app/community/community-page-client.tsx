"use client"

import { useState } from "react"
import { CreatePostFormSimple } from "@/components/community/create-post-form-simple"
import { PostFeedSimple } from "@/components/community/post-feed-simple"

interface CommunityPageClientProps {
  categories: Array<{ id: number; name: string; slug: string }>
  user: any
  currentCategory?: { id: number; name: string; slug: string }
}

export function CommunityPageClient({ categories, user, currentCategory }: CommunityPageClientProps) {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handlePostCreated = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto px-4">
      {user && <CreatePostFormSimple categories={categories} onPostCreated={handlePostCreated} />}

      <PostFeedSimple refreshTrigger={refreshTrigger} />
    </div>
  )
}
