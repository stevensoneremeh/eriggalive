"use server"

/**
 * Community-related Server Actions
 * --------------------------------
 *  • createCommunityPostAction      – create a new post
 *  • voteOnPostAction / voteOnPost  – up- or down-vote a post
 *  • bookmarkPost                   – toggle bookmark on a post
 *  • fetchCommunityPosts            – paginated post query for feeds
 *  • fetchCommentsForPost           – comments for a post
 *  • createCommentAction            – add comment
 *  • editCommentAction              – edit comment
 *  • deleteCommentAction            – delete comment
 *  • toggleLikeCommentAction        – like/unlike a comment
 *  • createReportAction             – report inappropriate content
 *  • searchUsersForMention          – autocomplete @mentions
 *
 *  Aliases kept for backwards-compatibility:
 *    • voteOnPost  (alias of voteOnPostAction)
 *    • createPost  (alias of createCommunityPostAction)
 *    • bookmarkPostAction (alias of bookmarkPost)
 */

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

type Json = Record<string, unknown> | string | number | boolean | null

/* ------------------------------------------------------------------------ */
/*                               POST ACTIONS                               */
/* ------------------------------------------------------------------------ */

export async function createCommunityPostAction(formData: FormData) {
  const supabase = await createClient()

  /* ------------------------------ auth check ----------------------------- */
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) return { success: false, error: "Authentication required" }

  /* ------------------------------ payload -------------------------------- */
  const content = (formData.get("content") as string | null)?.trim() ?? ""
  const categoryId = formData.get("categoryId")
  const mediaUrl = formData.get("mediaUrl") as string | null | undefined

  if (!content && !mediaUrl) return { success: false, error: "Post needs text or media." }
  if (!categoryId) return { success: false, error: "Category is required." }

  const { data, error } = await supabase
    .from("community_posts")
    .insert({
      user_id: user.id,
      category_id: Number(categoryId),
      content,
      media_url: mediaUrl,
    })
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  revalidatePath("/community")
  return { success: true, data }
}

/* Back-compat alias */
export const createPost = createCommunityPostAction

/* ----------------------------- vote on post ----------------------------- */

export async function voteOnPostAction(postId: number) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Authentication required" }

  /* Does a vote already exist? */
  const { data: existingVote } = await supabase
    .from("community_post_votes")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (existingVote) {
    /* remove vote */
    await supabase.from("community_post_votes").delete().eq("id", existingVote.id)
    await supabase.rpc("decrement_post_votes", { p_post_id: postId })
    revalidatePath("/community")
    return { success: true, action: "removed" }
  }

  /* add vote */
  await supabase.from("community_post_votes").insert({ post_id: postId, user_id: user.id })
  await supabase.rpc("increment_post_votes", { p_post_id: postId })
  revalidatePath("/community")
  return { success: true, action: "added" }
}

/* alias expected by older code */
export const voteOnPost = voteOnPostAction

/* -------------------------- bookmark a post ----------------------------- */

export async function bookmarkPost(postId: number) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Authentication required" }

  const { data: existing } = await supabase
    .from("community_post_bookmarks")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (existing) {
    await supabase.from("community_post_bookmarks").delete().eq("id", existing.id)
    revalidatePath("/community")
    return { success: true, bookmarked: false }
  }

  await supabase.from("community_post_bookmarks").insert({ post_id: postId, user_id: user.id })
  revalidatePath("/community")
  return { success: true, bookmarked: true }
}

/* alias kept for older import paths */
export { bookmarkPost as bookmarkPostAction }

/* ----------------------- feed / infinite query -------------------------- */

export async function fetchCommunityPosts(
  loggedInAuthId: string | null = null,
  opts: {
    page?: number
    limit?: number
    sort?: "newest" | "oldest" | "top"
    categoryId?: number
    search?: string
  } = {},
) {
  const { page = 1, limit = 10, sort = "newest", categoryId, search } = opts
  const supabase = await createClient()
  const from = (page - 1) * limit
  const to = from + limit - 1

  let q = supabase
    .from("community_posts")
    .select(
      `
        *,
        user:users(id, username, full_name, avatar_url, tier),
        category:community_categories(id, name, color),
        votes:community_post_votes(user_id)
      `,
    )
    .eq("is_deleted", false)
    .range(from, to)

  if (categoryId) q = q.eq("category_id", categoryId)
  if (search) q = q.ilike("content", `%${search}%`)

  switch (sort) {
    case "oldest":
      q = q.order("created_at", { ascending: true })
      break
    case "top":
      q = q.order("vote_count", { ascending: false }).order("created_at", { ascending: false })
      break
    default:
      q = q.order("created_at", { ascending: false })
  }

  const { data, error } = await q
  if (error) return { success: false, error: error.message, posts: [] }

  /* Annotate with current-user vote status */
  let currentUserInternalId: number | undefined
  if (loggedInAuthId) {
    const { data: u } = await supabase.from("users").select("id").eq("auth_user_id", loggedInAuthId).single()
    currentUserInternalId = u?.id
  }

  const posts = (data ?? []).map((p: any) => ({
    ...p,
    has_voted: currentUserInternalId ? p.votes.some((v: any) => v.user_id === currentUserInternalId) : false,
  }))

  return { success: true, posts }
}

/* ------------------------------------------------------------------------ */
/*                              COMMENT ACTIONS                             */
/* ------------------------------------------------------------------------ */

export async function fetchCommentsForPost(postId: number) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("community_comments")
    .select(
      `
        *,
        user:users(id, username, full_name, avatar_url, tier)
      `,
    )
    .eq("post_id", postId)
    .eq("is_deleted", false)
    .order("created_at", { ascending: true })

  if (error) return { success: false, error: error.message }
  return { success: true, comments: data ?? [] }
}

export async function createCommentAction(postId: number, content: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Authentication required" }

  const { error, data } = await supabase
    .from("community_comments")
    .insert({ post_id: postId, user_id: user.id, content: content.trim() })
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  revalidatePath(`/community/post/${postId}`)
  return { success: true, data }
}

export async function editCommentAction(commentId: number, content: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from("community_comments")
    .update({ content: content.trim(), is_edited: true })
    .eq("id", commentId)
  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function deleteCommentAction(commentId: number) {
  const supabase = await createClient()
  const { error } = await supabase.from("community_comments").update({ is_deleted: true }).eq("id", commentId)
  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function toggleLikeCommentAction(commentId: number) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Authentication required" }

  const { data: existing } = await supabase
    .from("community_comment_likes")
    .select("id")
    .eq("comment_id", commentId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (existing) {
    await supabase.from("community_comment_likes").delete().eq("id", existing.id)
    return { success: true, liked: false }
  }

  await supabase.from("community_comment_likes").insert({ comment_id: commentId, user_id: user.id })
  return { success: true, liked: true }
}

/* ------------------------------------------------------------------------ */
/*                         REPORTS & MENTION SEARCH                          */
/* ------------------------------------------------------------------------ */

export async function createReportAction(postId: number, reason: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Authentication required" }

  const { error } = await supabase.from("community_post_reports").insert({
    post_id: postId,
    reporter_id: user.id,
    reason: reason.trim(),
  })
  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function searchUsersForMention(query: string) {
  if (!query.trim()) return { success: true, users: [] }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("users")
    .select("id, username, full_name, avatar_url")
    .ilike("username", `%${query}%`)
    .limit(10)
  if (error) return { success: false, error: error.message }
  return { success: true, users: data ?? [] }
}
