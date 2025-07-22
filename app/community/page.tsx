import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { RealtimeCommunityFeed } from "@/components/community/realtime-community-feed"
import { RealtimeCreatePostForm } from "@/components/community/realtime-create-post-form"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

async function getCommunityData() {
  try {
    const supabase = await createClient()

    // Fetch categories first
    const { data: categories, error: categoriesError } = await supabase
      .from("community_categories")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true })

    if (categoriesError) {
      console.error("Error fetching categories:", categoriesError)
    }

    // Fetch posts with correct table relationships
    const { data: posts, error: postsError } = await supabase
      .from("community_posts")
      .select(`
        *,
        user:users!community_posts_user_id_fkey(
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
          color,
          icon
        )
      `)
      .eq("is_published", true)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .limit(20)

    if (postsError) {
      console.error("Error fetching posts:", postsError)
      return {
        categories: categories || [],
        posts: [],
      }
    }

    // Get current user for vote status
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()
    let currentUserId = null

    if (authUser) {
      const { data: userData } = await supabase.from("users").select("id").eq("auth_user_id", authUser.id).single()

      currentUserId = userData?.id
    }

    // Get vote status for each post if user is logged in
    const postsWithVoteStatus = await Promise.all(
      (posts || []).map(async (post) => {
        let hasVoted = false

        if (currentUserId) {
          const { data: voteData } = await supabase
            .from("community_post_votes")
            .select("user_id")
            .eq("post_id", post.id)
            .eq("user_id", currentUserId)
            .single()

          hasVoted = !!voteData
        }

        return {
          ...post,
          has_voted: hasVoted,
        }
      }),
    )

    return {
      categories: categories || [],
      posts: postsWithVoteStatus,
    }
  } catch (error) {
    console.error("Error in getCommunityData:", error)
    return {
      categories: [],
      posts: [],
    }
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
