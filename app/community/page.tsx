import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { CreatePostForm } from "@/components/community/create-post-form-final"
import { PostFeed } from "@/components/community/post-feed"
import { CommunityLayout } from "@/components/community/community-layout"
import { SimpleLoading } from "@/components/simple-loading"

async function getCommunityData() {
  const supabase = await createClient()

  // Get categories
  const { data: categories, error: categoriesError } = await supabase
    .from("community_categories")
    .select("*")
    .order("name")

  if (categoriesError) {
    console.error("Error fetching categories:", categoriesError)
    return { categories: [], posts: [] }
  }

  // Get posts with user data
  const { data: posts, error: postsError } = await supabase
    .from("community_posts")
    .select(`
      *,
      user:users(id, username, display_name, avatar_url, tier),
      category:community_categories(id, name, color)
    `)
    .order("created_at", { ascending: false })
    .limit(20)

  if (postsError) {
    console.error("Error fetching posts:", postsError)
    return { categories: categories || [], posts: [] }
  }

  return {
    categories: categories || [],
    posts: posts || [],
  }
}

function getTierColor(tier: string) {
  const colors = {
    admin: "bg-red-500 text-white",
    blood_brotherhood: "bg-red-600 text-white",
    elder: "bg-purple-500 text-white",
    pioneer: "bg-blue-500 text-white",
    grassroot: "bg-green-500 text-white",
  }
  return colors[tier as keyof typeof colors] || "bg-gray-500 text-white"
}

function formatTimeAgo(date: string) {
  const now = new Date()
  const postDate = new Date(date)
  const diffInSeconds = Math.floor((now.getTime() - postDate.getTime()) / 1000)

  if (diffInSeconds < 60) return "Just now"
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  return `${Math.floor(diffInSeconds / 86400)}d ago`
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
          <CreatePostForm categories={categories} />
        </Suspense>

        <Suspense fallback={<SimpleLoading />}>
          <PostFeed initialPosts={posts} />
        </Suspense>
      </div>
    </CommunityLayout>
  )
}
