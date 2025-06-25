"use server"

import { revalidatePath } from "next/cache"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import type { User as PublicUser, CommunityComment } from "@/types/database"
import DOMPurify from "isomorphic-dompurify"
import { deleteCommentAction, editCommentAction, toggleLikeCommentAction, createReportAction, searchUsersForMention } from "@/lib/community-actions-legacy"

const VOTE_COIN_AMOUNT = 100

async function getCurrentPublicUserProfile(
  supabaseClient: ReturnType<typeof createServerSupabaseClient>,
): Promise<PublicUser | null> {
  try {
    const {
      data: { user: authUser },
      error: authError,
    } = await supabaseClient.auth.getUser()

    if (authError || !authUser) {
      console.error("Auth error:", authError)
      return null
    }

    // Try to get user profile
    const { data: userProfile, error: profileError } = await supabaseClient
      .from("users")
      .select("*")
      .eq("auth_user_id", authUser.id)
      .single()

    if (profileError || !userProfile) {
      console.error("User profile not found, creating one...")

      // Create user profile if it doesn't exist
      const { data: newProfile, error: createError } = await supabaseClient
        .from("users")
        .insert({
          auth_user_id: authUser.id,
          username: authUser.user_metadata?.username || authUser.email?.split("@")[0] || "user",
          full_name: authUser.user_metadata?.full_name || authUser.email || "",
          email: authUser.email || "",
          avatar_url: authUser.user_metadata?.avatar_url,
        })
        .select()
        .single()

      if (createError) {
        console.error("Failed to create user profile:", createError)
        return null
      }

      return newProfile
    }

    return userProfile
  } catch (error) {
    console.error("Error getting user profile:", error)
    return null
  }
}

// --- Post Actions ---
export async function createCommunityPostAction(formData: FormData) {
  try {
    const supabase = createServerSupabaseClient()
    const userProfile = await getCurrentPublicUserProfile(supabase)

    if (!userProfile) {
      return { success: false, error: "User not authenticated or profile not found." }
    }

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

    if (!voterProfile) {
      return {
        success: false,
        error: "User not authenticated.",
        code: "NOT_AUTHENTICATED",
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

    // Check if already voted
    const { data: existingVote } = await supabase
      .from("community_post_votes")
      .select("*")
      .eq("post_id", postId)
      .eq("user_id", voterProfile.id)
      .single()

    if (existingVote) {
      return {
        success: false,
        error: "You have already voted on this post.",
        code: "ALREADY_VOTED",
      }
    }

    // Call the RPC function
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
      message: data
        ? `Voted successfully! ${VOTE_COIN_AMOUNT} coins transferred.`
        : `Vote removed! ${VOTE_COIN_AMOUNT} coins refunded.`,
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

export async function createCommentAction(postId: number, content: string, parentCommentId?: number | null) {
  try {
    const supabase = createServerSupabaseClient()
    const userProfile = await getCurrentPublicUserProfile(supabase)

    if (!userProfile) {
      return { success: false, error: "User not authenticated." }
    }

    if (!content?.trim()) {
      return { success: false, error: "Comment cannot be empty." }
    }

    const sanitizedContent = DOMPurify.sanitize(content)

    const { data: newComment, error } = await supabase
      .from("community_comments")
      .insert({
        post_id: postId,
        user_id: userProfile.id,
        content: sanitizedContent,
        parent_comment_id: parentCommentId || null,
      })
      .select(`
        *,
        user:users!community_comments_user_id_fkey(id, auth_user_id, username, full_name, avatar_url, tier)
      `)
      .single()

    if (error) {
      console.error("Comment creation error:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/community")
    return { success: true, comment: newComment }
  } catch (error: any) {
    console.error("Create comment action error:", error)
    return { success: false, error: error.message || "Failed to create comment" }
  }
}

export async function fetchCommentsForPost(postId: number, loggedInUserId?: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Get logged in user's internal ID if provided
    let loggedInUserInternalId: number | undefined
    if (loggedInUserId) {
      const { data: userData } = await supabase.from("users").select("id").eq("auth_user_id", loggedInUserId).single()
      loggedInUserInternalId = userData?.id
    }

    const { data, error } = await supabase
      .from("community_comments")
      .select(`
        *,
        user:users!community_comments_user_id_fkey(id, auth_user_id, username, full_name, avatar_url, tier),
        likes:community_comment_likes(user_id)
      `)
      .eq("post_id", postId)
      .eq("is_deleted", false)
      .is("parent_comment_id", null)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Error fetching comments:", error)
      return []
    }

    const commentsWithReplies = await Promise.all(
      (data || []).map(async (comment: any) => {
        const { data: repliesData, error: repliesError } = await supabase
          .from("community_comments")
          .select(`
            *,
            user:users!community_comments_user_id_fkey(id, auth_user_id, username, full_name, avatar_url, tier),
            likes:community_comment_likes(user_id)
          `)
          .eq("post_id", postId)
          .eq("parent_comment_id", comment.id)
          .eq("is_deleted", false)
          .order("created_at", { ascending: true })

        return {
          ...comment,
          user: comment.user,
          has_liked: loggedInUserInternalId
            ? comment.likes.some((like: any) => like.user_id === loggedInUserInternalId)
            : false,
          replies: repliesError
            ? []
            : (repliesData || []).map((r: any) => ({
                ...r,
                user: r.user,
                has_liked: loggedInUserInternalId
                  ? r.likes.some((like: any) => like.user_id === loggedInUserInternalId)
                  : false,
              })),
        }
      }),
    )

    return commentsWithReplies as CommunityComment[]
  } catch (error: any) {
    console.error("Fetch comments error:", error)
    return []
  }
}

// --- Compatibility re-exports for legacy imports ---------------------------

export { deleteCommentAction }
export { editCommentAction }
export { toggleLikeCommentAction }
export { createReportAction }
export { searchUsersForMention }
