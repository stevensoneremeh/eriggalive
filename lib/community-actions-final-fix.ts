"use server"

import DOMPurify from "isomorphic-dompurify"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getOrCreateUserProfile } from "@/lib/auth-sync"

const VOTE_COIN_AMOUNT = 100

async function revalidateCommunityPath() {
  const { revalidatePath } = await import("next/cache")
  revalidatePath("/community")
}

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

export async function voteOnPostAction(postId: number, postCreatorAuthId: string) {
  try {
    const supabase = await createServerSupabaseClient()
    const voterProfile = await getOrCreateUserProfile()

    const { data: postData } = await supabase.from("community_posts").select("user_id").eq("id", postId).single()

    if (postData && postData.user_id === voterProfile.id) {
      return { success: false, error: "You cannot vote on your own post." }
    }

    if (voterProfile.coins < VOTE_COIN_AMOUNT) {
      return { success: false, error: "Not enough Erigga Coins to vote." }
    }

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

export async function fetchCommunityPosts(
  loggedInAuthId?: string,
  opts: { categoryFilter?: number; sortOrder?: string; page?: number; limit?: number; searchQuery?: string } = {},
) {
  try {
    const { categoryFilter, sortOrder = "newest", page = 1, limit = 10, searchQuery } = opts
    const supabase = await createServerSupabaseClient()
    const offset = (page - 1) * limit

    let loggedInUserInternalId: number | undefined
    if (loggedInAuthId) {
      const { data: userData } = await supabase.from("users").select("id").eq("auth_user_id", loggedInAuthId).single()
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

    if (sortOrder === "newest") query = query.order("created_at", { ascending: false })
    else if (sortOrder === "oldest") query = query.order("created_at", { ascending: true })
    else if (sortOrder === "top")
      query = query.order("vote_count", { ascending: false }).order("created_at", { ascending: false })

    const { data, error, count } = await query.range(offset, offset + limit - 1)

    if (error) {
      console.error("Fetch posts error:", error)
      return { posts: [], totalCount: 0, error: error.message }
    }

    const postsWithVoteStatus = (data || []).map((post: any) => ({
      ...post,
      has_voted: loggedInUserInternalId
        ? post.votes.some((vote: any) => vote.user_id === loggedInUserInternalId)
        : false,
    }))

    return { posts: postsWithVoteStatus, totalCount: count ?? data?.length ?? 0, error: null }
  } catch (err: any) {
    console.error("Fetch posts exception:", err)
    return { posts: [], totalCount: 0, error: err.message || "Failed to fetch posts" }
  }
}

export async function createPost(formData: FormData) {
  return createCommunityPostAction(formData)
}

export async function voteOnPost(postId: number, postCreatorAuthId: string) {
  return voteOnPostAction(postId, postCreatorAuthId)
}
