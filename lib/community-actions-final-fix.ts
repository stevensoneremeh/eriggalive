"use server"

/**
 * Canonical server-actions implementation.
 * Nothing but ASYNC functions are exported – no constants, no types.
 */

import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"

/* internal helpers & constants ------------------------------------------- */
const VOTE_COIN_AMOUNT = 5
const COMMENT_COIN_AMOUNT = 2
const POST_COIN_AMOUNT = 10

/* public API (async wrappers) -------------------------------------------- */
export async function createCommunityPostAction(formData: FormData) {
  try {
    const supabase = await getSupabaseClient()
    const user = await getCurrentUser()

    const content = formData.get("content") as string
    const category = formData.get("category") as string
    const mediaUrl = formData.get("mediaUrl") as string

    if (!content?.trim()) {
      return { success: false, error: "Content is required" }
    }

    // Create the post
    const { data: post, error: postError } = await supabase
      .from("community_posts")
      .insert({
        user_id: user.id,
        content: content.trim(),
        category: category || "general",
        media_url: mediaUrl || null,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (postError) {
      console.error("Error creating post:", postError)
      return { success: false, error: "Failed to create post" }
    }

    // Award coins for posting
    await supabase.from("user_coins").upsert(
      {
        user_id: user.id,
        balance: POST_COIN_AMOUNT,
      },
      {
        onConflict: "user_id",
        ignoreDuplicates: false,
      },
    )

    revalidatePath("/community")
    return { success: true, data: post }
  } catch (error) {
    console.error("Error in createPost:", error)
    return { success: false, error: "Failed to create post" }
  }
}

export async function voteOnPostAction(postId: number, postCreatorAuthId = "") {
  try {
    const supabase = await getSupabaseClient()
    const voterProfile = await getCurrentUser()

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
  try {
    const supabase = await getSupabaseClient()
    const user = await getCurrentUser()

    if (!postId) {
      return { success: false, error: "Post ID is required" }
    }

    // Check if already bookmarked
    const { data: existingBookmark } = await supabase
      .from("community_bookmarks")
      .select("*")
      .eq("post_id", postId)
      .eq("user_id", user.id)
      .single()

    if (existingBookmark) {
      // Remove bookmark
      await supabase.from("community_bookmarks").delete().eq("post_id", postId).eq("user_id", user.id)

      return { success: true, bookmarked: false }
    } else {
      // Add bookmark
      await supabase.from("community_bookmarks").insert({
        post_id: postId,
        user_id: user.id,
      })

      return { success: true, bookmarked: true }
    }
  } catch (error) {
    console.error("Error in bookmarkPost:", error)
    return { success: false, error: "Failed to bookmark post" }
  }
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
    const supabase = await getSupabaseClient()
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

export async function createCommentAction(postId: string, content: string, parentId?: string) {
  try {
    const supabase = await getSupabaseClient()
    const user = await getCurrentUser()

    if (!postId || !content?.trim()) {
      return { success: false, error: "Post ID and content are required" }
    }

    const { data: comment, error: commentError } = await supabase
      .from("community_comments")
      .insert({
        post_id: postId,
        user_id: user.id,
        content: content.trim(),
        parent_id: parentId || null,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (commentError) {
      console.error("Error creating comment:", commentError)
      return { success: false, error: "Failed to create comment" }
    }

    // Award coins for commenting
    await supabase.from("user_coins").upsert(
      {
        user_id: user.id,
        balance: COMMENT_COIN_AMOUNT,
      },
      {
        onConflict: "user_id",
        ignoreDuplicates: false,
      },
    )

    revalidatePath("/community")
    return { success: true, data: comment }
  } catch (error) {
    console.error("Error in createComment:", error)
    return { success: false, error: "Failed to create comment" }
  }
}

export async function deletePostAction(postId: string) {
  try {
    const supabase = await getSupabaseClient()
    const user = await getCurrentUser()

    if (!postId) {
      return { success: false, error: "Post ID is required" }
    }

    // Check if user owns the post
    const { data: post } = await supabase.from("community_posts").select("user_id").eq("id", postId).single()

    if (!post || post.user_id !== user.id) {
      return { success: false, error: "Unauthorized" }
    }

    // Delete the post
    const { error } = await supabase.from("community_posts").delete().eq("id", postId)

    if (error) {
      console.error("Error deleting post:", error)
      return { success: false, error: "Failed to delete post" }
    }

    revalidatePath("/community")
    return { success: true }
  } catch (error) {
    console.error("Error in deletePost:", error)
    return { success: false, error: "Failed to delete post" }
  }
}

export async function editPostAction(postId: string, content: string) {
  try {
    const supabase = await getSupabaseClient()
    const user = await getCurrentUser()

    if (!postId || !content?.trim()) {
      return { success: false, error: "Post ID and content are required" }
    }

    // Check if user owns the post
    const { data: post } = await supabase.from("community_posts").select("user_id").eq("id", postId).single()

    if (!post || post.user_id !== user.id) {
      return { success: false, error: "Unauthorized" }
    }

    // Update the post
    const { error } = await supabase
      .from("community_posts")
      .update({
        content: content.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", postId)

    if (error) {
      console.error("Error editing post:", error)
      return { success: false, error: "Failed to edit post" }
    }

    revalidatePath("/community")
    return { success: true }
  } catch (error) {
    console.error("Error in editPost:", error)
    return { success: false, error: "Failed to edit post" }
  }
}

export async function reportPostAction(postId: string, reason: string) {
  try {
    const supabase = await getSupabaseClient()
    const user = await getCurrentUser()

    if (!postId || !reason?.trim()) {
      return { success: false, error: "Post ID and reason are required" }
    }

    // Create report
    const { error } = await supabase.from("community_reports").insert({
      post_id: postId,
      user_id: user.id,
      reason: reason.trim(),
      created_at: new Date().toISOString(),
    })

    if (error) {
      console.error("Error reporting post:", error)
      return { success: false, error: "Failed to report post" }
    }

    return { success: true }
  } catch (error) {
    console.error("Error in reportPost:", error)
    return { success: false, error: "Failed to report post" }
  }
}

export async function followUserAction(userId: string) {
  try {
    const supabase = await getSupabaseClient()
    const user = await getCurrentUser()

    if (!userId || userId === user.id) {
      return { success: false, error: "Invalid user ID" }
    }

    // Check if already following
    const { data: existingFollow } = await supabase
      .from("community_follows")
      .select("*")
      .eq("follower_id", user.id)
      .eq("following_id", userId)
      .single()

    if (existingFollow) {
      return { success: false, error: "Already following this user" }
    }

    // Create follow relationship
    const { error } = await supabase.from("community_follows").insert({
      follower_id: user.id,
      following_id: userId,
      created_at: new Date().toISOString(),
    })

    if (error) {
      console.error("Error following user:", error)
      return { success: false, error: "Failed to follow user" }
    }

    revalidatePath("/community")
    return { success: true }
  } catch (error) {
    console.error("Error in followUser:", error)
    return { success: false, error: "Failed to follow user" }
  }
}

export async function unfollowUserAction(userId: string) {
  try {
    const supabase = await getSupabaseClient()
    const user = await getCurrentUser()

    if (!userId) {
      return { success: false, error: "User ID is required" }
    }

    // Remove follow relationship
    const { error } = await supabase
      .from("community_follows")
      .delete()
      .eq("follower_id", user.id)
      .eq("following_id", userId)

    if (error) {
      console.error("Error unfollowing user:", error)
      return { success: false, error: "Failed to unfollow user" }
    }

    revalidatePath("/community")
    return { success: true }
  } catch (error) {
    console.error("Error in unfollowUser:", error)
    return { success: false, error: "Failed to unfollow user" }
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
export async function editPost(...args: any[]) {
  // @ts-ignore
  return await (base.editPost as any)(...args)
}
export async function deletePost(...args: any[]) {
  // @ts-ignore
  return await (base.deletePost as any)(...args)
}
export async function createComment(...args: any[]) {
  // @ts-ignore
  return await (base.createComment as any)(...args)
}
export async function editComment(...args: any[]) {
  // @ts-ignore
  return await (base.editComment as any)(...args)
}
export async function deleteComment(...args: any[]) {
  // @ts-ignore
  return await (base.deleteComment as any)(...args)
}
export async function toggleLikeComment(...args: any[]) {
  // @ts-ignore
  return await (base.toggleLikeComment as any)(...args)
}
export async function fetchCommentsForPost(...args: any[]) {
  // @ts-ignore
  return await (base.fetchCommentsForPost as any)(...args)
}
export async function searchUsersForMention(...args: any[]) {
  // @ts-ignore
  return await (base.searchUsersForMention as any)(...args)
}

// Helper function to get Supabase client
async function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase configuration")
  }

  return createClient(supabaseUrl, supabaseKey)
}

// Helper function to get current user
async function getCurrentUser() {
  const supabase = await getSupabaseClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error("User not authenticated")
  }

  return user
}
