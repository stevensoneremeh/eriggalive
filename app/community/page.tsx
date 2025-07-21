import { Suspense } from "react"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { RealtimeCommunityFeed } from "@/components/community/realtime-community-feed"
import { RealtimeCreatePostForm } from "@/components/community/realtime-create-post-form"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

async function getCommunityPosts() {
  try {
    const supabase = createServerComponentClient({ cookies })

    const { data: posts, error } = await supabase
      .from("community_posts")
      .select(`
        *,
        user:profiles(id, username, full_name, avatar_url, tier),
        category:community_categories(id, name, slug, color, icon),
        votes:community_votes(vote_type),
        bookmarks:user_bookmarks(id),
        _count:community_comments(count)
      `)
      .order("created_at", { ascending: false })
      .limit(20)

    if (error) {
      console.error("Error fetching posts:", error)
      return []
    }

    return posts || []
  } catch (error) {
    console.error("Error in getCommunityPosts:", error)
    return []
  }
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {[...Array(3)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4 mb-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-4 w-[100px]" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default async function CommunityPage() {
  const posts = await getCommunityPosts()

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Community</h1>
          <p className="text-lg text-muted-foreground">
            Connect with fellow fans, share your thoughts, and stay updated with the latest discussions.
          </p>
        </div>

        <Suspense fallback={<LoadingSkeleton />}>
          <RealtimeCreatePostForm />
        </Suspense>

        <Suspense fallback={<LoadingSkeleton />}>
          <RealtimeCommunityFeed initialPosts={posts} />
        </Suspense>
      </div>
    </div>
  )
}
