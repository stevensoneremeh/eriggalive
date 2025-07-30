import { createClient } from "@/lib/supabase/server"
import { ProfileView } from "@/components/profile/profile-view"
import { notFound } from "next/navigation"

interface ProfilePageProps {
  params: {
    username: string
  }
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser()

  let currentProfile = null
  if (currentUser) {
    const { data } = await supabase.from("profiles").select("*").eq("id", currentUser.id).single()
    currentProfile = data
  }

  // Get profile being viewed
  const { data: profile } = await supabase.from("profiles").select("*").eq("username", params.username).single()

  if (!profile) {
    notFound()
  }

  // Get user's posts
  const { data: posts } = await supabase
    .from("posts")
    .select(`*
      categories:category_id (name, color, icon)
    `)
    .eq("author_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(10)

  // Get user's comments
  const { data: comments } = await supabase
    .from("comments")
    .select(`*
      posts:post_id (title, id)
    `)
    .eq("author_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(10)

  const isOwnProfile = currentUser?.id === profile.id

  return (
    <div className="container mx-auto px-4 py-8">
      <ProfileView profile={profile} posts={posts || []} comments={comments || []} isOwnProfile={isOwnProfile} />
    </div>
  )
}
