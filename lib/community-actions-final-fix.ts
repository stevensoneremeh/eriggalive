"use server"

import DOMPurify from "isomorphic-dompurify"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getOrCreateUserProfile } from "@/lib/auth-sync"

const VOTE_COIN_AMOUNT = 100

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

async function revalidateCommunityPath() {
  const { revalidatePath } = await import("next/cache")
  revalidatePath("/community")
}

/* -------------------------------------------------------------------------- */
/*  Primary Community Server Actions                                          */
/* -------------------------------------------------------------------------- */

/**
 * Create a new community post (with optional media upload).
 */
export async function createCommunityPostAction(formData: FormData) {
  try {
    const supabase = await createServerSupabaseClient()
    const userProfile = await getOrCreateUserProfile()

    const rawContent = (formData.get("content") as string | null) ?? ""
    const categoryId = formData.get("categoryId") as string | null
    const mediaFile = formData.get("mediaFile") as File | null

    if (!rawContent.trim() && !mediaFile) {
      return { success: false, error: "Please provide content or upload media." }
    }
    if (!categoryId) {
      return { success: false, error: "Please select a category." }
    }

    /* -------- Sanitize content & optionally upload media ------------------ */

    const sanitizedContent = DOMPurify.sanitize(rawContent)

    let media_url: string | undefined
    let media_type: string | undefined
    let media_metadata: Record<string, any> | undefined

    if (mediaFile && mediaFile.size > 0) {
      const ext = mediaFile.name.split(".").pop()
      const fileName = `${userProfile.id}-${Date.now()}.${ext}`
      const filePath = `community_media/${fileName}`

      const { error: uploadError, data: uploaded } = await supabase.storage
        .from("eriggalive-assets")
        .upload(filePath, mediaFile)

      if (uploadError) {
        console.error("Media upload error:", uploadError)
        return { success: false, error: `Media upload failed: ${uploadError.message}` }
      }

      const { data: publicData } = supabase.storage.from("eriggalive-assets").getPublicUrl(uploaded.path)

      media_url = publicData.publicUrl
      media_type = mediaFile.type.startsWith("image/")
        ? "image"
        : mediaFile.type.startsWith("audio/")
          ? "audio"
          : mediaFile.type.startsWith("video/")
            ? "video"
            : undefined

      media_metadata = {
        name: mediaFile.name,
        size: mediaFile.size,
        type: mediaFile.type,
      }
    }

    /* ---------------------------- Insert Post ----------------------------- */

    const { data: newPost, error } = await supabase
      .from("community_posts")
      .insert({
        user_id: userProfile.id,
        category_id: Number(categoryId),
        content: sanitizedContent,
        media_url,
        media_type,
        media_metadata,
        is_published: true,
        vote_count: 0,
        comment_count: 0,
      })
      .select(
        `
        *,
        user:users!community_posts_user_id_fkey(id, username, full_name, avatar_url, tier),
        category:community_categories!community_posts_category_id_fkey(id, name, slug)
      `,
      )
      .single()

    if (error) {
      console.error("Post creation error:", error)
      return { success: false, error: error.message }
    }

    await revalidateCommunityPath()
    return { success: true, post: newPost }
  } catch (err: any) {
    console.error("Create post action error:", err)
    return { success: false, error: err.message || "Failed to create post" }
  }
}

/**
 * Vote on a post (transfers `VOTE_COIN_AMOUNT` between users via RPC).
 */
export async function voteOnPostAction(postId: number, postCreatorAuthId: string) {
  try {
    const supabase = await createServerSupabaseClient()
    const voterProfile = await getOrCreateUserProfile()

    /* -- Disallow self-vote ------------------------------------------------ */
    const { data: postData } = await supabase.from("community_posts").select("user_id").eq("id", postId).single()

    if (postData && postData.user_id === voterProfile.id) {
      return { success: false, error: "You cannot vote on your own post." }
    }

    /* -- Ensure voter has enough coins ------------------------------------ */
    if (voterProfile.coins < VOTE_COIN_AMOUNT) {
      return { success: false, error: "Not enough Erigga Coins to vote." }
    }

    /* -- Call RPC ---------------------------------------------------------- */
    const { error, data } = await supabase.rpc("handle_post_vote", {
      p_post_id: postId,
      p_voter_auth_id: voterProfile.auth_user_id,
      p_post_creator_auth_id: postCreatorAuthId,
      p_coin_amount: VOTE_COIN_AMOUNT,
    })

    if (error) {
      console.error("Vote RPC error:", error)
      return { success: false, error: `Voting failed: ${error.message}` }
    }

    await revalidateCommunityPath()
    return {
      success: true,
      voted: data,
      message: `Voted successfully! ${VOTE_COIN_AMOUNT} coins transferred.`,
    }
  } catch (err: any) {
    console.error("Vote action error:", err)
    return { success: false, error: err.message || "Failed to vote" }
  }
}

/**
 * Bookmark / un-bookmark a post for the current user.
 */
export async function bookmarkPost(postId: number) {
  try {
    const supabase = await createServerSupabaseClient()
    const profile = await getOrCreateUserProfile()

    const { data: existing } = await supabase
      .from("user_bookmarks")
      .select("id")
      .eq("user_id", profile.id)
      .eq("post_id", postId)
      .single()

    if (existing) {
      await supabase.from("user_bookmarks").delete().eq("id", existing.id)
      await revalidateCommunityPath()
      return { success: true, bookmarked: false }
    }

    await supabase.from("user_bookmarks").insert({ user_id: profile.id, post_id: postId })
    await revalidateCommunityPath()
    return { success: true, bookmarked: true }
  } catch (err: any) {
    console.error("Bookmark error:", err)
    return { success: false, error: err.message || "Failed to bookmark" }
  }
}

/**
 * Fetch paginated posts (optionally filtered).
 */
export async function fetchCommunityPosts(
  loggedInAuthId?: string,
  opts: { categoryId?: number; page?: number; limit?: number } = {},
) {
  try {
    const { categoryId, page = 1, limit = 10 } = opts
    const supabase = await createServerSupabaseClient()
    const offset = (page - 1) * limit

    const query = supabase
      .from("community_posts")
      .select(
        `
        *,
        user:users!community_posts_user_id_fkey(id, username, full_name, avatar_url, tier),
        category:community_categories!community_posts_category_id_fkey(id, name, slug)
      `,
      )
      .eq("is_published", true)
      .eq("is_deleted", false)

    if (categoryId) query.eq("category_id", categoryId)

    const { data, error } = await query.range(offset, offset + limit - 1).order("created_at", { ascending: false })

    if (error) {
      console.error("Fetch posts error:", error)
      return { success: false, error: error.message }
    }

    return { success: true, posts: data }
  } catch (err: any) {
    console.error("Fetch posts exception:", err)
    return { success: false, error: err.message || "Failed to fetch posts" }
  }
}

/* -------------------------------------------------------------------------- */
/*  Legacy Aliases (createPost, voteOnPost) so existing imports keep working  */
/* -------------------------------------------------------------------------- */

export async function createPost(formData: FormData) {
  return createCommunityPostAction(formData)
}

export async function voteOnPost(postId: number, postCreatorAuthId: string) {
  return voteOnPostAction(postId, postCreatorAuthId)
}
