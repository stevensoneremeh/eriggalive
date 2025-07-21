import { Suspense } from "react"
import { WorkingCommunityFeed } from "@/components/community/working-community-feed"
import { WorkingCreatePostForm } from "@/components/community/working-create-post-form"
import { CommunitySidebar } from "@/components/community/community-sidebar-final"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

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
    .order("display_order", { ascending: true })

  // Get initial posts
  const { data: posts } = await supabase
    .from("community_posts")
    .select(`
      id,
      content,
      media_url,
      media_type,
      hashtags,
      vote_count,
      comment_count,
      view_count,
      is_pinned,
      created_at,
      updated_at,
      user:users!community_posts_user_id_fkey (
        id,
        username,
        full_name,
        avatar_url,
        tier
      ),
      category:community_categories!community_posts_category_id_fkey (
        id,
        name,
        slug,
        icon,
        color
      )
    `)
    .eq("is_published", true)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false })
    .limit(20)

  return {
    profile,
    categories: categories || [],
    posts: posts || [],
  }
}

export default async function CommunityPage() {
  const { profile, categories, posts } = await getCommunityData()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <CommunitySidebar categories={categories} profile={profile} />
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Create Post Form */}
            <WorkingCreatePostForm />

            {/* Posts Feed */}
            <Suspense fallback={<div>Loading posts...</div>}>
              <WorkingCommunityFeed initialPosts={posts} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  )
}
