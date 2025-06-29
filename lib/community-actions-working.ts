"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface ActionResult {
  success: boolean
  message?: string
  data?: any
  error?: string
}

// Helper function to get authenticated user
async function getAuthenticatedUser() {
  const supabase = createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error("Authentication required")
  }

  // Get internal user ID
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("auth_user_id", user.id)
    .single()

  if (userError || !userData) {
    // Fallback: try to find by id directly
    const { data: fallbackUser, error: fallbackError } = await supabase
      .from("users")
      .select("id")
      .eq("id", user.id)
      .single()

    if (fallbackError || !fallbackUser) {
      throw new Error("User profile not found")
    }
    return { authUser: user, internalUserId: fallbackUser.id }
  }

  return { authUser: user, internalUserId: userData.id }
}

// Helper function to extract hashtags from content
function extractHashtags(content: string): string[] {
  const hashtagRegex = /#[\w]+/g
  const matches = content.match(hashtagRegex)
  return matches ? matches.map((tag) => tag.toLowerCase()) : []
}

/**
 * Create a new community post
 */
export async function createPost(formData: FormData): Promise<ActionResult> {
  try {
    const supabase = createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: "Authentication required" }
    }

    // Get internal user ID
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("auth_user_id", user.id)
      .single()

    if (userError || !userData) {
      return { success: false, error: "User profile not found" }
    }

    const content = formData.get("content") as string
    const category = (formData.get("category") as string) || "general"
    const mediaFile = formData.get("media") as File | null

    if (!content?.trim()) {
      return { success: false, error: "Content is required" }
    }

    // Extract hashtags
    const hashtagRegex = /#[\w]+/g
    const hashtags = content.match(hashtagRegex) || []

    let mediaUrl = null
    let mediaType = null

    // Handle media upload
    if (mediaFile && mediaFile.size > 0) {
      const fileExt = mediaFile.name.split(".").pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `community/${userData.id}/${fileName}`

      const { error: uploadError } = await supabase.storage.from("media").upload(filePath, mediaFile)

      if (uploadError) {
        console.error("Upload error:", uploadError)
        return { success: false, error: "Failed to upload media" }
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("media").getPublicUrl(filePath)

      mediaUrl = publicUrl
      mediaType = mediaFile.type.startsWith("image/") ? "image" : mediaFile.type.startsWith("video/") ? "video" : "file"
    }

    // Create post
    const { data: post, error: postError } = await supabase
      .from("community_posts")
      .insert({
        user_id: userData.id,
        content,
        category,
        hashtags,
        media_url: mediaUrl,
        media_type: mediaType,
        vote_count: 0,
        comment_count: 0,
      })
      .select()
      .single()

    if (postError) {
      console.error("Post creation error:", postError)
      return { success: false, error: "Failed to create post" }
    }

    // Update category count
    await supabase.rpc("increment_category_count", { category_name: category })

    // Update user post count
    await supabase.rpc("increment_user_post_count", { user_id: userData.id })

    revalidatePath("/community")
    return { success: true, message: "Post created successfully", data: post }
  } catch (error) {
    console.error("Create post error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

/**
 * Vote on a post
 */
export async function voteOnPost(postId: number): Promise<ActionResult> {
  try {
    const supabase = createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: "Authentication required" }
    }

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("auth_user_id", user.id)
      .single()

    if (userError || !userData) {
      return { success: false, error: "User profile not found" }
    }

    if (!postId || isNaN(postId)) {
      return { success: false, error: "Invalid post ID" }
    }

    // Call the RPC function to handle voting
    const { data, error } = await supabase.rpc("handle_post_vote_safe", {
      p_post_id: postId,
      p_user_id: userData.id,
      p_coin_cost: 100,
    })

    if (error) {
      console.error("Vote error:", error)
      return { success: false, error: error.message || "Failed to process vote" }
    }

    revalidatePath("/community")
    return {
      success: true,
      message: data?.message || "Vote processed successfully",
      data: {
        hasVoted: data?.has_voted,
        voteCount: data?.vote_count,
      },
    }
  } catch (error) {
    console.error("Vote on post error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

/**
 * Toggle bookmark status for a post
 */
export async function bookmarkPost(postId: number): Promise<ActionResult> {
  try {
    const supabase = createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: "Authentication required" }
    }

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("auth_user_id", user.id)
      .single()

    if (userError || !userData) {
      return { success: false, error: "User profile not found" }
    }

    if (!postId || isNaN(postId)) {
      return { success: false, error: "Invalid post ID" }
    }

    // Check if bookmark exists
    const { data: existingBookmark } = await supabase
      .from("user_bookmarks")
      .select("id")
      .eq("user_id", userData.id)
      .eq("post_id", postId)
      .single()

    let isBookmarked = false

    if (existingBookmark) {
      // Remove bookmark
      const { error: deleteError } = await supabase
        .from("user_bookmarks")
        .delete()
        .eq("user_id", userData.id)
        .eq("post_id", postId)

      if (deleteError) {
        return { success: false, error: "Failed to remove bookmark" }
      }
      isBookmarked = false
    } else {
      // Add bookmark
      const { error: insertError } = await supabase.from("user_bookmarks").insert({
        user_id: userData.id,
        post_id: postId,
      })

      if (insertError) {
        return { success: false, error: "Failed to add bookmark" }
      }
      isBookmarked = true
    }

    revalidatePath("/community")
    return {
      success: true,
      message: isBookmarked ? "Post bookmarked" : "Bookmark removed",
      data: { isBookmarked },
    }
  } catch (error) {
    console.error("Bookmark post error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

/**
 * Add a comment to a post
 */
export async function addComment(postId: number, content: string, parentCommentId?: number): Promise<ActionResult> {
  try {
    const supabase = createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: "Authentication required" }
    }

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("auth_user_id", user.id)
      .single()

    if (userError || !userData) {
      return { success: false, error: "User profile not found" }
    }

    if (!postId || isNaN(postId)) {
      return { success: false, error: "Invalid post ID" }
    }

    if (!content?.trim()) {
      return { success: false, error: "Comment content is required" }
    }

    // Create comment
    const { data: comment, error: commentError } = await supabase
      .from("post_comments")
      .insert({
        post_id: postId,
        user_id: userData.id,
        content: content.trim(),
        parent_comment_id: parentCommentId || null,
      })
      .select(`
        *,
        user:users(id, username, display_name, avatar_url, tier)
      `)
      .single()

    if (commentError) {
      console.error("Comment creation error:", commentError)
      return { success: false, error: "Failed to create comment" }
    }

    // Update post comment count
    await supabase.rpc("increment_post_comment_count", { post_id: postId })

    revalidatePath("/community")
    return {
      success: true,
      message: "Comment added successfully",
      data: comment,
    }
  } catch (error) {
    console.error("Add comment error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

/**
 * Fetch community posts with filters and pagination
 */
export async function fetchCommunityPosts(
  userId?: number,
  options: {
    category?: string
    limit?: number
    offset?: number
    sortBy?: "newest" | "popular" | "trending"
  } = {},
): Promise<ActionResult> {
  try {
    const supabase = createClient()
    const { category, limit = 20, offset = 0, sortBy = "newest" } = options

    let query = supabase.from("community_posts").select(`
        *,
        user:users(id, username, display_name, avatar_url, tier),
        comments:post_comments(count),
        user_votes:post_votes(user_id),
        user_bookmarks:user_bookmarks(user_id)
      `)

    if (category && category !== "all") {
      query = query.eq("category", category)
    }

    // Apply sorting
    switch (sortBy) {
      case "popular":
        query = query.order("vote_count", { ascending: false })
        break
      case "trending":
        query = query.order("created_at", { ascending: false })
        break
      default:
        query = query.order("created_at", { ascending: false })
    }

    query = query.range(offset, offset + limit - 1)

    const { data: posts, error } = await query

    if (error) {
      console.error("Fetch posts error:", error)
      return { success: false, error: "Failed to fetch posts" }
    }

    return {
      success: true,
      data: posts || [],
    }
  } catch (error) {
    console.error("Fetch community posts error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}
