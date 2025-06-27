"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

const VOTE_COIN_AMOUNT = 100

// --- Post Actions ---
export async function createCommunityPostAction(formData: FormData) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: "User not authenticated." }
    }

    // Get user profile
    const { data: userProfile } = await supabase.from("users").select("*").eq("auth_user_id", user.id).single()

    if (!userProfile) {
      return { success: false, error: "User profile not found." }
    }

    const rawContent = formData.get("content") as string
    const categoryId = formData.get("categoryId") as string

    if (!rawContent?.trim()) {
      return { success: false, error: "Content is required." }
    }

    if (!categoryId) {
      return { success: false, error: "Please select a category." }
    }

    const postData = {
      user_id: userProfile.id,
      category_id: Number.parseInt(categoryId),
      content: rawContent.trim(),
      is_published: true,
      is_deleted: false,
      is_edited: false,
      vote_count: 0,
      comment_count: 0,
    }

    const { data: newPost, error } = await supabase
      .from("community_posts")
      .insert(postData)
      .select(`
        *,
        user:users!community_posts_user_id_fkey(id, auth_user_id, username, full_name, avatar_url, tier),
        category:community_categories!community_posts_category_id_fkey(id, name, slug)
      `)
      .single()

    if (error) {
      console.error("Post creation error:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/community")
    return { success: true, post: newPost }
  } catch (error: any) {
    console.error("Create post action error:", error)
    return { success: false, error: error.message || "Failed to create post" }
  }
}

export async function voteOnPostAction(postId: number, postCreatorAuthId = "") {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: "User not authenticated.",
        code: "NOT_AUTHENTICATED",
      }
    }

    // Get user profile
    const { data: voterProfile } = await supabase.from("users").select("*").eq("auth_user_id", user.id).single()

    if (!voterProfile) {
      return {
        success: false,
        error: "User profile not found.",
        code: "PROFILE_NOT_FOUND",
      }
    }

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
    const supabase = await createClient()
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

export async function deletePost(postId: number) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: "User not authenticated." }
    }

    // Get user profile
    const { data: userProfile } = await supabase.from("users").select("*").eq("auth_user_id", user.id).single()

    if (!userProfile) {
      return { success: false, error: "User profile not found." }
    }

    // Check if user owns the post
    const { data: post } = await supabase.from("community_posts").select("user_id").eq("id", postId).single()

    if (!post || post.user_id !== userProfile.id) {
      return { success: false, error: "Unauthorized" }
    }

    // Soft delete the post
    const { error } = await supabase
      .from("community_posts")
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
      })
      .eq("id", postId)

    if (error) {
      console.error("Error deleting post:", error)
      return { success: false, error: "Failed to delete post" }
    }

    revalidatePath("/community")
    return { success: true }
  } catch (error: any) {
    console.error("Error in deletePost:", error)
    return { success: false, error: error.message || "Failed to delete post" }
  }
}

export async function editPost(postId: number, content: string) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: "User not authenticated." }
    }

    // Get user profile
    const { data: userProfile } = await supabase.from("users").select("*").eq("auth_user_id", user.id).single()

    if (!userProfile) {
      return { success: false, error: "User profile not found." }
    }

    if (!content?.trim()) {
      return { success: false, error: "Content is required" }
    }

    // Check if user owns the post
    const { data: post } = await supabase.from("community_posts").select("user_id").eq("id", postId).single()

    if (!post || post.user_id !== userProfile.id) {
      return { success: false, error: "Unauthorized" }
    }

    // Update the post
    const { error } = await supabase
      .from("community_posts")
      .update({
        content: content.trim(),
        is_edited: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", postId)

    if (error) {
      console.error("Error editing post:", error)
      return { success: false, error: "Failed to edit post" }
    }

    revalidatePath("/community")
    return { success: true }
  } catch (error: any) {
    console.error("Error in editPost:", error)
    return { success: false, error: error.message || "Failed to edit post" }
  }
}

export async function reportPost(postId: number, reason: string) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: "User not authenticated." }
    }

    // Get user profile
    const { data: userProfile } = await supabase.from("users").select("*").eq("auth_user_id", user.id).single()

    if (!userProfile) {
      return { success: false, error: "User profile not found." }
    }

    if (!reason?.trim()) {
      return { success: false, error: "Reason is required" }
    }

    // Create report
    const { error } = await supabase.from("community_reports").insert({
      post_id: postId,
      user_id: userProfile.id,
      reason: reason.trim(),
      created_at: new Date().toISOString(),
    })

    if (error) {
      console.error("Error reporting post:", error)
      return { success: false, error: "Failed to report post" }
    }

    return { success: true }
  } catch (error: any) {
    console.error("Error in reportPost:", error)
    return { success: false, error: error.message || "Failed to report post" }
  }
}

export async function followUser(targetUserId: string) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: "User not authenticated." }
    }

    // Get user profile
    const { data: userProfile } = await supabase.from("users").select("*").eq("auth_user_id", user.id).single()

    if (!userProfile) {
      return { success: false, error: "User profile not found." }
    }

    if (!targetUserId || targetUserId === userProfile.id.toString()) {
      return { success: false, error: "Invalid user ID" }
    }

    // Check if already following
    const { data: existingFollow } = await supabase
      .from("community_follows")
      .select("*")
      .eq("follower_id", userProfile.id)
      .eq("following_id", targetUserId)
      .single()

    if (existingFollow) {
      return { success: false, error: "Already following this user" }
    }

    // Create follow relationship
    const { error } = await supabase.from("community_follows").insert({
      follower_id: userProfile.id,
      following_id: targetUserId,
      created_at: new Date().toISOString(),
    })

    if (error) {
      console.error("Error following user:", error)
      return { success: false, error: "Failed to follow user" }
    }

    revalidatePath("/community")
    return { success: true }
  } catch (error: any) {
    console.error("Error in followUser:", error)
    return { success: false, error: error.message || "Failed to follow user" }
  }
}

export async function unfollowUser(targetUserId: string) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: "User not authenticated." }
    }

    // Get user profile
    const { data: userProfile } = await supabase.from("users").select("*").eq("auth_user_id", user.id).single()

    if (!userProfile) {
      return { success: false, error: "User profile not found." }
    }

    if (!targetUserId) {
      return { success: false, error: "User ID is required" }
    }

    // Remove follow relationship
    const { error } = await supabase
      .from("community_follows")
      .delete()
      .eq("follower_id", userProfile.id)
      .eq("following_id", targetUserId)

    if (error) {
      console.error("Error unfollowing user:", error)
      return { success: false, error: "Failed to unfollow user" }
    }

    revalidatePath("/community")
    return { success: true }
  } catch (error: any) {
    console.error("Error in unfollowUser:", error)
    return { success: false, error: error.message || "Failed to unfollow user" }
  }
}

export async function bookmarkPost(postId: number) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: "User not authenticated." }
    }

    // Get user profile
    const { data: userProfile } = await supabase.from("users").select("*").eq("auth_user_id", user.id).single()

    if (!userProfile) {
      return { success: false, error: "User profile not found." }
    }

    // Check if already bookmarked
    const { data: existingBookmark } = await supabase
      .from("user_bookmarks")
      .select("id")
      .eq("user_id", userProfile.id)
      .eq("post_id", postId)
      .single()

    if (existingBookmark) {
      // Remove bookmark
      await supabase.from("user_bookmarks").delete().eq("user_id", userProfile.id).eq("post_id", postId)

      return { success: true, bookmarked: false }
    } else {
      // Add bookmark
      await supabase.from("user_bookmarks").insert({
        user_id: userProfile.id,
        post_id: postId,
      })

      return { success: true, bookmarked: true }
    }
  } catch (error: any) {
    console.error("Bookmark error:", error)
    return { success: false, error: error.message || "Failed to bookmark" }
  }
}

// Re-export other functions that don't need auth changes
export {
  createCommentAction,
  editCommentAction,
  deleteCommentAction,
  toggleLikeCommentAction,
  fetchCommentsForPost,
  searchUsersForMention,
} from "./community-actions-fixed"

// Alias exports for backward compatibility
export async function createPost(formData: FormData) {
  return await createCommunityPostAction(formData)
}

export async function voteOnPost(postId: number, postCreatorAuthId = "") {
  return await voteOnPostAction(postId, postCreatorAuthId)
}
