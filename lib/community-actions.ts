"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import type { CommunityPost } from "@/types/database" // Assuming your types are correctly defined

const VOTE_COIN_AMOUNT = 100 // Define constants internally or pass as args if they vary

export interface CreatePostPayload {
  content: string
  categoryId: string
  mediaFile?: File
}

export async function createCommunityPostAction(formData: FormData) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      redirect("/login")
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("id")
      .eq("auth_user_id", user.id)
      .single()

    if (profileError || !profile) {
      return { success: false, error: "User profile not found" }
    }

    const content = formData.get("content") as string
    const categoryId = Number.parseInt(formData.get("categoryId") as string)

    if (!content?.trim() || !categoryId) {
      return { success: false, error: "Content and category are required" }
    }

    const { data: post, error } = await supabase
      .from("community_posts")
      .insert({
        user_id: profile.id,
        category_id: categoryId,
        content: content.trim(),
        is_published: true,
        is_deleted: false,
        vote_count: 0,
        comment_count: 0,
      })
      .select(`
        *,
        users!inner (
          id,
          username,
          full_name,
          avatar_url,
          tier
        ),
        community_categories!inner (
          name,
          slug,
          color
        )
      `)
      .single()

    if (error) {
      console.error("Error creating post:", error)
      return { success: false, error: "Failed to create post" }
    }

    revalidatePath("/community")
    return { success: true, data: post }
  } catch (error) {
    console.error("Server action error:", error)
    return { success: false, error: "Internal server error" }
  }
}

export async function voteOnPostAction(postId: number) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      redirect("/login")
    }

    const { data: profile } = await supabase.from("users").select("id, coins").eq("auth_user_id", user.id).single()

    if (!profile) {
      return { success: false, error: "User profile not found" }
    }

    // Check if user has already voted
    const { data: existingVote } = await supabase
      .from("post_votes")
      .select("*")
      .eq("post_id", postId)
      .eq("user_id", profile.id)
      .single()

    if (existingVote) {
      // Remove vote
      const { error } = await supabase.from("post_votes").delete().eq("post_id", postId).eq("user_id", profile.id)

      if (error) {
        return { success: false, error: "Failed to remove vote" }
      }

      // Decrement vote count
      await supabase.from("community_posts").update({ vote_count: supabase.sql`vote_count - 1` }).eq("id", postId)

      revalidatePath("/community")
      return { success: true, action: "removed" }
    } else {
      // Add vote
      const { error } = await supabase.from("post_votes").insert({
        post_id: postId,
        user_id: profile.id,
      })

      if (error) {
        return { success: false, error: "Failed to add vote" }
      }

      // Increment vote count
      await supabase.from("community_posts").update({ vote_count: supabase.sql`vote_count + 1` }).eq("id", postId)

      revalidatePath("/community")
      return { success: true, action: "added" }
    }
  } catch (error) {
    console.error("Vote action error:", error)
    return { success: false, error: "Internal server error" }
  }
}

export async function bookmarkPostAction(postId: number) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      redirect("/login")
    }

    const { data: profile } = await supabase.from("users").select("id").eq("auth_user_id", user.id).single()

    if (!profile) {
      return { success: false, error: "User profile not found" }
    }

    // Check if already bookmarked
    const { data: existingBookmark } = await supabase
      .from("post_bookmarks")
      .select("*")
      .eq("post_id", postId)
      .eq("user_id", profile.id)
      .single()

    if (existingBookmark) {
      // Remove bookmark
      const { error } = await supabase.from("post_bookmarks").delete().eq("post_id", postId).eq("user_id", profile.id)

      if (error) {
        return { success: false, error: "Failed to remove bookmark" }
      }

      revalidatePath("/community")
      return { success: true, action: "removed" }
    } else {
      // Add bookmark
      const { error } = await supabase.from("post_bookmarks").insert({
        post_id: postId,
        user_id: profile.id,
      })

      if (error) {
        return { success: false, error: "Failed to add bookmark" }
      }

      revalidatePath("/community")
      return { success: true, action: "added" }
    }
  } catch (error) {
    console.error("Bookmark action error:", error)
    return { success: false, error: "Internal server error" }
  }
}

export async function createCommentAction(postId: number, content: string, parentCommentId?: number) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      redirect("/login")
    }

    const { data: profile } = await supabase.from("users").select("id").eq("auth_user_id", user.id).single()

    if (!profile) {
      return { success: false, error: "User profile not found" }
    }

    if (!content?.trim()) {
      return { success: false, error: "Comment content is required" }
    }

    const { data: comment, error } = await supabase
      .from("post_comments")
      .insert({
        post_id: postId,
        user_id: profile.id,
        parent_comment_id: parentCommentId || null,
        content: content.trim(),
      })
      .select(`
        *,
        users!inner (
          id,
          username,
          full_name,
          avatar_url,
          tier
        )
      `)
      .single()

    if (error) {
      console.error("Error creating comment:", error)
      return { success: false, error: "Failed to create comment" }
    }

    // Update comment count on post
    await supabase.from("community_posts").update({ comment_count: supabase.sql`comment_count + 1` }).eq("id", postId)

    revalidatePath("/community")
    return { success: true, data: comment }
  } catch (error) {
    console.error("Comment action error:", error)
    return { success: false, error: "Internal server error" }
  }
}

export async function editCommentAction(commentId: number, content: string) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      redirect("/login")
    }

    const { data: profile } = await supabase.from("users").select("id").eq("auth_user_id", user.id).single()

    if (!profile) {
      return { success: false, error: "User profile not found" }
    }

    const { data: comment, error } = await supabase
      .from("post_comments")
      .update({
        content: content.trim(),
        is_edited: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", commentId)
      .eq("user_id", profile.id)
      .select()
      .single()

    if (error) {
      return { success: false, error: "Failed to edit comment" }
    }

    revalidatePath("/community")
    return { success: true, data: comment }
  } catch (error) {
    console.error("Edit comment error:", error)
    return { success: false, error: "Internal server error" }
  }
}

export async function deleteCommentAction(commentId: number) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      redirect("/login")
    }

    const { data: profile } = await supabase.from("users").select("id, tier").eq("auth_user_id", user.id).single()

    if (!profile) {
      return { success: false, error: "User profile not found" }
    }

    // Check if user owns the comment or is admin/moderator
    const { data: comment } = await supabase
      .from("post_comments")
      .select("user_id, post_id")
      .eq("id", commentId)
      .single()

    if (!comment) {
      return { success: false, error: "Comment not found" }
    }

    const canDelete = comment.user_id === profile.id || ["admin", "mod"].includes(profile.tier)

    if (!canDelete) {
      return { success: false, error: "Permission denied" }
    }

    const { error } = await supabase
      .from("post_comments")
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
      })
      .eq("id", commentId)

    if (error) {
      return { success: false, error: "Failed to delete comment" }
    }

    // Update comment count on post
    await supabase
      .from("community_posts")
      .update({ comment_count: supabase.sql`comment_count - 1` })
      .eq("id", comment.post_id)

    revalidatePath("/community")
    return { success: true }
  } catch (error) {
    console.error("Delete comment error:", error)
    return { success: false, error: "Internal server error" }
  }
}

export async function toggleLikeCommentAction(commentId: number) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      redirect("/login")
    }

    const { data: profile } = await supabase.from("users").select("id").eq("auth_user_id", user.id).single()

    if (!profile) {
      return { success: false, error: "User profile not found" }
    }

    // Check if already liked
    const { data: existingLike } = await supabase
      .from("comment_likes")
      .select("*")
      .eq("comment_id", commentId)
      .eq("user_id", profile.id)
      .single()

    if (existingLike) {
      // Remove like
      const { error } = await supabase
        .from("comment_likes")
        .delete()
        .eq("comment_id", commentId)
        .eq("user_id", profile.id)

      if (error) {
        return { success: false, error: "Failed to remove like" }
      }

      revalidatePath("/community")
      return { success: true, action: "removed" }
    } else {
      // Add like
      const { error } = await supabase.from("comment_likes").insert({
        comment_id: commentId,
        user_id: profile.id,
      })

      if (error) {
        return { success: false, error: "Failed to add like" }
      }

      revalidatePath("/community")
      return { success: true, action: "added" }
    }
  } catch (error) {
    console.error("Like comment error:", error)
    return { success: false, error: "Internal server error" }
  }
}

export async function fetchCommentsForPost(postId: number) {
  try {
    const supabase = await createClient()

    const { data: comments, error } = await supabase
      .from("post_comments")
      .select(`
        *,
        users!inner (
          id,
          username,
          full_name,
          avatar_url,
          tier
        )
      `)
      .eq("post_id", postId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Error fetching comments:", error)
      return { success: false, error: "Failed to fetch comments" }
    }

    return { success: true, data: comments || [] }
  } catch (error) {
    console.error("Fetch comments error:", error)
    return { success: false, error: "Internal server error" }
  }
}

export async function createReportAction(postId: number, reason: string, description?: string) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      redirect("/login")
    }

    const { data: profile } = await supabase.from("users").select("id").eq("auth_user_id", user.id).single()

    if (!profile) {
      return { success: false, error: "User profile not found" }
    }

    const { data: report, error } = await supabase
      .from("post_reports")
      .insert({
        post_id: postId,
        reporter_id: profile.id,
        reason,
        description: description || null,
        status: "pending",
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating report:", error)
      return { success: false, error: "Failed to create report" }
    }

    return { success: true, data: report }
  } catch (error) {
    console.error("Report action error:", error)
    return { success: false, error: "Internal server error" }
  }
}

export async function searchUsersForMention(query: string) {
  try {
    const supabase = await createClient()

    if (!query?.trim()) {
      return { success: true, data: [] }
    }

    const { data: users, error } = await supabase
      .from("users")
      .select("id, username, full_name, avatar_url")
      .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
      .limit(10)

    if (error) {
      console.error("Error searching users:", error)
      return { success: false, error: "Failed to search users" }
    }

    return { success: true, data: users || [] }
  } catch (error) {
    console.error("Search users error:", error)
    return { success: false, error: "Internal server error" }
  }
}

// Legacy aliases for backward compatibility
export const createPost = createCommunityPostAction
export const voteOnPost = voteOnPostAction
export const bookmarkPost = bookmarkPostAction

export async function fetchCommunityPosts(
  loggedInAuthUserId?: string | null, // Supabase Auth UID
  options: {
    categoryFilter?: number
    sortOrder?: "newest" | "oldest" | "top"
    page?: number
    limit?: number
    searchQuery?: string
  } = {},
) {
  try {
    const { categoryFilter, sortOrder = "newest", page = 1, limit = 10, searchQuery } = options
    const supabase = await createClient()
    const offset = (page - 1) * limit

    let loggedInUserInternalId: number | undefined
    if (loggedInAuthUserId) {
      const { data: userData } = await supabase
        .from("users")
        .select("id")
        .eq("auth_user_id", loggedInAuthUserId)
        .single()
      loggedInUserInternalId = userData?.id
    }

    let query = supabase
      .from("community_posts")
      .select(
        `
          id, content, created_at, vote_count, comment_count, view_count, media_url, media_type, media_metadata,
          users!inner (
            id,
            username,
            full_name,
            avatar_url,
            tier
          ),
          community_categories!inner (
            name,
            slug,
            color
          ),
          post_votes!inner (
            user_id
          )
        `,
      )
      .eq("is_published", true)
      .eq("is_deleted", false)

    if (categoryFilter) query = query.eq("category_id", categoryFilter)
    if (searchQuery) query = query.ilike("content", `%${searchQuery}%`) // Ensure 'content' is indexed for performance

    switch (sortOrder) {
      case "newest":
        query = query.order("created_at", { ascending: false })
        break
      case "oldest":
        query = query.order("created_at", { ascending: true })
        break
      case "top":
        query = query.order("vote_count", { ascending: false }).order("created_at", { ascending: false })
        break
    }

    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query.returns<CommunityPost[]>() // Specify return type

    if (error) {
      console.error("Error fetching posts:", error)
      return { posts: [], totalCount: 0, error: error.message }
    }

    const postsWithVoteStatus = (data || []).map((post: any) => ({
      ...post,
      user: post.users || { username: "Unknown", avatar_url: null, tier: "grassroot", auth_user_id: "unknown" }, // Add auth_user_id to fallback
      category: post.community_categories || { name: "General", slug: "general", color: "#000000" },
      has_voted: loggedInUserInternalId
        ? post.post_votes.some((vote: any) => vote.user_id === loggedInUserInternalId)
        : false,
    }))

    // For total count, we need a separate query without range, or use PostgREST count header if available and configured
    // This is a simplified count for the current page, not total. For true pagination, a total count is needed.
    // const { count: totalCount } = await supabase.from("community_posts").select('*', { count: 'exact', head: true }) ... apply filters ...

    return { posts: postsWithVoteStatus, totalCount: count ?? data?.length ?? 0, error: null }
  } catch (error) {
    console.error("Fetch posts error:", error)
    return { posts: [], totalCount: 0, error: error.message || "Failed to fetch posts" }
  }
}
