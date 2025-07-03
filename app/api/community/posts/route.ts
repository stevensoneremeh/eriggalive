import { type NextRequest, NextResponse } from "next/server"
import { createAdminSupabaseClient } from "@/lib/supabase-utils"

/**
 * GET /api/community/posts
 * Query params:
 *   - limit    : number   (default 20)
 *   - before   : ISO date (cursor pagination)
 *   - category : id | slug (optional filter)
 *
 * This endpoint DOES NOT rely on PostgREST join syntax ― it enriches posts
 * manually so it works even if FK relationships are missing in the DB.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const limit = Number(searchParams.get("limit") ?? 20)
  const before = searchParams.get("before") // ISO string
  const categoryParam = searchParams.get("category") // id or slug

  try {
    const supabase = createAdminSupabaseClient()

    /* ---------- base post query ---------- */
    let postQuery = supabase.from("community_posts").select("*").order("created_at", { ascending: false }).limit(limit)

    if (before) {
      postQuery = postQuery.lt("created_at", before)
    }

    /* ---------- optional category filter ---------- */
    if (categoryParam) {
      let categoryId: number | null = null

      if (/^\d+$/.test(categoryParam)) {
        // param is a numeric id
        categoryId = Number(categoryParam)
      } else {
        // param is a slug → look up id
        const { data: cat } = await supabase
          .from("community_categories")
          .select("id")
          .eq("slug", categoryParam)
          .maybeSingle()

        if (cat) categoryId = cat.id
      }

      if (categoryId) {
        postQuery = postQuery.eq("category_id", categoryId)
      }
    }

    const { data: posts, error: postErr } = await postQuery
    if (postErr) throw postErr

    if (!posts?.length) return NextResponse.json([], { status: 200 })

    /* ---------- enrich with user + category ---------- */
    const userIds = [...new Set(posts.map((p) => p.user_id))].filter(Boolean)
    const categoryIds = [...new Set(posts.map((p) => p.category_id))].filter(Boolean)

    const [{ data: users }, { data: categories }] = await Promise.all([
      supabase.from("users").select("id, username, avatar_url, tier").in("id", userIds),
      supabase.from("community_categories").select("id, name, slug").in("id", categoryIds),
    ])

    const usersMap = new Map((users ?? []).map((u) => [u.id, u]))
    const categoriesMap = new Map((categories ?? []).map((c) => [c.id, c]))

    const enriched = posts.map((p) => ({
      ...p,
      user: usersMap.get(p.user_id) ?? null,
      category: categoriesMap.get(p.category_id) ?? null,
    }))

    return NextResponse.json(enriched, { status: 200 })
  } catch (err: any) {
    console.error("GET /api/community/posts ->", err)
    return NextResponse.json({ error: err.message ?? "Unknown error" }, { status: 500 })
  }
}
