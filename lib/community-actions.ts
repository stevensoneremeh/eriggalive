"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import DOMPurify from "isomorphic-dompurify"
import type { User as PublicUser, CommunityComment, ReportReason, ReportTargetType } from "@/types/database"

const VOTE_COIN_AMOUNT = 100

async function getCurrentPublicUserProfile(
  supabaseClient: ReturnType<typeof createClient>,
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
export async function createCommunityPost(formData: FormData) {
  try {
    const supabase = await createClient()

    // Get current user safely
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: "Authentication required" }
    }

    // Get user profile safely
    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select("id")
      .eq("auth_user_id", user.id)
      .single()

    if (profileError || !userProfile) {
      return { success: false, error: "User profile not found" }
    }

    const content = formData.get("content") as string
    const categoryId = formData.get("categoryId") as string
    const mediaFile = formData.get("mediaFile") as File | null

    if (!content?.trim() && !mediaFile) {
      return { success: false, error: "Please provide content or upload media." }
    }

    if (!categoryId) {
      return { success: false, error: "Please select a category." }
    }

    const sanitizedContent = DOMPurify.sanitize(content)

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
      vote_count: 0,
      comment_count: 0,
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

export async function editPostAction(postId: number, formData: FormData) {
  try {
    const supabase = await createClient()
    const userProfile = await getCurrentPublicUserProfile(supabase)

    if (!userProfile) {
      return { success: false, error: "User not authenticated or profile not found." }
    }

    const rawContent = formData.get("content") as string

    if (!rawContent?.trim()) {
      return { success: false, error: "Content cannot be empty." }
    }

    const sanitizedContent = DOMPurify.sanitize(rawContent)

    const { data: existingPost, error: fetchError } = await supabase
      .from("community_posts")
      .select("user_id")
      .eq("id", postId)
      .single()

    if (fetchError || !existingPost) {
      return { success: false, error: "Post not found." }
    }

    if (existingPost.user_id !== userProfile.id) {
      return { success: false, error: "Not authorized to edit this post." }
    }

    const { data, error } = await supabase
      .from("community_posts")
      .update({
        content: sanitizedContent,
        is_edited: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", postId)
      .eq("user_id", userProfile.id)
      .select(`
        *,
        user:users!community_posts_user_id_fkey(id, username, full_name, avatar_url, tier),
        category:community_categories!community_posts_category_id_fkey(id, name, slug)
      `)
      .single()

    if (error) {
      console.error("Post edit error:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/community")
    return { success: true, post: data }
  } catch (error: any) {
    console.error("Edit post action error:", error)
    return { success: false, error: error.message || "Failed to edit post" }
  }
}

export async function deletePostAction(postId: number) {
  try {
    const supabase = await createClient()
    const userProfile = await getCurrentPublicUserProfile(supabase)

    if (!userProfile) {
      return { success: false, error: "User not authenticated or profile not found." }
    }

    const { error } = await supabase
      .from("community_posts")
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
      })
      .eq("id", postId)
      .eq("user_id", userProfile.id)

    if (error) {
      console.error("Post delete error:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/community")
    return { success: true }
  } catch (error: any) {
    console.error("Delete post action error:", error)
    return { success: false, error: error.message || "Failed to delete post" }
  }
}

export async function voteOnPostAction(postId: number, postCreatorAuthId: string) {
  try {
    const supabase = await createClient()
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

// --- Comment Actions ---
export async function createCommentAction(postId: number, content: string, parentCommentId?: number | null) {
  try {
    const supabase = await createClient()
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

export async function editCommentAction(commentId: number, content: string) {
  try {
    const supabase = await createClient()
    const userProfile = await getCurrentPublicUserProfile(supabase)

    if (!userProfile) {
      return { success: false, error: "User not authenticated or profile not found." }
    }

    if (!content?.trim()) {
      return { success: false, error: "Comment cannot be empty." }
    }

    const sanitizedContent = DOMPurify.sanitize(content)

    const { data, error } = await supabase
      .from("community_comments")
      .update({
        content: sanitizedContent,
        is_edited: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", commentId)
      .eq("user_id", userProfile.id)
      .select(`
        *,
        user:users!community_comments_user_id_fkey(id, auth_user_id, username, full_name, avatar_url, tier)
      `)
      .single()

    if (error) {
      console.error("Comment edit error:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/community")
    return { success: true, comment: data }
  } catch (error: any) {
    console.error("Edit comment action error:", error)
    return { success: false, error: error.message || "Failed to edit comment" }
  }
}

export async function deleteCommentAction(commentId: number) {
  try {
    const supabase = await createClient()
    const userProfile = await getCurrentPublicUserProfile(supabase)

    if (!userProfile) {
      return { success: false, error: "User not authenticated or profile not found." }
    }

    const { error } = await supabase
      .from("community_comments")
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        content: "[deleted]",
      })
      .eq("id", commentId)
      .eq("user_id", userProfile.id)

    if (error) {
      console.error("Comment delete error:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/community")
    return { success: true }
  } catch (error: any) {
    console.error("Delete comment action error:", error)
    return { success: false, error: error.message || "Failed to delete comment" }
  }
}

export async function toggleLikeCommentAction(commentId: number) {
  try {
    const supabase = await createClient()
    const userProfile = await getCurrentPublicUserProfile(supabase)

    if (!userProfile) {
      return { success: false, error: "User not authenticated or profile not found." }
    }

    const { data: existingLike, error: fetchError } = await supabase
      .from("community_comment_likes")
      .select("comment_id")
      .eq("comment_id", commentId)
      .eq("user_id", userProfile.id)
      .maybeSingle()

    if (fetchError && fetchError.code !== "PGRST116") {
      console.error("Like fetch error:", fetchError)
      return { success: false, error: fetchError.message, liked: false }
    }

    if (existingLike) {
      // Remove like
      const { error: deleteError } = await supabase
        .from("community_comment_likes")
        .delete()
        .eq("comment_id", commentId)
        .eq("user_id", userProfile.id)

      if (deleteError) {
        console.error("Like delete error:", deleteError)
        return { success: false, error: deleteError.message, liked: true }
      }

      revalidatePath("/community")
      return { success: true, liked: false }
    } else {
      // Add like
      const { error: insertError } = await supabase
        .from("community_comment_likes")
        .insert({ comment_id: commentId, user_id: userProfile.id })

      if (insertError) {
        console.error("Like insert error:", insertError)
        return { success: false, error: insertError.message, liked: false }
      }

      revalidatePath("/community")
      return { success: true, liked: true }
    }
  } catch (error: any) {
    console.error("Toggle like action error:", error)
    return { success: false, error: error.message || "Failed to toggle like" }
  }
}

// --- Report Actions ---
export async function createReportAction(
  targetId: number,
  targetType: ReportTargetType,
  reason: ReportReason,
  additionalNotes = "",
) {
  try {
    const supabase = await createClient()
    const userProfile = await getCurrentPublicUserProfile(supabase)

    if (!userProfile) {
      return { success: false, error: "User not authenticated or profile not found." }
    }

    if (!reason) {
      return { success: false, error: "Please select a reason for the report." }
    }

    const { error } = await supabase.from("community_reports").insert({
      reporter_user_id: userProfile.id,
      target_id: targetId,
      target_type: targetType,
      reason,
      additional_notes: additionalNotes || null,
    })

    if (error) {
      console.error("Report creation error:", error)
      return { success: false, error: error.message }
    }

    // We don't need to revalidate a specific path, but you can do so if you show reports somewhere
    return { success: true }
  } catch (error: any) {
    console.error("Create report action error:", error)
    return { success: false, error: error.message || "Failed to submit report" }
  }
}

// --- Fetching Actions (with search) ---
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

export async function fetchCommentsForPost(postId: number, loggedInUserId?: string) {
  try {
    const supabase = await createClient()

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

export async function searchUsersForMention(query: string) {
  try {
    if (!query || query.length < 2) return []

    const supabase = await createClient()
    const { data, error } = await supabase
      .from("users")
      .select("id, username, full_name, avatar_url")
      .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
      .limit(5)

    if (error) {
      console.error("Error searching users:", error)
      return []
    }

    return (data || []).map((u) => ({
      id: u.id,
      label: u.username,
      name: u.full_name,
      avatar: u.avatar_url,
    }))
  } catch (error: any) {
    console.error("Search users error:", error)
    return []
  }
}

export async function getDummyPosts() {
  return [
    {
      id: 1,
      user_id: 1,
      category_id: 1,
      content: "Welcome to the Erigga community! 🎵 Share your bars, stories, and connect with fellow fans.",
      media_url: null,
      media_type: null,
      media_metadata: null,
      vote_count: 12,
      comment_count: 5,
      tags: ["welcome", "community"],
      mentions: null,
      is_published: true,
      is_edited: false,
      is_deleted: false,
      deleted_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user: {
        id: 1,
        auth_user_id: "dummy-auth-id-1",
        username: "eriggaofficial",
        full_name: "Erigga",
        avatar_url: "/placeholder-user.jpg",
        tier: "blood" as const,
      },
      category: {
        id: 1,
        name: "General",
        slug: "general",
      },
      has_voted: false,
    },
    {
      id: 2,
      user_id: 2,
      category_id: 2,
      content:
        "Just dropped some fire bars 🔥\n\n*They say I'm the king of my city*\n*But I tell them I'm just getting started*\n*Paper boy flow, now I'm paper rich*\n*From the streets to the studio, never departed*",
      media_url: null,
      media_type: null,
      media_metadata: null,
      vote_count: 8,
      comment_count: 3,
      tags: ["bars", "rap", "fire"],
      mentions: null,
      is_published: true,
      is_edited: false,
      is_deleted: false,
      deleted_at: null,
      created_at: new Date(Date.now() - 3600000).toISOString(),
      updated_at: new Date(Date.now() - 3600000).toISOString(),
      user: {
        id: 2,
        auth_user_id: "dummy-auth-id-2",
        username: "warriking",
        full_name: "Warri King",
        avatar_url: "/placeholder-user.jpg",
        tier: "pioneer" as const,
      },
      category: {
        id: 2,
        name: "Bars",
        slug: "bars",
      },
      has_voted: false,
    },
  ]
}

export async function fetchCommunityCategories() {
  try {
    const supabase = await createClient()

    const { data: categories, error } = await supabase
      .from("community_categories")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true })

    if (error) {
      console.error("Error fetching categories:", error)
      return []
    }

    return categories || []
  } catch (error) {
    console.error("Error in fetchCommunityCategories:", error)
    return []
  }
}
