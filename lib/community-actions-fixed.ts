"use server"

import { revalidatePath } from "next/cache"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import type { User as PublicUser } from "@/types/database"
import DOMPurify from "isomorphic-dompurify"

const VOTE_COIN_AMOUNT = 100

async function getCurrentPublicUserProfile(
  supabaseClient: ReturnType<typeof createServerSupabaseClient>,
): Promise<PublicUser> {
  try {
    const {
      data: { user: authUser },
      error: authError,
    } = await supabaseClient.auth.getUser()

    if (authError || !authUser) {
      throw new Error("User not authenticated.")
    }

    // Try to get existing user profile
    const { data: userProfile, error: profileError } = await supabaseClient
      .from("users")
      .select("*")
      .eq("auth_user_id", authUser.id)
      .single()

    if (profileError && profileError.code !== "PGRST116") {
      console.error("Error fetching user profile:", profileError)
      throw new Error("Failed to fetch user profile")
    }

    if (!userProfile) {
      // Create user profile if it doesn't exist
      const newUserData = {
        auth_user_id: authUser.id,
        username: authUser.user_metadata?.username || authUser.email?.split("@")[0] || `user_${Date.now()}`,
        full_name:
          authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email || "Anonymous User",
        email: authUser.email || "",
        avatar_url: authUser.user_metadata?.avatar_url || null,
        tier: "grassroot" as const,
        role: "user" as const,
        level: 1,
        points: 0,
        coins: 1000, // Starting coins
        is_verified: false,
        is_active: true,
        is_banned: false,
        login_count: 1,
        email_verified: authUser.email_confirmed_at ? true : false,
        phone_verified: false,
        two_factor_enabled: false,
        preferences: {},
        metadata: {},
      }

      const { data: newProfile, error: createError } = await supabaseClient
        .from("users")
        .insert(newUserData)
        .select()
        .single()

      if (createError) {
        console.error("Failed to create user profile:", createError)
        throw new Error("Failed to create user profile")
      }

      return newProfile
    }

    return userProfile
  } catch (error) {
    console.error("Error getting user profile:", error)
    throw error
  }
}

// --- Post Actions ---
export async function createCommunityPostAction(formData: FormData) {
  try {
    const supabase = createServerSupabaseClient()
    const userProfile = await getCurrentPublicUserProfile(supabase)

    const rawContent = formData.get("content") as string
    const categoryId = formData.get("categoryId") as string
    const mediaFile = formData.get("mediaFile") as File | null

    if (!rawContent?.trim() && !mediaFile) {
      return { success: false, error: "Please provide content or upload media." }
    }

    if (!categoryId) {
      return { success: false, error: "Please select a category." }
    }

    const sanitizedContent = rawContent ? DOMPurify.sanitize(rawContent) : ""

    let media_url: string | undefined = undefined
    let media_type: string | undefined = undefined
    let media_metadata: Record<string, any> | undefined = undefined

    if (mediaFile && mediaFile.size > 0) {
      const fileExt = mediaFile.name.split(".").pop()
      const fileName = `${userProfile.id}-${Date.now()}.${fileExt}`
      const filePath = `community_media/${fileName}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("eriggalive-assets")
        .upload(filePath, mediaFile)

      if (uploadError) {
        console.error("Media upload error:", uploadError)
        return { success: false, error: `Media upload failed: ${uploadError.message}` }
      }

      const { data: publicUrlData } = supabase.storage.from("eriggalive-assets").getPublicUrl(uploadData.path)
      media_url = publicUrlData.publicUrl

      if (mediaFile.type.startsWith("image/")) media_type = "image"
      else if (mediaFile.type.startsWith("audio/")) media_type = "audio"
      else if (mediaFile.type.startsWith("video/")) media_type = "video"

      media_metadata = {
        name: mediaFile.name,
        size: mediaFile.size,
        type: mediaFile.type,
      }
    }

    const postData = {
      user_id: userProfile.id,
      category_id: Number.parseInt(categoryId),
      content: sanitizedContent,
      media_url,
      media_type,
      media_metadata,
      is_published: true,
      is_deleted: false,
      is_edited: false,
      vote_count: 0,
      comment_count: 0,
      tags: [],
      mentions: null,
    }

    const { data: newPost, error } = await supabase
      .from("community_posts")
      .insert(postData)
      .select(`
        *,
        user:users!community_posts_user_id_fkey(id, username, full_name, avatar_url, tier),
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

export async function voteOnPostAction(postId: number, postCreatorAuthId: string) {
  try {
    const supabase = createServerSupabaseClient()
    const voterProfile = await getCurrentPublicUserProfile(supabase)

    // Check if trying to vote on own post
    const { data: postData } = await supabase.from("community_posts").select("user_id").eq("id", postId).single()

    if (postData && postData.user_id === voterProfile.id) {
      return {
        success: false,
        error: "You cannot vote on your own post.",
        code: "SELF_VOTE",
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
      if (error.message.includes("Insufficient coins")) {
        return {
          success: false,
          error: "Not enough Erigga Coins to vote.",
          code: "INSUFFICIENT_FUNDS",
        }
      }
      if (error.message.includes("Cannot vote on own post")) {
        return {
          success: false,
          error: "You cannot vote on your own post.",
          code: "SELF_VOTE",
        }
      }
      if (error.message.includes("Already voted")) {
        return {
          success: false,
          error: "You have already voted on this post.",
          code: "ALREADY_VOTED",
        }
      }
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

// --- Fetching Actions ---
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

    const { data, error, count } = await query

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

    return { posts: postsWithVoteStatus, count: count || data?.length || 0, error: null }
  } catch (error: any) {
    console.error("Fetch posts error:", error)
    return { posts: [], count: 0, error: error.message || "Failed to fetch posts" }
  }
}

// Export other functions from the original file
export {
  editPostAction,
  deletePostAction,
  createCommentAction,
  editCommentAction,
  deleteCommentAction,
  toggleLikeCommentAction,
  fetchCommentsForPost,
  searchUsersForMention,
} from "./community-actions"
