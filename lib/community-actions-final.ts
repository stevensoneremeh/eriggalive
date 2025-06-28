"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

/**
 * Compatibility shim
 * -------------------
 * Older code still imports server actions from:
 *   "@/lib/community-actions-final"
 *
 * We migrated the real implementations to
 *   "@/lib/community-actions"
 *
 * To avoid changing all existing import statements, this
 * file simply re-exports the async functions from the new
 * module.  Because it starts with `"use server"`, everything
 * here is treated as server-only, so importing `revalidatePath`
 * (used inside the delegated functions) is perfectly valid.
 */

export async function createCommunityPostAction(formData: FormData) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: "Authentication required" }
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("id")
      .eq("auth_user_id", user.id)
      .single()

    if (profileError || !profile) {
      return { success: false, error: "User profile not found" }
    }

    const content = formData.get("content") as string
    const categoryId = Number.parseInt(formData.get("categoryId") as string)
    const mediaUrl = formData.get("mediaUrl") as string
    const mediaType = formData.get("mediaType") as string

    if (!content || !categoryId) {
      return { success: false, error: "Content and category are required" }
    }

    const { data: post, error } = await supabase
      .from("community_posts")
      .insert({
        user_id: profile.id,
        category_id: categoryId,
        content,
        media_url: mediaUrl || null,
        media_type: (mediaType as "image" | "audio" | "video") || null,
        is_published: true,
      })
      .select()
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

export async function editPostAction(postId: number, content: string) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: "Authentication required" }
    }

    const { data: profile } = await supabase.from("user_profiles").select("id").eq("auth_user_id", user.id).single()

    if (!profile) {
      return { success: false, error: "User profile not found" }
    }

    const { data: post, error } = await supabase
      .from("community_posts")
      .update({
        content,
        is_edited: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", postId)
      .eq("user_id", profile.id)
      .select()
      .single()

    if (error) {
      console.error("Error editing post:", error)
      return { success: false, error: "Failed to edit post" }
    }

    revalidatePath("/community")
    return { success: true, data: post }
  } catch (error) {
    console.error("Server action error:", error)
    return { success: false, error: "Internal server error" }
  }
}

export async function deletePostAction(postId: number) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: "Authentication required" }
    }

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("id, role")
      .eq("auth_user_id", user.id)
      .single()

    if (!profile) {
      return { success: false, error: "User profile not found" }
    }

    // Check if user owns the post or is admin/moderator
    const { data: post } = await supabase.from("community_posts").select("user_id").eq("id", postId).single()

    if (!post) {
      return { success: false, error: "Post not found" }
    }

    const canDelete = post.user_id === profile.id || ["admin", "super_admin", "moderator"].includes(profile.role)

    if (!canDelete) {
      return { success: false, error: "Permission denied" }
    }

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
  } catch (error) {
    console.error("Server action error:", error)
    return { success: false, error: "Internal server error" }
  }
}

export async function handle_post_vote(postId: number) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: "Authentication required" }
    }

    const { data: profile } = await supabase.from("user_profiles").select("id").eq("auth_user_id", user.id).single()

    if (!profile) {
      return { success: false, error: "User profile not found" }
    }

    // Check if user has already voted
    const { data: existingVote } = await supabase
      .from("community_post_votes")
      .select("*")
      .eq("post_id", postId)
      .eq("user_id", profile.id)
      .single()

    if (existingVote) {
      // Remove vote
      const { error: deleteError } = await supabase
        .from("community_post_votes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", profile.id)

      if (deleteError) {
        return { success: false, error: "Failed to remove vote" }
      }

      // Update vote count
      const { error: updateError } = await supabase.rpc("decrement_post_votes", { post_id: postId })

      if (updateError) {
        console.error("Error updating vote count:", updateError)
      }

      revalidatePath("/community")
      return { success: true, action: "removed" }
    } else {
      // Add vote
      const { error: insertError } = await supabase.from("community_post_votes").insert({
        post_id: postId,
        user_id: profile.id,
      })

      if (insertError) {
        return { success: false, error: "Failed to add vote" }
      }

      // Update vote count
      const { error: updateError } = await supabase.rpc("increment_post_votes", { post_id: postId })

      if (updateError) {
        console.error("Error updating vote count:", updateError)
      }

      revalidatePath("/community")
      return { success: true, action: "added" }
    }
  } catch (error) {
    console.error("Server action error:", error)
    return { success: false, error: "Internal server error" }
  }
}

export async function addComment(postId: number, content: string, parentCommentId?: number) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: "Authentication required" }
    }

    const { data: profile } = await supabase.from("user_profiles").select("id").eq("auth_user_id", user.id).single()

    if (!profile) {
      return { success: false, error: "User profile not found" }
    }

    const { data: comment, error } = await supabase
      .from("community_comments")
      .insert({
        post_id: postId,
        user_id: profile.id,
        parent_comment_id: parentCommentId || null,
        content,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating comment:", error)
      return { success: false, error: "Failed to create comment" }
    }

    // Update comment count on post
    const { error: updateError } = await supabase.rpc("increment_post_comments", { post_id: postId })

    if (updateError) {
      console.error("Error updating comment count:", updateError)
    }

    revalidatePath("/community")
    return { success: true, data: comment }
  } catch (error) {
    console.error("Server action error:", error)
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
      return { success: false, error: "Authentication required" }
    }

    const { data: profile } = await supabase.from("user_profiles").select("id").eq("auth_user_id", user.id).single()

    if (!profile) {
      return { success: false, error: "User profile not found" }
    }

    // Check if user has already liked
    const { data: existingLike } = await supabase
      .from("community_comment_likes")
      .select("*")
      .eq("comment_id", commentId)
      .eq("user_id", profile.id)
      .single()

    if (existingLike) {
      // Remove like
      const { error: deleteError } = await supabase
        .from("community_comment_likes")
        .delete()
        .eq("comment_id", commentId)
        .eq("user_id", profile.id)

      if (deleteError) {
        return { success: false, error: "Failed to remove like" }
      }

      // Update like count
      const { error: updateError } = await supabase.rpc("decrement_comment_likes", { comment_id: commentId })

      if (updateError) {
        console.error("Error updating like count:", updateError)
      }

      revalidatePath("/community")
      return { success: true, action: "removed" }
    } else {
      // Add like
      const { error: insertError } = await supabase.from("community_comment_likes").insert({
        comment_id: commentId,
        user_id: profile.id,
      })

      if (insertError) {
        return { success: false, error: "Failed to add like" }
      }

      // Update like count
      const { error: updateError } = await supabase.rpc("increment_comment_likes", { comment_id: commentId })

      if (updateError) {
        console.error("Error updating like count:", updateError)
      }

      revalidatePath("/community")
      return { success: true, action: "added" }
    }
  } catch (error) {
    console.error("Server action error:", error)
    return { success: false, error: "Internal server error" }
  }
}

export async function fetchCommentsForPost(postId: number) {
  try {
    const supabase = await createClient()

    const { data: comments, error } = await supabase
      .from("community_comments")
      .select(
        `
        *,
        user:user_profiles!community_comments_user_id_fkey(
          id,
          username,
          full_name,
          avatar_url,
          tier
        )
      `,
      )
      .eq("post_id", postId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Error fetching comments:", error)
      return { success: false, error: "Failed to fetch comments" }
    }

    return { success: true, data: comments }
  } catch (error) {
    console.error("Server action error:", error)
    return { success: false, error: "Internal server error" }
  }
}

export async function searchUsersForMention(query: string) {
  try {
    const supabase = await createClient()

    const { data: users, error } = await supabase
      .from("user_profiles")
      .select("id, username, full_name, avatar_url")
      .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
      .eq("is_active", true)
      .limit(10)

    if (error) {
      console.error("Error searching users:", error)
      return { success: false, error: "Failed to search users" }
    }

    return { success: true, data: users }
  } catch (error) {
    console.error("Server action error:", error)
    return { success: false, error: "Internal server error" }
  }
}
