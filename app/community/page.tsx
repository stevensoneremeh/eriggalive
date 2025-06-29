import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { CreatePostForm } from "@/components/community/create-post-form-final"
import { PostFeed } from "@/components/community/post-feed"
import { CommunityLayout } from "@/components/community/community-layout"
import { SimpleLoading } from "@/components/simple-loading"

async function getCommunityData() {
  try {
    const supabase = await createClient()

    // Get categories with error handling
    const { data: categories, error: categoriesError } = await supabase
      .from("community_categories")
      .select("*")
      .order("name")

    if (categoriesError) {
      console.error("Error fetching categories:", categoriesError)
    }

    // Get posts with user data and error handling
    const { data: posts, error: postsError } = await supabase
      .from("community_posts")
      .select(`
        *,
        user:users(id, username, full_name, avatar_url, tier),
        category:community_categories(id, name, color)
      `)
      .order("created_at", { ascending: false })
      .limit(20)

    if (postsError) {
      console.error("Error fetching posts:", postsError)
    }

    return {
      categories: categories || [],
      posts: posts || [],
    }
  } catch (error) {
    console.error("Error in getCommunityData:", error)
    return {
      categories: [],
      posts: [],
    }
  }
}

export default async function CommunityPage() {
  const { categories, posts } = await getCommunityData()

  return (
    <CommunityLayout>
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Erigga Community</h1>
          <p className="text-muted-foreground">Connect with fellow fans, share your thoughts, and stay updated</p>
        </div>

        <Suspense fallback={<SimpleLoading />}>
          <CreatePostForm categories={categories || []} />
        </Suspense>

        <Suspense fallback={<SimpleLoading />}>
          <PostFeed initialPosts={posts || []} categories={categories || []} userId={undefined} />
        </Suspense>
      </div>
    </CommunityLayout>
  )
}
