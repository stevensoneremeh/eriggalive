import { createServerSupabaseClient } from "@/lib/supabase/server" // For getting user session
import { fetchCommunityPosts } from "@/lib/community-actions"
import { CreatePostFormFinal } from "@/components/community/create-post-form-final"
import { EnhancedPostFeed } from "@/components/community/enhanced-post-feed" // Assuming this is your feed display component
import type { CommunityCategory } from "@/types/database"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal } from "lucide-react"

async function fetchCategories(): Promise<CommunityCategory[]> {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase.from("community_categories").select("*").order("name")
  if (error) {
    console.error("Error fetching categories:", error)
    return []
  }
  return data || []
}

export default async function CommunityPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined }
}) {
  const supabase = createServerSupabaseClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const loggedInAuthUserId = session?.user?.id || null

  const page = typeof searchParams?.page === "string" ? Number(searchParams.page) : 1
  const sortOrder =
    typeof searchParams?.sort === "string" ? (searchParams.sort as "newest" | "oldest" | "top") : "newest"
  const categoryFilterQuery = typeof searchParams?.category === "string" ? Number(searchParams.category) : undefined
  const searchQuery = typeof searchParams?.q === "string" ? searchParams.q : undefined

  const [categoriesResult, postsResult] = await Promise.all([
    fetchCategories(),
    fetchCommunityPosts(loggedInAuthUserId, {
      page,
      sortOrder,
      categoryFilter: categoryFilterQuery,
      searchQuery,
      limit: 10, // Default limit
    }),
  ])

  const categories = categoriesResult
  const { posts: initialPosts, totalCount, error: postsError } = postsResult

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Community Hub</h1>

      {session && <CreatePostFormFinal categories={categories} />}
      {!session && (
        <Alert>
          <Terminal className="h-4 w-4" />
          <AlertTitle>Heads up!</AlertTitle>
          <AlertDescription>
            You need to be logged in to create posts.{" "}
            <a href="/login" className="font-semibold underline">
              Login here
            </a>
            .
          </AlertDescription>
        </Alert>
      )}

      {postsError && (
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error loading posts</AlertTitle>
          <AlertDescription>{postsError}</AlertDescription>
        </Alert>
      )}

      <EnhancedPostFeed
        initialPosts={initialPosts as any[]} // Cast if type mismatch, ensure EnhancedPostFeed expects this structure
        categories={categories}
        totalCount={totalCount} // Pass total count for pagination
        loggedInAuthUserId={loggedInAuthUserId} // Pass user ID for client-side actions if needed
      />
    </div>
  )
}
