"use server"

export async function createPost(formData: FormData) {
  const { createCommunityPostAction } = await import("./community-actions-final-fix")
  return createCommunityPostAction(formData)
}

export async function voteOnPost(postId: number, postCreatorAuthId?: string) {
  const { voteOnPostAction } = await import("./community-actions-final-fix")
  return voteOnPostAction(postId, postCreatorAuthId || "")
}

export async function bookmarkPost(postId: number) {
  const { bookmarkPost } = await import("./community-actions-final-fix")
  return bookmarkPost(postId)
}

export async function createCommunityPostAction(formData: FormData) {
  const { createCommunityPostAction } = await import("./community-actions-final-fix")
  return createCommunityPostAction(formData)
}

export async function voteOnPostAction(postId: number, postCreatorAuthId?: string) {
  const { voteOnPostAction } = await import("./community-actions-final-fix")
  return voteOnPostAction(postId, postCreatorAuthId || "")
}

export async function fetchCommunityPosts(
  loggedInUserId?: string,
  options?: { categoryFilter?: number; sortOrder?: string; page?: number; limit?: number; searchQuery?: string },
) {
  const { fetchCommunityPosts } = await import("./community-actions-final-fix")
  return fetchCommunityPosts(loggedInUserId, options)
}

export async function editPostAction(postId: number, formData: FormData) {
  try {
    const { createServerSupabaseClient } = await import("@/lib/supabase/server")
    const { getOrCreateUserProfile } = await import("@/lib/auth-sync")

    const supabase = await createServerSupabaseClient()
    const userProfile = await getOrCreateUserProfile()

    const content = formData.get("content") as string

    if (!content?.trim()) {
      return { success: false, error: "Content is required" }
    }

    const { data, error } = await supabase
      .from("community_posts")
      .update({
        content: content.trim(),
        is_edited: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", postId)
      .eq("user_id", userProfile.id)
      .select()
      .single()

    if (error) {
      console.error("Edit post error:", error)
      return { success: false, error: error.message }
    }

    const { revalidatePath } = await import("next/cache")
    revalidatePath("/community")

    return { success: true, post: data }
  } catch (error: any) {
    console.error("Edit post action error:", error)
    return { success: false, error: error.message || "Failed to edit post" }
  }
}

export async function deletePostAction(postId: number) {
  try {
    const { createServerSupabaseClient } = await import("@/lib/supabase/server")
    const { getOrCreateUserProfile } = await import("@/lib/auth-sync")

    const supabase = await createServerSupabaseClient()
    const userProfile = await getOrCreateUserProfile()

    const { error } = await supabase
      .from("community_posts")
      .update({ is_deleted: true })
      .eq("id", postId)
      .eq("user_id", userProfile.id)

    if (error) {
      console.error("Delete post error:", error)
      return { success: false, error: error.message }
    }

    const { revalidatePath } = await import("next/cache")
    revalidatePath("/community")

    return { success: true }
  } catch (error: any) {
    console.error("Delete post action error:", error)
    return { success: false, error: error.message || "Failed to delete post" }
  }
}

export async function createCommentAction(postId: number, content: string, parentCommentId?: number) {
  try {
    const { createServerSupabaseClient } = await import("@/lib/supabase/server")
    const { getOrCreateUserProfile } = await import("@/lib/auth-sync")

    const supabase = await createServerSupabaseClient()
    const userProfile = await getOrCreateUserProfile()

    if (!content?.trim()) {
      return { success: false, error: "Comment content is required" }
    }

    const { data: comment, error } = await supabase
      .from("community_comments")
      .insert({
        post_id: postId,
        user_id: userProfile.id,
        parent_comment_id: parentCommentId,
        content: content.trim(),
      })
      .select(`
        *,
        user:users!community_comments_user_id_fkey(id, username, full_name, avatar_url, tier)
      `)
      .single()

    if (error) {
      console.error("Create comment error:", error)
      return { success: false, error: error.message }
    }

    // Update post comment count
    await supabase
      .from("community_posts")
      .update({ comment_count: supabase.raw("COALESCE(comment_count, 0) + 1") })
      .eq("id", postId)

    const { revalidatePath } = await import("next/cache")
    revalidatePath("/community")

    return { success: true, comment }
  } catch (error: any) {
    console.error("Create comment action error:", error)
    return { success: false, error: error.message || "Failed to create comment" }
  }
}

export async function fetchCommentsForPost(postId: number) {
  try {
    const { createServerSupabaseClient } = await import("@/lib/supabase/server")
    const supabase = await createServerSupabaseClient()

    const { data: comments, error } = await supabase
      .from("community_comments")
      .select(`
        *,
        user:users!community_comments_user_id_fkey(id, username, full_name, avatar_url, tier)
      `)
      .eq("post_id", postId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Fetch comments error:", error)
      return { success: false, error: error.message }
    }

    return { success: true, comments: comments || [] }
  } catch (error: any) {
    console.error("Fetch comments action error:", error)
    return { success: false, error: error.message || "Failed to fetch comments" }
  }
}

export async function searchUsersForMention(query: string) {
  try {
    const { createServerSupabaseClient } = await import("@/lib/supabase/server")
    const supabase = await createServerSupabaseClient()

    if (!query?.trim() || query.length < 2) {
      return { success: true, users: [] }
    }

    const { data: users, error } = await supabase
      .from("users")
      .select("id, username, full_name, avatar_url")
      .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
      .limit(10)

    if (error) {
      console.error("Search users error:", error)
      return { success: false, error: error.message }
    }

    return { success: true, users: users || [] }
  } catch (error: any) {
    console.error("Search users action error:", error)
    return { success: false, error: error.message || "Failed to search users" }
  }
}
