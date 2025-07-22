import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { RealtimeCommunityFeed } from "@/components/community/realtime-community-feed"
import { RealtimeCreatePostForm } from "@/components/community/realtime-create-post-form"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

async function getCommunityData() {
  const supabase = await createClient()

  // Fetch categories
  const { data: categories } = await supabase.from("community_categories").select("*").order("name")

  // Fetch initial posts
  const { data: posts } = await supabase
    .from("community_posts")
    .select(`
      *,
      author:profiles!community_posts_author_id_fkey(
        id,
        username,
        full_name,
        avatar_url,
        tier
      ),
      category:community_categories!community_posts_category_id_fkey(
        id,
        name,
        slug,
        color
      ),
      _count:community_post_votes(count),
      user_vote:community_post_votes!left(vote_type),
      user_bookmark:user_bookmarks!left(id)
    `)
    .order("created_at", { ascending: false })
    .limit(20)

  // Transform posts data
  const transformedPosts =
    posts?.map((post) => ({
      ...post,
      vote_count: post._count?.[0]?.count || 0,
      user_voted: post.user_vote?.[0]?.vote_type || null,
      user_bookmarked: !!post.user_bookmark?.[0]?.id,
    })) || []

  return {
    categories: categories || [],
    posts: transformedPosts,
  }
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-32" />
          </div>
        </CardContent>
      </Card>
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-16 w-full" />
              <div className="flex gap-4">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-20" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default async function CommunityPage() {
  const { categories, posts } = await getCommunityData()

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Community</h1>
          <p className="text-muted-foreground">
            Connect with fellow fans, share your thoughts, and stay updated with the latest discussions.
          </p>
        </div>

        <Suspense fallback={<LoadingSkeleton />}>
          <div className="space-y-6">
            <RealtimeCreatePostForm categories={categories} />

            <RealtimeCommunityFeed initialPosts={posts} />
          </div>
        </Suspense>
      </div>
    </div>
  )
}
