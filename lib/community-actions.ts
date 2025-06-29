"use server"

/**
 * Centralised Community server-actions.
 *
 * NOTE:  - These functions are intentionally lightweight; they just perform basic
 *         DB work and return a JSON serialisable payload so the build succeeds.
 *       - Replace the `TODO:` sections with your own business logic later.
 */

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

/* -------------------------------------------------------------------------- */
/*                               Helper types                                 */
/* -------------------------------------------------------------------------- */

export interface ActionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

/* -------------------------------------------------------------------------- */
/*                              Post - level APIs                             */
/* -------------------------------------------------------------------------- */

export async function createCommunityPostAction(formData: FormData): Promise<ActionResult> {
  /**
   * Incoming FormData keys (expected):
   *   - content       : string
   *   - categoryId    : string | number
   *   - mediaFile (optional File) : File
   */
  const supabase = await createClient()

  // ---------------------------------- auth --------------------------------- //
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: "Authentication required" }
  }

  // -------------------------------- payload -------------------------------- //
  const content = (formData.get("content") as string | null)?.trim() || ""
  const categoryId = formData.get("categoryId")

  if (!content && !formData.get("mediaFile")) {
    return { success: false, error: "Post must contain text or media." }
  }
  if (!categoryId) {
    return { success: false, error: "Category is required." }
  }

  // TODO: upload media to Supabase Storage if present.
  // For now, we’ll only store the text content.

  const { data: insert, error } = await supabase
    .from("community_posts")
    .insert({
      user_id: user.id,
      category_id: Number(categoryId),
      content,
    })
    .select()
    .single()

  if (error) {
    console.error("createCommunityPostAction insert error:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/community")
  return { success: true, data: insert }
}

export async function voteOnPostAction(postId: number): Promise<ActionResult<{ action: "added" | "removed" }>> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Authentication required" }
  }

  // check if vote exists
  const { data: existing } = await supabase
    .from("post_votes")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (existing) {
    // remove vote
    await supabase.from("post_votes").delete().eq("id", existing.id)
    await supabase
      .from("community_posts")
      .update({ vote_count: supabase.literal("vote_count - 1") })
      .eq("id", postId)

    revalidatePath("/community")
    return { success: true, data: { action: "removed" } }
  }

  // add vote
  await supabase.from("post_votes").insert({ post_id: postId, user_id: user.id })
  await supabase
    .from("community_posts")
    .update({ vote_count: supabase.literal("vote_count + 1") })
    .eq("id", postId)

  revalidatePath("/community")
  return { success: true, data: { action: "added" } }
}

/**
 * A friendly alias so older imports (`voteOnPost`) keep working.
 *    import { voteOnPost } from "@/lib/community-actions"
 */
export const voteOnPost = voteOnPostAction

export async function bookmarkPost(postId: number): Promise<ActionResult<{ bookmarked: boolean }>> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Authentication required" }
  }

  const { data: existing } = await supabase
    .from("post_bookmarks")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (existing) {
    await supabase.from("post_bookmarks").delete().eq("id", existing.id)
    revalidatePath("/community")
    return { success: true, data: { bookmarked: false } }
  }

  await supabase.from("post_bookmarks").insert({ post_id: postId, user_id: user.id })
  revalidatePath("/community")
  return { success: true, data: { bookmarked: true } }
}

/* -------------------------------------------------------------------------- */
/*               Re-export legacy names so existing code compiles             */
/* -------------------------------------------------------------------------- */

// legacy names used in several components/pages
export { bookmarkPost as bookmarkPostAction }
export { createCommunityPostAction as createPost }
/* voteOnPost alias already declared above */

/* -------------------------------------------------------------------------- */
/*        Add NO-OP stubs for comment helpers if other pages still            */
/*        import them.  (Remove when real implementations exist.)            */
/* -------------------------------------------------------------------------- */

export async function fetchCommentsForPost(postId: number) {
  try {
    const supabase = await createClient()
    const { data: comments, error } = await supabase
      .from("community_comments")
      .select(`
        *,
        user:users(id, username, full_name, avatar_url, tier)
      `)
      .eq("post_id", postId)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Error fetching comments:", error)
      return { success: false, error: error.message }
    }

    return { success: true, comments: comments || [] }
  } catch (error) {
    console.error("Error in fetchCommentsForPost:", error)
    return { success: false, error: "Failed to fetch comments" }
  }
}

export async function createCommentAction(postId: number, content: string) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Authentication required" }
    }

    const { data: comment, error } = await supabase
      .from("community_comments")
      .insert({
        post_id: postId,
        user_id: user.id,
        content: content.trim(),
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating comment:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/community")
    return { success: true, data: comment }
  } catch (error) {
    console.error("Error in createCommentAction:", error)
    return { success: false, error: "Failed to create comment" }
  }
}

export async function editCommentAction(commentId: number, content: string) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Authentication required" }
    }

    const { error } = await supabase
      .from("community_comments")
      .update({ content: content.trim() })
      .eq("id", commentId)
      .eq("user_id", user.id)

    if (error) {
      console.error("Error editing comment:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/community")
    return { success: true }
  } catch (error) {
    console.error("Error in editCommentAction:", error)
    return { success: false, error: "Failed to edit comment" }
  }
}

export async function deleteCommentAction(commentId: number) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Authentication required" }
    }

    const { error } = await supabase.from("community_comments").delete().eq("id", commentId).eq("user_id", user.id)

    if (error) {
      console.error("Error deleting comment:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/community")
    return { success: true }
  } catch (error) {
    console.error("Error in deleteCommentAction:", error)
    return { success: false, error: "Failed to delete comment" }
  }
}

export async function toggleLikeCommentAction(commentId: number) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Authentication required" }
    }

    // Check if already liked
    const { data: existingLike } = await supabase
      .from("comment_likes")
      .select("id")
      .eq("comment_id", commentId)
      .eq("user_id", user.id)
      .single()

    if (existingLike) {
      // Unlike
      await supabase.from("comment_likes").delete().eq("comment_id", commentId).eq("user_id", user.id)
    } else {
      // Like
      await supabase.from("comment_likes").insert({
        comment_id: commentId,
        user_id: user.id,
      })
    }

    revalidatePath("/community")
    return { success: true, data: { liked: !existingLike } }
  } catch (error) {
    console.error("Error in toggleLikeCommentAction:", error)
    return { success: false, error: "Failed to toggle like" }
  }
}

export async function createReportAction(postId: number, reason: string) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Authentication required" }
    }

    const { error } = await supabase.from("post_reports").insert({
      post_id: postId,
      user_id: user.id,
      reason: reason.trim(),
    })

    if (error) {
      console.error("Error creating report:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error("Error in createReportAction:", error)
    return { success: false, error: "Failed to create report" }
  }
}

export async function searchUsersForMention(query: string) {
  try {
    const supabase = await createClient()
    const { data: users, error } = await supabase
      .from("users")
      .select("id, username, full_name, avatar_url")
      .ilike("username", `%${query}%`)
      .limit(10)

    if (error) {
      console.error("Error searching users:", error)
      return { success: false, error: error.message }
    }

    return { success: true, users: users || [] }
  } catch (error) {
    console.error("Error in searchUsersForMention:", error)
    return { success: false, error: "Failed to search users" }
  }
}

export async function fetchCommunityPosts(
  userId?: string,
  options: {
    categoryFilter?: number
    sortOrder?: string
    page?: number
    limit?: number
    searchQuery?: string
  } = {},
): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { categoryFilter, sortOrder = "newest", page = 1, limit = 10, searchQuery } = options

    let query = supabase.from("community_posts").select(`
        *,
        user:users(id, username, full_name, avatar_url, tier),
        category:community_categories(id, name, color)
      `)

    // Apply filters
    if (categoryFilter) {
      query = query.eq("category_id", categoryFilter)
    }

    if (searchQuery) {
      query = query.ilike("content", `%${searchQuery}%`)
    }

    // Apply sorting
    switch (sortOrder) {
      case "oldest":
        query = query.order("created_at", { ascending: true })
        break
      case "top":
        query = query.order("vote_count", { ascending: false })
        break
      default:
        query = query.order("created_at", { ascending: false })
    }

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data: posts, error } = await query

    if (error) {
      console.error("Error fetching posts:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data: posts || [] }
  } catch (error) {
    console.error("Error in fetchCommunityPosts:", error)
    return { success: false, error: "Failed to fetch posts" }
  }
}
