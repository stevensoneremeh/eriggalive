"use server"

import DOMPurify from "isomorphic-dompurify"
import { getOrCreateUserProfile } from "@/lib/auth-sync"
import { createServerSupabaseClient } from "@/lib/supabase/server"

// -- internal helpers (NOT exported) -------------------------------------------------
const VOTE_COIN_AMOUNT = 100

/** Dynamically import `revalidatePath` at runtime to avoid bundling it on the client. */
async function revalidate(path: string) {
  const { revalidatePath } = await import("next/cache")
  revalidatePath(path)
}

// -- Post Actions --------------------------------------------------------------------

/**
 * Create a new community post (text and/or media).
 */
export async function createCommunityPostAction(formData: FormData) {
  try {
    const supabase = createServerSupabaseClient()
    const userProfile = await getOrCreateUserProfile()

    const rawContent = formData.get("content") as string | null
    const categoryId = formData.get("categoryId") as string | null
    const mediaFile = formData.get("mediaFile") as File | null

    if (!rawContent?.trim() && !mediaFile) {
      return { success: false, error: "Please provide content or upload media." }
    }
    if (!categoryId) {
      return { success: false, error: "Please select a category." }
    }

    const sanitizedContent = rawContent ? DOMPurify.sanitize(rawContent) : ""

    // Optional media upload ---------------------------------------------------------
    let media_url: string | undefined
    let media_type: string | undefined
    let media_metadata: Record<string, any> | undefined

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

    // Insert post -------------------------------------------------------------------
    const postData = {
      user_id: userProfile.id,
      category_id: Number(categoryId),
      content: sanitizedContent,
      media_url,
      media_type,
      media_metadata,
      is_published: true,
      is_deleted: false,
      is_edited: false,
      vote_count: 0,
      comment_count: 0,
      tags: [],
      mentions: null,
    }

    const { data: newPost, error } = await supabase
      .from("community_posts")
      .insert(postData)
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

    await revalidate("/community")
    return { success: true, post: newPost }
  } catch (err: any) {
    console.error("createCommunityPostAction error:", err)
    return { success: false, error: err.message ?? "Failed to create post" }
  }
}

/**
 * Up-vote a post, transferring coins from voter → author.
 */
export async function voteOnPostAction(postId: number, postCreatorAuthId: string) {
  try {
    const supabase = createServerSupabaseClient()
    const voterProfile = await getOrCreateUserProfile()

    // Disallow voting on own post
    const { data: postData } = await supabase.from("community_posts").select("user_id").eq("id", postId).single()

    if (postData?.user_id === voterProfile.id) {
      return { success: false, error: "You cannot vote on your own post.", code: "SELF_VOTE" }
    }

    // Check balance
    if (voterProfile.coins < VOTE_COIN_AMOUNT) {
      return { success: false, error: "Not enough Erigga Coins to vote.", code: "INSUFFICIENT_FUNDS" }
    }

    const { data, error } = await supabase.rpc("handle_post_vote", {
      p_post_id: postId,
      p_voter_auth_id: voterProfile.auth_user_id,
      p_post_creator_auth_id: postCreatorAuthId,
      p_coin_amount: VOTE_COIN_AMOUNT,
    })

    if (error) {
      console.error("Vote error:", error)
      return { success: false, error: `Voting failed: ${error.message}`, code: "VOTE_FAILED" }
    }

    await revalidate("/community")
    return {
      success: true,
      voted: data,
      message: `Voted successfully! ${VOTE_COIN_AMOUNT} coins transferred.`,
    }
  } catch (err: any) {
    console.error("voteOnPostAction error:", err)
    return { success: false, error: err.message ?? "Failed to vote" }
  }
}

/**
 * Fetch a paginated list of posts with optional filters.
 */
export async function fetchCommunityPosts(
  loggedInUserId?: string,
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
    const supabase = createServerSupabaseClient()
    const offset = (page - 1) * limit

    // Map auth ID → internal user ID so we can mark voted posts
    let loggedInUserInternalId: number | undefined
    if (loggedInUserId) {
      const { data: userData } = await supabase.from("users").select("id").eq("auth_user_id", loggedInUserId).single()
      loggedInUserInternalId = userData?.id
    }

    let query = supabase
      .from("community_posts")
      .select(
        `
          *,
          user:users!community_posts_user_id_fkey(id, auth_user_id, username, full_name, avatar_url, tier),
          category:community_categories!community_posts_category_id_fkey(id, name, slug),
          votes:community_post_votes(user_id)
        `,
      )
      .eq("is_published", true)
      .eq("is_deleted", false)

    if (categoryFilter) query = query.eq("category_id", categoryFilter)
    if (searchQuery) query = query.ilike("content", `%${searchQuery}%`)

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

    const { data, error } = await query
    if (error) {
      console.error("Fetch posts error:", error)
      return { posts: [], count: 0, error: error.message }
    }

    const postsWithVoteStatus =
      data?.map((post: any) => ({
        ...post,
        has_voted: loggedInUserInternalId ? post.votes.some((v: any) => v.user_id === loggedInUserInternalId) : false,
      })) ?? []

    return { posts: postsWithVoteStatus, count: postsWithVoteStatus.length, error: null }
  } catch (err: any) {
    console.error("fetchCommunityPosts error:", err)
    return { posts: [], count: 0, error: err.message ?? "Failed to fetch posts" }
  }
}
