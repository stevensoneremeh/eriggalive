"use server"

/**
 * Canonical server-actions implementation.
 * Nothing but ASYNC functions are exported – no constants, no types.
 */

import { revalidatePath } from "next/cache"
import { getOrCreateUserProfile } from "@/lib/auth-sync"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { createCommunityPostAction as _createPost, bookmarkPostAction as _bookmarkPost } from "./community-actions"

/* internal helpers & constants ------------------------------------------- */
const VOTE_COIN_AMOUNT = 100 // <── no export!

/* public API (async wrappers) -------------------------------------------- */
export async function createCommunityPostAction(formData: FormData) {
  // can add extra logic here (rate-limiting, logging …) before delegating
  return _createPost(formData)
}

export async function voteOnPostAction(postId: number, postCreatorAuthId = "") {
  try {
    const supabase = createServerSupabaseClient()
    const voterProfile = await getOrCreateUserProfile()

    // Check if trying to vote on own post
    const { data: postData } = await supabase.from("community_posts").select("user_id").eq("id", postId).single()

    if (postData && postData.user_id === voterProfile.id) {
      return {
        success: false,
        error: "You cannot vote on your own post.",
        code: "SELF_VOTE",
      }
    }

    // Check if user has enough coins
    if (voterProfile.coins < VOTE_COIN_AMOUNT) {
      return {
        success: false,
        error: "Not enough Erigga Coins to vote.",
        code: "INSUFFICIENT_FUNDS",
      }
    }

    const { data, error } = await supabase.rpc("handle_post_vote", {
      p_post_id: postId,
      p_voter_auth_id: voterProfile.auth_user_id,
      p_post_creator_auth_id: postCreatorAuthId,
      p_coin_amount: VOTE_COIN_AMOUNT,
    })

    if (error) {
      console.error("Vote error:", error)
      return {
        success: false,
        error: `Voting failed: ${error.message}`,
        code: "VOTE_FAILED",
      }
    }

    revalidatePath("/community")
    return {
      success: true,
      voted: data,
      message: `Voted successfully! ${VOTE_COIN_AMOUNT} coins transferred.`,
    }
  } catch (error: any) {
    console.error("Vote action error:", error)
    return { success: false, error: error.message || "Failed to vote" }
  }
}

export async function bookmarkPostAction(postId: number) {
  return _bookmarkPost(postId)
}

export async function fetchCommunityPosts(
  loggedInUserId?: string,
  options: {
    categoryFilter?: number
    sortOrder?: string
    page?: number
    limit?: number
    searchQuery?: string
  } = {},
) {
  try {
    const { categoryFilter, sortOrder = "newest", page = 1, limit = 10, searchQuery } = options
    const supabase = createServerSupabaseClient()
    const offset = (page - 1) * limit

    // Get logged in user's internal ID if provided
    let loggedInUserInternalId: number | undefined
    if (loggedInUserId) {
      const { data: userData } = await supabase.from("users").select("id").eq("auth_user_id", loggedInUserId).single()
      loggedInUserInternalId = userData?.id
    }

    let query = supabase
      .from("community_posts")
      .select(`
        *,
        user:users!community_posts_user_id_fkey(id, auth_user_id, username, full_name, avatar_url, tier),
        category:community_categories!community_posts_category_id_fkey(id, name, slug),
        votes:community_post_votes(user_id)
      `)
      .eq("is_published", true)
      .eq("is_deleted", false)

    if (categoryFilter) {
      query = query.eq("category_id", categoryFilter)
    }

    if (searchQuery) {
      query = query.ilike("content", `%${searchQuery}%`)
    }

    // Apply sorting
    if (sortOrder === "newest") {
      query = query.order("created_at", { ascending: false })
    } else if (sortOrder === "oldest") {
      query = query.order("created_at", { ascending: true })
    } else if (sortOrder === "top") {
      query = query.order("vote_count", { ascending: false }).order("created_at", { ascending: false })
    }

    query = query.range(offset, offset + limit - 1)

    const { data, error } = await query

    if (error) {
      console.error("Error fetching posts:", error)
      return { posts: [], count: 0, error: error.message }
    }

    const postsWithVoteStatus = (data || []).map((post: any) => ({
      ...post,
      user: post.user,
      category: post.category,
      has_voted: loggedInUserInternalId
        ? post.votes.some((vote: any) => vote.user_id === loggedInUserInternalId)
        : false,
    }))

    return { posts: postsWithVoteStatus, count: data?.length || 0, error: null }
  } catch (error: any) {
    console.error("Fetch posts error:", error)
    return { posts: [], count: 0, error: error.message || "Failed to fetch posts" }
  }
}

/* convenience aliases to keep old import paths working ------------------- */
export { createCommunityPostAction as createPost }
export { voteOnPostAction as voteOnPost }
export { bookmarkPostAction as bookmarkPost }

/* ---------------------------------------------------------------------- */
/*  Wrapped helpers – ALWAYS async, satisfying “use server” constraints   */
/* ---------------------------------------------------------------------- */
import * as base from "./community-actions-fixed"

/* Each proxy is an async function even if the underlying helper isn’t   */
/* (or is re-exported as a constant). This unblocks the Next.js compiler. */
export async function editPostAction(...args: any[]) {
  // @ts-ignore
  return await (base.editPostAction as any)(...args)
}
export async function deletePostAction(...args: any[]) {
  // @ts-ignore
  return await (base.deletePostAction as any)(...args)
}
export async function createCommentAction(...args: any[]) {
  // @ts-ignore
  return await (base.createCommentAction as any)(...args)
}
export async function editCommentAction(...args: any[]) {
  // @ts-ignore
  return await (base.editCommentAction as any)(...args)
}
export async function deleteCommentAction(...args: any[]) {
  // @ts-ignore
  return await (base.deleteCommentAction as any)(...args)
}
export async function toggleLikeCommentAction(...args: any[]) {
  // @ts-ignore
  return await (base.toggleLikeCommentAction as any)(...args)
}
export async function fetchCommentsForPost(...args: any[]) {
  // @ts-ignore
  return await (base.fetchCommentsForPost as any)(...args)
}
export async function searchUsersForMention(...args: any[]) {
  // @ts-ignore
  return await (base.searchUsersForMention as any)(...args)
}
