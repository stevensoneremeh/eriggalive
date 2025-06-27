"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import type { PostgrestError } from "@supabase/supabase-js"

export interface FormState {
  success: boolean
  message: string
  errors?: Record<string, string[] | undefined>
}

// --- CREATE POST ---
export async function createPostAction(prevState: FormState, formData: FormData): Promise<FormState> {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, message: "Authentication error: User not found." }
  }

  const content = formData.get("content") as string
  const category = formData.get("category") as string

  if (!content || content.trim().length === 0) {
    return {
      success: false,
      message: "Validation error: Content cannot be empty.",
      errors: { content: ["Content is required."] },
    }
  }

  const { error } = await supabase.from("community_posts").insert({
    user_id: user.id,
    content: content,
    category_id: category || null,
  })

  if (error) {
    console.error("Error creating post:", error)
    return { success: false, message: `Database error: ${error.message}` }
  }

  revalidatePath("/community")
  return { success: true, message: "Post created successfully!" }
}

// --- VOTE ON POST ---
export async function voteOnPostAction(
  postId: string,
  voteType: "up" | "down",
): Promise<{ success: boolean; message: string; error?: PostgrestError | null }> {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, message: "You must be logged in to vote." }

  const { error } = await supabase.rpc("handle_vote", {
    p_post_id: postId,
    p_user_id: user.id,
    p_vote_type: voteType,
  })

  if (error) {
    console.error("Error handling vote:", error)
    return { success: false, message: error.message, error }
  }

  revalidatePath("/community")
  revalidatePath(`/post/${postId}`)
  return { success: true, message: "Vote recorded." }
}

// --- BOOKMARK POST ---
export async function bookmarkPostAction(postId: string): Promise<{ success: boolean; message: string }> {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, message: "You must be logged in to bookmark." }
  }

  // Check if bookmark exists
  const { data: existingBookmark, error: fetchError } = await supabase
    .from("community_bookmarks")
    .select("id")
    .eq("user_id", user.id)
    .eq("post_id", postId)
    .maybeSingle()

  if (fetchError) {
    console.error("Error checking bookmark:", fetchError)
    return { success: false, message: "Database error." }
  }

  if (existingBookmark) {
    // Delete bookmark
    const { error: deleteError } = await supabase
      .from("community_bookmarks")
      .delete()
      .match({ user_id: user.id, post_id: postId })
    if (deleteError) {
      return { success: false, message: "Failed to remove bookmark." }
    }
    revalidatePath("/community")
    return { success: true, message: "Bookmark removed." }
  } else {
    // Create bookmark
    const { error: insertError } = await supabase
      .from("community_bookmarks")
      .insert({ user_id: user.id, post_id: postId })
    if (insertError) {
      return { success: false, message: "Failed to add bookmark." }
    }
    revalidatePath("/community")
    return { success: true, message: "Post bookmarked." }
  }
}

// --- ADD COMMENT ---
export async function addCommentAction(prevState: FormState, formData: FormData): Promise<FormState> {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, message: "You must be logged in to comment." }

  const content = formData.get("content") as string
  const postId = formData.get("postId") as string

  if (!content || content.trim().length === 0) {
    return { success: false, message: "Comment cannot be empty." }
  }
  if (!postId) {
    return { success: false, message: "Post ID is missing." }
  }

  const { error } = await supabase.from("community_comments").insert({
    post_id: postId,
    user_id: user.id,
    content: content,
  })

  if (error) {
    return { success: false, message: `Failed to add comment: ${error.message}` }
  }

  revalidatePath(`/post/${postId}`)
  revalidatePath("/community")
  return { success: true, message: "Comment added." }
}
