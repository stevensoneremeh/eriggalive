"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface ActionResult {
  success: boolean
  message?: string
  data?: any
  error?: string
}

async function getAuthenticatedUser() {
  const supabase = createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error("Authentication required")
  }

  return user
}

async function getInternalUserId(authUserId: string) {
  const supabase = createClient()

  let { data: userData, error } = await supabase.from("users").select("id").eq("auth_user_id", authUserId).single()

  if (error || !userData) {
    const { data: fallbackData, error: fallbackError } = await supabase
      .from("users")
      .select("id")
      .eq("id", authUserId)
      .single()

    if (fallbackError || !fallbackData) {
      throw new Error("User not found in database")
    }

    userData = fallbackData
  }

  return userData.id
}

export async function createPost(formData: FormData): Promise<ActionResult> {
  try {
    const user = await getAuthenticatedUser()
    const internalUserId = await getInternalUserId(user.id)

    const content = formData.get("content") as string
    const category = (formData.get("category") as string) || "general"

    if (!content || content.trim().length === 0) {
      return { success: false, error: "Content is required" }
    }

    const supabase = createClient()

    const hashtagRegex = /#(\w+)/g
    const hashtags = []
    let match
    while ((match = hashtagRegex.exec(content)) !== null) {
      hashtags.push(match[1].toLowerCase())
    }

    const { data: postData, error: postError } = await supabase
      .from("community_posts")
      .insert({
        content: content.trim(),
        user_id: internalUserId,
        category,
        hashtags,
        vote_count: 0,
        comment_count: 0,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (postError) {
      console.error("Post creation error:", postError)
      return { success: false, error: "Failed to create post" }
    }

    await supabase.rpc("increment_category_post_count", {
      category_name: category,
    })

    await supabase.rpc("increment_user_post_count", {
      user_id: internalUserId,
    })

    revalidatePath("/community")
    return {
      success: true,
      message: "Post created successfully!",
      data: postData,
    }
  } catch (error) {
    console.error("Create post error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create post",
    }
  }
}

export async function voteOnPost(postId: number): Promise<ActionResult> {
  try {
    const user = await getAuthenticatedUser()
    const internalUserId = await getInternalUserId(user.id)

    if (!postId || isNaN(postId)) {
      return { success: false, error: "Invalid post ID" }
    }

    const supabase = createClient()

    const { data, error } = await supabase.rpc("handle_post_vote_safe", {
      p_post_id: postId,
      p_user_id: internalUserId,
      p_vote_cost: 100,
    })

    if (error) {
      console.error("Vote error:", error)
      return { success: false, error: error.message || "Failed to process vote" }
    }

    revalidatePath("/community")
    return {
      success: true,
      message: data?.message || "Vote processed successfully!",
      data: {
        voted: data?.voted || false,
        vote_count: data?.vote_count || 0,
      },
    }
  } catch (error) {
    console.error("Vote on post error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to vote on post",
    }
  }
}

export async function bookmarkPost(postId: number): Promise<ActionResult> {
  try {
    const user = await getAuthenticatedUser()
    const internalUserId = await getInternalUserId(user.id)

    if (!postId || isNaN(postId)) {
      return { success: false, error: "Invalid post ID" }
    }

    const supabase = createClient()

    const { data: existingBookmark, error: checkError } = await supabase
      .from("user_bookmarks")
      .select("id")
      .eq("user_id", internalUserId)
      .eq("post_id", postId)
      .single()

    let isBookmarked = false

    if (existingBookmark) {
      const { error: deleteError } = await supabase
        .from("user_bookmarks")
        .delete()
        .eq("user_id", internalUserId)
        .eq("post_id", postId)

      if (deleteError) {
        console.error("Remove bookmark error:", deleteError)
        return { success: false, error: "Failed to remove bookmark" }
      }

      isBookmarked = false
    } else {
      const { error: insertError } = await supabase.from("user_bookmarks").insert({
        user_id: internalUserId,
        post_id: postId,
        created_at: new Date().toISOString(),
      })

      if (insertError) {
        console.error("Add bookmark error:", insertError)
        return { success: false, error: "Failed to add bookmark" }
      }

      isBookmarked = true
    }

    revalidatePath("/community")
    return {
      success: true,
      message: isBookmarked ? "Post bookmarked!" : "Bookmark removed!",
      data: { bookmarked: isBookmarked },
    }
  } catch (error) {
    console.error("Bookmark post error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to bookmark post",
    }
  }
}

export async function addComment(postId: number, content: string, parentCommentId?: number): Promise<ActionResult> {
  try {
    const user = await getAuthenticatedUser()
    const internalUserId = await getInternalUserId(user.id)

    if (!postId || isNaN(postId)) {
      return { success: false, error: "Invalid post ID" }
    }

    if (!content || content.trim().length === 0) {
      return { success: false, error: "Comment content is required" }
    }

    const supabase = createClient()

    const { data: commentData, error: commentError } = await supabase
      .from("community_comments")
      .insert({
        post_id: postId,
        user_id: internalUserId,
        content: content.trim(),
        parent_comment_id: parentCommentId || null,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (commentError) {
      console.error("Comment creation error:", commentError)
      return { success: false, error: "Failed to add comment" }
    }

    await supabase.rpc("increment_post_comment_count", {
      p_post_id: postId,
    })

    revalidatePath("/community")
    return {
      success: true,
      message: "Comment added successfully!",
      data: commentData,
    }
  } catch (error) {
    console.error("Add comment error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to add comment",
    }
  }
}

export async function fetchCommunityPosts(
  userId?: string,
  options: {
    category?: string
    sortBy?: "newest" | "popular" | "trending"
    limit?: number
    offset?: number
  } = {},
): Promise<ActionResult> {
  try {
    const supabase = createClient()
    const { category, sortBy = "newest", limit = 20, offset = 0 } = options

    let query = supabase.from("community_posts").select(`
        *,
        users!community_posts_user_id_fkey(
          id,
          username,
          display_name,
          avatar_url,
          tier
        ),
        community_comments(count),
        community_votes(vote_type),
        user_bookmarks(id)
      `)

    if (category && category !== "all") {
      query = query.eq("category", category)
    }

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
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch posts",
    }
  }
}
