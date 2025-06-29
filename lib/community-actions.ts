"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function fetchCommunityPosts(
  userId?: string,
  options: {
    categoryFilter?: number
    sortOrder?: string
    page?: number
    limit?: number
    searchQuery?: string
  } = {},
) {
  try {
    const supabase = await createClient()
    const { categoryFilter, sortOrder = "newest", page = 1, limit = 10, searchQuery } = options

    let query = supabase.from("community_posts").select(`
        *,
        user:users(id, username, full_name, avatar_url, tier),
        category:community_categories(id, name, color)
      `)

    // Apply filters
    if (categoryFilter) {
      query = query.eq("category_id", categoryFilter)
    }

    if (searchQuery) {
      query = query.ilike("content", `%${searchQuery}%`)
    }

    // Apply sorting
    switch (sortOrder) {
      case "oldest":
        query = query.order("created_at", { ascending: true })
        break
      case "top":
        query = query.order("vote_count", { ascending: false })
        break
      default:
        query = query.order("created_at", { ascending: false })
    }

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data: posts, error } = await query

    if (error) {
      console.error("Error fetching posts:", error)
      return { posts: [], error: error.message }
    }

    return { posts: posts || [], error: null }
  } catch (error) {
    console.error("Error in fetchCommunityPosts:", error)
    return { posts: [], error: "Failed to fetch posts" }
  }
}

export async function fetchCommentsForPost(postId: number) {
  try {
    const supabase = await createClient()
    const { data: comments, error } = await supabase
      .from("community_comments")
      .select(`
        *,
        user:users(id, username, full_name, avatar_url, tier)
      `)
      .eq("post_id", postId)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Error fetching comments:", error)
      return { comments: [], error: error.message }
    }

    return { comments: comments || [], error: null }
  } catch (error) {
    console.error("Error in fetchCommentsForPost:", error)
    return { comments: [], error: "Failed to fetch comments" }
  }
}

export async function createCommentAction(postId: number, content: string) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Authentication required" }
    }

    const { data: comment, error } = await supabase
      .from("community_comments")
      .insert({
        post_id: postId,
        user_id: user.id,
        content: content.trim(),
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating comment:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/community")
    return { success: true, comment }
  } catch (error) {
    console.error("Error in createCommentAction:", error)
    return { success: false, error: "Failed to create comment" }
  }
}

export async function toggleLikeCommentAction(commentId: number) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Authentication required" }
    }

    // Check if already liked
    const { data: existingLike } = await supabase
      .from("comment_likes")
      .select("id")
      .eq("comment_id", commentId)
      .eq("user_id", user.id)
      .single()

    if (existingLike) {
      // Unlike
      await supabase.from("comment_likes").delete().eq("comment_id", commentId).eq("user_id", user.id)
    } else {
      // Like
      await supabase.from("comment_likes").insert({
        comment_id: commentId,
        user_id: user.id,
      })
    }

    revalidatePath("/community")
    return { success: true, liked: !existingLike }
  } catch (error) {
    console.error("Error in toggleLikeCommentAction:", error)
    return { success: false, error: "Failed to toggle like" }
  }
}

export async function deleteCommentAction(commentId: number) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Authentication required" }
    }

    const { error } = await supabase.from("community_comments").delete().eq("id", commentId).eq("user_id", user.id)

    if (error) {
      console.error("Error deleting comment:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/community")
    return { success: true }
  } catch (error) {
    console.error("Error in deleteCommentAction:", error)
    return { success: false, error: "Failed to delete comment" }
  }
}

export async function editCommentAction(commentId: number, content: string) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Authentication required" }
    }

    const { error } = await supabase
      .from("community_comments")
      .update({ content: content.trim() })
      .eq("id", commentId)
      .eq("user_id", user.id)

    if (error) {
      console.error("Error editing comment:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/community")
    return { success: true }
  } catch (error) {
    console.error("Error in editCommentAction:", error)
    return { success: false, error: "Failed to edit comment" }
  }
}

export async function createReportAction(postId: number, reason: string) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Authentication required" }
    }

    const { error } = await supabase.from("post_reports").insert({
      post_id: postId,
      user_id: user.id,
      reason: reason.trim(),
    })

    if (error) {
      console.error("Error creating report:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error("Error in createReportAction:", error)
    return { success: false, error: "Failed to create report" }
  }
}

export async function searchUsersForMention(query: string) {
  try {
    const supabase = await createClient()
    const { data: users, error } = await supabase
      .from("users")
      .select("id, username, full_name, avatar_url")
      .ilike("username", `%${query}%`)
      .limit(10)

    if (error) {
      console.error("Error searching users:", error)
      return { users: [], error: error.message }
    }

    return { users: users || [], error: null }
  } catch (error) {
    console.error("Error in searchUsersForMention:", error)
    return { users: [], error: "Failed to search users" }
  }
}
