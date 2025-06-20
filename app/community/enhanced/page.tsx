"use client"

import { Suspense } from "react"
import { CommunityLayout } from "@/components/community/community-layout"
import { EnhancedPostCardSafe } from "@/components/community/enhanced-post-card-safe"
import { HashtagTrending } from "@/components/community/hashtag-trending"
import { SimpleNotificationBell } from "@/components/community/simple-notification-bell"
import { PostCardSkeleton } from "@/components/community/enhanced-post-card"

// This is a NEW enhanced community page that doesn't replace the existing one
export default function EnhancedCommunityPage() {
  return (
    <CommunityLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">Enhanced Community</h1>
              <SimpleNotificationBell />
            </div>

            <Suspense fallback={<PostCardSkeleton />}>
              {/* This would use the existing community data */}
              <div className="space-y-6">
                {/* Demo post */}
                <EnhancedPostCardSafe
                  post={{
                    id: 1,
                    content: "Welcome to the enhanced community experience! 🎵 #EriggaLive #NewFeatures",
                    created_at: new Date().toISOString(),
                    vote_count: 15,
                    comment_count: 3,
                    view_count: 45,
                    user: {
                      username: "demo_user",
                      full_name: "Demo User",
                      avatar_url: "/placeholder-user.jpg",
                      tier: "grassroot",
                    },
                    category: {
                      name: "General",
                      slug: "general",
                    },
                  }}
                />
              </div>
            </Suspense>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <HashtagTrending />
          </div>
        </div>
      </div>
    </CommunityLayout>
  )
}
