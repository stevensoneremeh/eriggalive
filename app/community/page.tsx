"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/contexts/auth-context"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

// Safe client creation function that doesn't rely on external utilities
const createSafeClient = () => {
  // Check if we're in a browser environment
  const isBrowser = typeof window !== "undefined"

  // Check if we're in preview mode
  const isPreviewMode =
    isBrowser && (window.location.hostname.includes("vusercontent.net") || window.location.hostname.includes("v0.dev"))

  if (isPreviewMode) {
    // Return a simple mock client for preview mode
    return {
      from: () => ({
        select: () => ({
          order: () => ({
            limit: () => Promise.resolve({ data: [], error: null }),
          }),
        }),
      }),
    } as any
  }

  // For real client, use environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase environment variables")
    return {
      from: () => ({
        select: () => ({
          order: () => ({
            limit: () => Promise.resolve({ data: [], error: null }),
          }),
        }),
      }),
    } as any
  }

  return createSupabaseClient(supabaseUrl, supabaseAnonKey)
}

export default function CommunityPage() {
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { isAuthenticated } = useAuth()
  const supabase = createSafeClient()

  useEffect(() => {
    async function fetchCategories() {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from("community_categories")
          .select("*")
          .order("display_order", { ascending: true })

        if (error) throw error
        setCategories(data || [])
      } catch (err) {
        console.error("Error fetching categories:", err)
        setError("Failed to load categories")
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])

  if (loading) {
    return (
      <div className="container py-8 max-w-5xl">
        <h1 className="text-3xl font-bold mb-6">Erigga Community</h1>
        <Skeleton className="h-12 w-full mb-6" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">Erigga Community</h1>
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300">
          <p className="font-medium">Error loading community</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8 max-w-5xl">
      <h1 className="text-3xl font-bold mb-6">Erigga Community</h1>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-6 w-full max-w-full overflow-x-auto flex-nowrap justify-start">
          <TabsTrigger value="all">All Posts</TabsTrigger>
          {categories.map((category) => (
            <TabsTrigger key={category.id} value={category.slug}>
              {category.name}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all">
          <CommunityContent />
        </TabsContent>

        {categories.map((category) => (
          <TabsContent key={category.id} value={category.slug}>
            <CommunityContent selectedCategory={category.slug} />
          </TabsContent>
        ))}
      </Tabs>
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
