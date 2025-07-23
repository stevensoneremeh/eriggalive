import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

const POST_SELECT = `
  id,
  content,
  "type",
  media_url,
  media_type,
  hashtags,
  vote_count,
  comment_count,
  view_count,
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
`

// Safe response wrapper
function createResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
    },
  })
}

export async function GET(_: NextRequest) {
  try {
    const supabase = await createClient()

    // Get auth user safely
    let authUser = null
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()
      if (!authError && user) {
        authUser = user
      }
    } catch (authErr) {
      console.warn("Auth check failed (non-critical):", authErr)
    }

    // Fetch posts with error handling
    let posts = []
    try {
      const { data, error } = await supabase
        .from("community_posts")
        .select(POST_SELECT)
        .eq("is_published", true)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false })
        .limit(50)

      if (error) {
        console.error("Posts fetch error:", error)
        return createResponse({ error: "Failed to fetch posts", posts: [], count: 0 }, 500)
      }

      posts = data || []
    } catch (fetchErr) {
      console.error("Posts fetch exception:", fetchErr)
      return createResponse({ error: "Database temporarily unavailable", posts: [], count: 0 }, 503)
    }

    // Process posts with vote data
    let postsWithVotes = posts.map((p) => ({
      ...p,
      has_voted: false,
      hashtags: Array.isArray(p.hashtags) ? p.hashtags : [],
    }))

    // Add vote data if user is authenticated
    if (authUser && posts.length > 0) {
      try {
        const postIds = posts.map((p) => p.id)
        const { data: votes } = await supabase
          .from("community_post_votes")
          .select("post_id")
          .eq("user_id", authUser.id)
          .in("post_id", postIds)

        if (votes) {
          const votedIds = new Set(votes.map((v) => v.post_id))
          postsWithVotes = posts.map((p) => ({
            ...p,
            has_voted: votedIds.has(p.id),
            hashtags: Array.isArray(p.hashtags) ? p.hashtags : [],
          }))
        }
      } catch (voteErr) {
        console.warn("Vote fetch failed (non-critical):", voteErr)
        // Continue without vote data
      }
    }

    return createResponse({
      success: true,
      posts: postsWithVotes,
      count: postsWithVotes.length,
    })
  } catch (err) {
    console.error("Unhandled posts API error:", err)
    return createResponse({ error: "Internal server error", posts: [], count: 0 }, 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Auth check
    let authUser = null
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()
      if (authError || !user) {
        return createResponse({ error: "Authentication required" }, 401)
      }
      authUser = user
    } catch (authErr) {
      console.error("Auth error:", authErr)
      return createResponse({ error: "Authentication failed" }, 401)
    }

    // Get user profile
    let profile = null
    try {
      const { data, error: profileError } = await supabase
        .from("users")
        .select("id")
        .eq("auth_user_id", authUser.id)
        .single()

      if (profileError || !data) {
        return createResponse({ error: "User profile not found" }, 404)
      }
      profile = data
    } catch (profileErr) {
      console.error("Profile fetch error:", profileErr)
      return createResponse({ error: "Failed to fetch user profile" }, 500)
    }

    // Parse request body
    let body
    try {
      body = await request.json()
    } catch (parseErr) {
      return createResponse({ error: "Invalid request body" }, 400)
    }

    const { content, categoryId } = body

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return createResponse({ error: "Content is required" }, 400)
    }

    if (!categoryId) {
      return createResponse({ error: "Category is required" }, 400)
    }

    // Insert post
    try {
      const { data: post, error: insertError } = await supabase
        .from("community_posts")
        .insert({
          user_id: profile.id,
          category_id: categoryId,
          content: content.trim(),
          hashtags: [],
          is_published: true,
          is_deleted: false,
        })
        .select(POST_SELECT)
        .single()

      if (insertError) {
        console.error("Post insert error:", insertError)
        return createResponse({ error: "Failed to create post" }, 500)
      }

      if (!post) {
        return createResponse({ error: "Post created but not returned" }, 500)
      }

      return createResponse({
        success: true,
        post: {
          ...post,
          hashtags: Array.isArray(post.hashtags) ? post.hashtags : [],
        },
      })
    } catch (insertErr) {
      console.error("Post insert exception:", insertErr)
      return createResponse({ error: "Failed to create post" }, 500)
    }
  } catch (err) {
    console.error("Unhandled POST error:", err)
    return createResponse({ error: "Internal server error" }, 500)
  }
}
