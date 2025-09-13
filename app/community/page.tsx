import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { CommunityFeed } from "@/components/community/community-feed-final"
import { CreatePostForm } from "@/components/community/create-post-form-final"
import { CommunitySidebar } from "@/components/community/community-sidebar-final"

async function getCommunityData() {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Get user profile
  const { data: profile } = await supabase.from("users").select("*").eq("auth_user_id", user.id).single()

  // Get categories
  const { data: categories } = await supabase
    .from("community_categories")
    .select("*")
    .eq("is_active", true)
    .order("display_order")

  // Get posts with user data and vote status
  const { data: posts } = await supabase
    .from("community_posts")
    .select(`
      *,
      users!inner (
        id,
        username,
        full_name,
        avatar_url,
        tier,
        reputation_score
      ),
      community_categories!inner (
        name,
        slug,
        color,
        icon
      ),
      post_votes!left (
        user_id
      )
    `)
    .eq("is_published", true)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false })
    .limit(50)

  // Process posts to include vote status
  const processedPosts =
    posts?.map((post) => ({
      ...post,
      has_voted: post.post_votes?.some((vote: any) => vote.user_id === profile?.id) || false,
    })) || []

  return {
    user,
    profile,
    categories: categories || [],
    posts: processedPosts,
  }
}

export default async function CommunityPage() {
  const { user, profile, categories, posts } = await getCommunityData()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Erigga Community
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Connect with fellow fans • Share your thoughts • Earn rewards
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <CommunitySidebar categories={categories} profile={profile} />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Create Post */}
            <CreatePostForm categories={categories} profile={profile} />

            {/* Posts Feed */}
            <CommunityFeed posts={posts} currentUser={profile} />
          </div>
        </div>
      </div>
    </div>
  )
}