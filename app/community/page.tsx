import { Suspense } from "react"
import { CommunityLayout } from "@/components/community/community-layout"
import { CreatePostForm } from "@/components/community/create-post-form"
import { PostFeed, PostFeedSkeleton } from "@/components/community/post-feed"
import { LeftSidebar, LeftSidebarSkeleton } from "@/components/community/left-sidebar"
import { RightSidebar, RightSidebarSkeleton } from "@/components/community/right-sidebar"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export default async function CommunityPage({
  searchParams,
}: {
  searchParams?: { category?: string; sort?: string }
}) {
  const supabase = createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: categories, error: categoriesError } = await supabase
    .from("community_categories")
    .select("*")
    .order("name", { ascending: true })

  if (categoriesError) {
    console.error("Error fetching categories:", categoriesError)
    // Handle error appropriately, maybe show an error message
  }

  const selectedCategorySlug = searchParams?.category
  const currentCategory = categories?.find((cat) => cat.slug === selectedCategorySlug)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <CommunityLayout
        leftSidebar={
          <Suspense fallback={<LeftSidebarSkeleton />}>
            <LeftSidebar categories={categories || []} currentCategorySlug={selectedCategorySlug} />
          </Suspense>
        }
        rightSidebar={
          <Suspense fallback={<RightSidebarSkeleton />}>
            <RightSidebar />
          </Suspense>
        }
      >
        <div className="space-y-6">
          {user && <CreatePostForm categories={categories || []} userId={user.id} />}
          <Suspense fallback={<PostFeedSkeleton />}>
            <PostFeed
              userId={user?.id}
              categoryFilter={currentCategory?.id}
              sortOrder={searchParams?.sort || "newest"}
            />
          </Suspense>
        </div>
      </CommunityLayout>
    </div>
  )
}
