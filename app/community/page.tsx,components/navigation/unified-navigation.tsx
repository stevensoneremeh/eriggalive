--- app/community/page.tsx ---
import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { CreatePostForm } from "@/components/community/create-post-form-final"
import { PostFeed } from "@/components/community/post-feed"
import { CommunityLayout } from "@/components/community/community-layout"
import { SimpleLoading } from "@/components/simple-loading"

async function getCommunityData() {
  const supabase = await createClient()

  const { data: categories } = await supabase.from("community_categories").select("*").order("name")

  const { data: posts } = await supabase
    .from("community_posts")
    .select(
      `
            *,
            user:users(id, username, full_name, avatar_url, tier),
            category:community_categories(id, name, color)
          `,
    )
    .order("created_at", { ascending: false })
    .limit(20)

  return {
    categories: categories ?? [],
    posts: posts ?? [],
  }
}

export default async function CommunityPage() {
  const { categories, posts } = await getCommunityData()

  return (
    <CommunityLayout>
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <header className="text-center">
          <h1 className="text-3xl font-bold mb-2">Erigga Community</h1>
          <p className="text-muted-foreground">Connect with fellow fans, share your thoughts, and stay updated</p>
        </header>

        {/* Create-post widget */}
        <Suspense fallback={<SimpleLoading />}>
          <CreatePostForm categories={categories} />
        </Suspense>

        {/* Feed */}
        <Suspense fallback={<SimpleLoading />}>
          <PostFeed initialPosts={posts} categories={categories} />
        </Suspense>
      </div>
    </CommunityLayout>
  )
}
--- components / navigation / unified - navigation.tsx-- - "use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const links = [
  { href: "/", label: "Home" },
  { href: "/community", label: "Community" },
  { href: "/dashboard", label: "Dashboard" },
]

/**
 * Primary site navigation.  Always sends “Home / logo” to `/`
 * regardless of authentication state.
 */
export function UnifiedNavigation() {
  const pathname = usePathname()

  return (
    <nav className="border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        {/* Logo / Home */}
        <Link href="/" className="text-lg font-semibold transition-colors hover:text-primary">
          Erigga<span className="text-primary">Live</span>
        </Link>

        {/* Links */}
        <ul className="flex items-center gap-4 text-sm font-medium">
          {links.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className={cn("transition-colors hover:text-primary", pathname === href && "text-primary")}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}

// keep default export for legacy imports
export default UnifiedNavigation
