import { Suspense } from "react"
import { CommunityLayout } from "@/components/community/community-layout"
import { LeftSidebar, LeftSidebarSkeleton } from "@/components/community/left-sidebar"
import { RightSidebar, RightSidebarSkeleton } from "@/components/community/right-sidebar"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { CommunityPageClient } from "./community-page-client"

export default async function CommunityPage({
  searchParams,
}: {
  searchParams?: { category?: string; sort?: string }
}) {
  const supabase = createServerSupabaseClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { data: categories, error: categoriesError } = await supabase
      .from("community_categories")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true })

    if (categoriesError) {
      console.error("Error fetching categories:", categoriesError)
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
          <CommunityPageClient categories={categories || []} user={user} currentCategory={currentCategory} />
        </CommunityLayout>
      </div>
    )
  } catch (error) {
    console.error("Community page error:", error)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">Something went wrong</h1>
          <p className="text-muted-foreground">Please try refreshing the page</p>
        </div>
      </div>
    )
  }
}
