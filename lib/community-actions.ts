"use server"

/* -------------------------------------------------------------------------- */
/*  Community Server Actions – Next 14 + Supabase                              */
/* -------------------------------------------------------------------------- */
/*  Exports                                                                   
      createCommunityPostAction (alias createPost)                            
      voteOnPostAction        (alias voteOnPost)                              
      bookmarkPost                                                                        
      fetchCommunityPosts                                                      
      fetchCommentsForPost                                                    
      createCommentAction                                                     
      editCommentAction                                                       
      deleteCommentAction                                                     
      toggleLikeCommentAction                                                 
      createReportAction                                                      
      searchUsersForMention                                                   
   All actions:
     • verify authentication
     • look-up the caller’s internal `users.id`
     • return { success, data?, error? }
     • call revalidatePath("/community") after mutating data                   */
/* -------------------------------------------------------------------------- */

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

/* -------------------------------------------------------------------------- */
/*  Shared helpers & types                                                    */
/* -------------------------------------------------------------------------- */

interface ActionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

/** Look-up the row-level `users.id` using Supabase Auth UID */
async function getInternalUserId(authUid: string) {
  const supabase = createClient()
  const { data, error } = await supabase.from("users").select("id").eq("auth_user_id", authUid).single()
  if (error || !data) return undefined
  return data.id as number
}

/** Convenience wrapper for uniform error logging */
function fail(msg: string, err?: unknown): ActionResult {
  if (err) console.error(msg, err)
  return { success: false, error: msg }
}

/* -------------------------------------------------------------------------- */
/*  1️⃣  Create a post                                                        */
/* -------------------------------------------------------------------------- */

export async function createCommunityPostAction(formData: FormData): Promise<ActionResult> {
  try {
    const supabase = createClient()

    /* ------------ authentication ------------ */
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) return fail("Authentication required")

    const userId = await getInternalUserId(auth.user.id)
    if (!userId) return fail("User profile not found")

    /* ------------- payload parse ------------ */
    const rawContent = (formData.get("content") as string | null)?.trim() ?? ""
    const categoryId = Number(formData.get("categoryId"))
    if (!rawContent && !formData.get("mediaFile")) return fail("Post needs text or media")
    if (Number.isNaN(categoryId)) return fail("Category is required")

    /* ------------- hashtags ------------- */
    const hashtags = rawContent.match(/#\w+/g)?.map((t) => t.slice(1).toLowerCase()) ?? ([] as string[])

    /* NOTE media upload omitted – add if your UI supports it */

    /* ------------- insert ------------- */
    const { data, error } = await supabase
      .from("community_posts")
      .insert({
        user_id: userId,
        category_id: categoryId,
        content: rawContent,
        hashtags,
        is_published: true,
      })
      .select(
        `id, content, created_at, hashtags,
         user:users(id, username, avatar_url),
         category:community_categories(id, name)`,
      )
      .single()

    if (error) return fail("Failed to create post", error)

    revalidatePath("/community")
    return { success: true, data }
  } catch (err) {
    return fail("Unknown error while creating post", err)
  }
}

/* Alias still used by some pages/components */
export const createPost = createCommunityPostAction

/* -------------------------------------------------------------------------- */
/*  2️⃣  Vote on a post (handles coin transfer via RPC)                       */
/* -------------------------------------------------------------------------- */

export async function voteOnPostAction(postId: number, coinAmount = 100): Promise<ActionResult> {
  try {
    const supabase = createClient()
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) return fail("Authentication required")

    /* voter internal id */
    const voterId = await getInternalUserId(auth.user.id)
    if (!voterId) return fail("User profile not found")

    /* post info incl. creator’s auth UID */
    const { data: post, error: postErr } = await supabase
      .from("community_posts")
      .select(
        `id, user_id,
         users!inner(auth_user_id)`,
      )
      .eq("id", postId)
      .single()

    if (postErr || !post) return fail("Post not found")

    // @ts-ignore – joined column
    const creatorAuthUid = post.users.auth_user_id as string

    if (post.user_id === voterId) return fail("Cannot vote on your own post")

    /* call safe RPC */
    const { error: rpcErr } = await supabase.rpc("handle_post_vote_safe", {
      p_post_id: postId,
      p_voter_auth_id: auth.user.id,
      p_post_creator_auth_id: creatorAuthUid,
      p_coin_amount: coinAmount,
    })

    if (rpcErr) return fail(rpcErr.message, rpcErr)

    revalidatePath("/community")
    return { success: true, data: { coinAmount } }
  } catch (err) {
    return fail("Unknown error while voting", err)
  }
}

/* legacy alias */
export const voteOnPost = voteOnPostAction

/* -------------------------------------------------------------------------- */
/*  3️⃣  Bookmark / un-bookmark a post                                        */
/* -------------------------------------------------------------------------- */

export async function bookmarkPost(postId: number): Promise<ActionResult<{ bookmarked: boolean }>> {
  try {
    const supabase = createClient()
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) return fail("Authentication required")

    const userId = await getInternalUserId(auth.user.id)
    if (!userId) return fail("User profile not found")

    /* does bookmark exist? */
    const { data: existing } = await supabase
      .from("user_bookmarks")
      .select("id")
      .eq("user_id", userId)
      .eq("post_id", postId)
      .maybeSingle()

    if (existing) {
      await supabase.from("user_bookmarks").delete().eq("id", existing.id)
      revalidatePath("/community")
      return { success: true, data: { bookmarked: false } }
    }

    await supabase.from("user_bookmarks").insert({ user_id: userId, post_id: postId })
    revalidatePath("/community")
    return { success: true, data: { bookmarked: true } }
  } catch (err) {
    return fail("Bookmark action failed", err)
  }
}

/* -------------------------------------------------------------------------- */
/*  4️⃣  Fetch posts (list / feed)                                            */
/* -------------------------------------------------------------------------- */

export async function fetchCommunityPosts(
  page = 1,
  limit = 10,
  opts: { categoryId?: number; search?: string; sort?: "newest" | "oldest" | "top" } = {},
): Promise<ActionResult> {
  try {
    const supabase = createClient()
    const rangeFrom = (page - 1) * limit
    const rangeTo = rangeFrom + limit - 1

    let q = supabase
      .from("community_posts")
      .select(
        `
        id, content, created_at, vote_count, comment_count, hashtags,
        user:users(id, username, avatar_url),
        category:community_categories(id, name)
      `,
      )
      .eq("is_deleted", false)
      .range(rangeFrom, rangeTo)

    if (opts.categoryId) q = q.eq("category_id", opts.categoryId)
    if (opts.search) q = q.ilike("content", `%${opts.search}%`)

    switch (opts.sort) {
      case "oldest":
        q = q.order("created_at", { ascending: true })
        break
      case "top":
        q = q.order("vote_count", { ascending: false })
        break
      default:
        q = q.order("created_at", { ascending: false })
    }

    const { data, error } = await q
    if (error) return fail("Failed fetching posts", error)

    return { success: true, data }
  } catch (err) {
    return fail("Unknown error while fetching posts", err)
  }
}

/* -------------------------------------------------------------------------- */
/*  5️⃣  Comments                                                             */
/* -------------------------------------------------------------------------- */

export async function fetchCommentsForPost(postId: number): Promise<ActionResult> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("community_comments")
      .select(
        `
        id, content, created_at, parent_id,
        user:users(id, username, avatar_url)
      `,
      )
      .eq("post_id", postId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: true })

    if (error) return fail("Failed to fetch comments", error)
    return { success: true, data }
  } catch (err) {
    return fail("Unknown error while fetching comments", err)
  }
}

export async function createCommentAction(
  postId: number,
  content: string,
  parentCommentId?: number,
): Promise<ActionResult> {
  try {
    const supabase = createClient()
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) return fail("Authentication required")

    const userId = await getInternalUserId(auth.user.id)
    if (!userId) return fail("User profile not found")

    if (!content.trim()) return fail("Comment content required")

    const { data, error } = await supabase
      .from("community_comments")
      .insert({
        post_id: postId,
        user_id: userId,
        parent_id: parentCommentId ?? null,
        content: content.trim(),
      })
      .select("id, content, created_at")
      .single()

    if (error) return fail("Failed to add comment", error)

    revalidatePath("/community")
    return { success: true, data }
  } catch (err) {
    return fail("Unknown error while adding comment", err)
  }
}

export async function editCommentAction(commentId: number, newContent: string): Promise<ActionResult> {
  try {
    const supabase = createClient()
    if (!newContent.trim()) return fail("Content required")

    const { error } = await supabase
      .from("community_comments")
      .update({ content: newContent.trim(), is_edited: true })
      .eq("id", commentId)

    if (error) return fail("Failed to edit comment", error)
    revalidatePath("/community")
    return { success: true }
  } catch (err) {
    return fail("Unknown error while editing comment", err)
  }
}

export async function deleteCommentAction(commentId: number): Promise<ActionResult> {
  try {
    const supabase = createClient()
    const { error } = await supabase.from("community_comments").update({ is_deleted: true }).eq("id", commentId)

    if (error) return fail("Failed to delete comment", error)
    revalidatePath("/community")
    return { success: true }
  } catch (err) {
    return fail("Unknown error while deleting comment", err)
  }
}

export async function toggleLikeCommentAction(commentId: number): Promise<ActionResult<{ liked: boolean }>> {
  try {
    const supabase = createClient()
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) return fail("Authentication required")

    const userId = await getInternalUserId(auth.user.id)
    if (!userId) return fail("User profile not found")

    const { data: existing } = await supabase
      .from("comment_likes")
      .select("id")
      .eq("comment_id", commentId)
      .eq("user_id", userId)
      .maybeSingle()

    if (existing) {
      await supabase.from("comment_likes").delete().eq("id", existing.id)
      revalidatePath("/community")
      return { success: true, data: { liked: false } }
    }

    await supabase.from("comment_likes").insert({ comment_id: commentId, user_id: userId })
    revalidatePath("/community")
    return { success: true, data: { liked: true } }
  } catch (err) {
    return fail("Unknown error while toggling like", err)
  }
}

/* -------------------------------------------------------------------------- */
/*  6️⃣  Reports & Mention-search                                             */
/* -------------------------------------------------------------------------- */

export async function createReportAction(postId: number, reason: string): Promise<ActionResult> {
  try {
    const supabase = createClient()
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) return fail("Authentication required")

    const userId = await getInternalUserId(auth.user.id)
    if (!userId) return fail("User profile not found")

    const { error } = await supabase.from("post_reports").insert({
      post_id: postId,
      reporter_id: userId,
      reason: reason.trim(),
    })
    if (error) return fail("Failed to report post", error)
    return { success: true }
  } catch (err) {
    return fail("Unknown error while reporting", err)
  }
}

export async function searchUsersForMention(query: string): Promise<ActionResult> {
  if (!query.trim()) return { success: true, data: [] }
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("users")
      .select("id, username, avatar_url")
      .ilike("username", `%${query}%`)
      .limit(10)

    if (error) return fail("Search failed", error)
    return { success: true, data }
  } catch (err) {
    return fail("Unknown error while searching users", err)
  }
}
