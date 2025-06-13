import { Suspense } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function CommunityPage() {
  // Always use the server client - it will return mock data in preview mode
  const supabase = createServerSupabaseClient()

  try {
    // Fetch categories
    const { data: categories, error: categoriesError } = await supabase
      .from("community_categories")
      .select("*")
      .order("display_order", { ascending: true })

    if (categoriesError) {
      console.error("Error fetching categories:", categoriesError)
    }

    return (
      <div className="container py-8 max-w-5xl">
        <h1 className="text-3xl font-bold mb-6">Erigga Community</h1>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-6 w-full max-w-full overflow-x-auto flex-nowrap justify-start">
            <TabsTrigger value="all">All Posts</TabsTrigger>
            {categories?.map((category) => (
              <TabsTrigger key={category.id} value={category.slug}>
                {category.name}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="all">
            <Suspense fallback={<CommunityFallback />}>
              <CommunityContent />
            </Suspense>
          </TabsContent>

          {categories?.map((category) => (
            <TabsContent key={category.id} value={category.slug}>
              <Suspense fallback={<CommunityFallback />}>
                <CommunityContent selectedCategory={category.slug} />
              </Suspense>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    )
  } catch (error) {
    console.error("Error in community page:", error)
    return (
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">Erigga Community</h1>
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300">
          <p className="font-medium">Error loading community</p>
          <p className="text-sm">There was a problem loading the community content. Please try again later.</p>
        </div>
      </div>
    )
  }
}

function CommunityFallback() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-[200px] w-full" />
      <div className="space-y-4">
        {Array(5)
          .fill(0)
          .map((_, i) => (
            <Skeleton key={i} className="h-[300px] w-full" />
          ))}
      </div>
    </div>
  )
}

function CommunityContent({ selectedCategory }: { selectedCategory?: string }) {
  return (
    <div className="space-y-6">
      <div className="bg-card rounded-lg border p-6">
        <h2 className="text-xl font-semibold mb-4">Create a Post</h2>
        <p className="text-muted-foreground mb-4">
          Share your thoughts, questions, or content with the Erigga community.
        </p>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors">
            Create Post
          </button>
        </div>
      </div>

      {/* Mock posts */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-card rounded-lg border overflow-hidden">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-orange-200"></div>
              <div>
                <p className="font-medium">User{i}</p>
                <p className="text-xs text-muted-foreground">
                  Posted {i} day{i > 1 ? "s" : ""} ago
                </p>
              </div>
            </div>
            <h3 className="text-xl font-bold mb-2">Example Community Post {i}</h3>
            <p className="text-muted-foreground mb-4">
              This is an example post in the Erigga community. In the deployed version, you'll see real posts from
              users.
            </p>
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <span>👍</span> {i * 10} Likes
              </button>
              <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <span>💬</span> {i * 5} Comments
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
