"use server"

import { revalidatePath } from "next/cache"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import type { CommunityPost, CommunityComment, ReportReason, ReportTargetType } from "@/types/database"
import DOMPurify from "isomorphic-dompurify" // For server-side sanitization

const VOTE_COIN_AMOUNT = 100

// Helper to get current user
async function getCurrentUser(supabase: ReturnType<typeof createServerSupabaseClient>) {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) {
    throw new Error("User not authenticated")
  }
  return user
}

// --- Post Actions ---
export async function createCommunityPostAction(formData: FormData) {
  const supabase = createServerSupabaseClient()
  const user = await getCurrentUser(supabase)

  const rawContent = formData.get("content") as string // HTML from Tiptap
  const categoryId = formData.get("categoryId") as string
  const mediaFile = formData.get("mediaFile") as File | null

  if (!rawContent || !categoryId) {
    return { success: false, error: "Content and category are required." }
  }
  // Sanitize HTML content before saving
  const sanitizedContent = DOMPurify.sanitize(rawContent)
  if (!sanitizedContent.replace(/<[^>]*>?/gm, "").trim() && !mediaFile) {
    // Check if content is empty after stripping tags
    return { success: false, error: "Post content cannot be empty without media." }
  }

  let media_url: string | undefined = undefined
  let media_type: string | undefined = undefined
  let media_metadata: Record<string, any> | undefined = undefined

  if (mediaFile && mediaFile.size > 0) {
    const fileExt = mediaFile.name.split(".").pop()
    const fileName = `${user.id}-${Date.now()}.${fileExt}`
    const filePath = `community_media/${fileName}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("eriggalive-assets")
      .upload(filePath, mediaFile)

    if (uploadError) return { success: false, error: `Media upload failed: ${uploadError.message}` }

    const { data: publicUrlData } = supabase.storage.from("eriggalive-assets").getPublicUrl(uploadData.path)
    media_url = publicUrlData.publicUrl

    if (mediaFile.type.startsWith("image/")) media_type = "image"
    else if (mediaFile.type.startsWith("audio/")) media_type = "audio"
    else if (mediaFile.type.startsWith("video/")) media_type = "video"
    media_metadata = { name: mediaFile.name, size: mediaFile.size, type: mediaFile.type }
  }

  const postData = {
    user_id: user.id,
    category_id: Number.parseInt(categoryId),
    content: sanitizedContent, // Save sanitized HTML
    media_url,
    media_type,
    media_metadata,
  }

  const { data: newPost, error } = await supabase.from("community_posts").insert(postData).select().single()

  if (error) return { success: false, error: error.message }

  revalidatePath("/community")
  // For realtime, Supabase will broadcast this insert. Client needs to listen.
  return { success: true, post: newPost }
}

export async function editPostAction(postId: number, formData: FormData) {
  const supabase = createServerSupabaseClient()
  const user = await getCurrentUser(supabase)
  const rawContent = formData.get("content") as string // HTML

  if (!rawContent) return { success: false, error: "Content cannot be empty." }
  const sanitizedContent = DOMPurify.sanitize(rawContent)
  if (!sanitizedContent.replace(/<[^>]*>?/gm, "").trim()) {
    return { success: false, error: "Post content cannot be empty." }
  }

  const { data: existingPost, error: fetchError } = await supabase
    .from("community_posts")
    .select("user_id")
    .eq("id", postId)
    .single()

  if (fetchError || !existingPost) return { success: false, error: "Post not found." }
  if (existingPost.user_id !== user.id) return { success: false, error: "Not authorized to edit this post." }

  const { data, error } = await supabase
    .from("community_posts")
    .update({ content: sanitizedContent, is_edited: true, updated_at: new Date().toISOString() })
    .eq("id", postId)
    .eq("user_id", user.id) // Ensure user owns the post
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  revalidatePath("/community")
  revalidatePath(`/community/post/${postId}`) // If there's a single post page
  return { success: true, post: data }
}

export async function deletePostAction(postId: number) {
  const supabase = createServerSupabaseClient()
  const user = await getCurrentUser(supabase)

  const { error } = await supabase
    .from("community_posts")
    .update({ is_deleted: true, deleted_at: new Date().toISOString() })
    .eq("id", postId)
    .eq("user_id", user.id) // Ensure user owns the post

  if (error) return { success: false, error: error.message }

  revalidatePath("/community")
  return { success: true }
}

export async function voteOnPostAction(postId: number, postCreatorId: string) {
  // ... (previous implementation is fine, ensure it revalidates paths)
  const supabase = createServerSupabaseClient()
  const voter = await getCurrentUser(supabase)

  if (voter.id === postCreatorId) {
    return { success: false, error: "You cannot vote on your own post.", code: "SELF_VOTE" }
  }

  const { data, error } = await supabase.rpc("handle_post_vote", {
    p_post_id: postId,
    p_voter_id: voter.id,
    p_post_creator_id: postCreatorId,
    p_coin_amount: VOTE_COIN_AMOUNT,
  })

  if (error) {
    if (error.message.includes("Insufficient coins"))
      return { success: false, error: "Not enough Erigga Coins to vote.", code: "INSUFFICIENT_FUNDS" }
    if (error.message.includes("User has already voted"))
      return { success: false, error: "You have already voted on this post.", code: "ALREADY_VOTED" }
    return { success: false, error: `Voting failed: ${error.message}`, code: "VOTE_FAILED" }
  }
  if (data === false) return { success: false, error: "Voting process failed.", code: "VOTE_PROCESS_FAILED" }

  revalidatePath("/community")
  // Realtime will update vote_count on client if subscribed
  return { success: true, message: `Voted successfully! ${VOTE_COIN_AMOUNT} coins transferred.` }
}

// --- Comment Actions ---
export async function createCommentAction(postId: number, content: string, parentCommentId?: number | null) {
  const supabase = createServerSupabaseClient()
  const user = await getCurrentUser(supabase)

  if (!content.trim()) return { success: false, error: "Comment cannot be empty." }
  // Sanitize if comments also use rich text, otherwise not strictly needed for plain text
  const sanitizedContent = DOMPurify.sanitize(content) // Assuming comments can be rich text too
  if (!sanitizedContent.replace(/<[^>]*>?/gm, "").trim()) {
    return { success: false, error: "Comment content cannot be empty." }
  }

  const { data: newComment, error } = await supabase
    .from("community_comments")
    .insert({
      post_id: postId,
      user_id: user.id,
      content: sanitizedContent,
      parent_comment_id: parentCommentId || null,
    })
    .select(`*, user:users!community_comments_user_id_fkey(id, username, full_name, avatar_url, tier)`)
    .single()

  if (error) return { success: false, error: error.message }

  revalidatePath("/community") // Or specific post page
  revalidatePath(`/community/post/${postId}`)
  // Realtime will broadcast this insert.
  return { success: true, comment: newComment }
}

export async function editCommentAction(commentId: number, content: string) {
  const supabase = createServerSupabaseClient()
  const user = await getCurrentUser(supabase)
  if (!content.trim()) return { success: false, error: "Comment cannot be empty." }
  const sanitizedContent = DOMPurify.sanitize(content)
  if (!sanitizedContent.replace(/<[^>]*>?/gm, "").trim()) {
    return { success: false, error: "Comment content cannot be empty." }
  }

  const { data, error } = await supabase
    .from("community_comments")
    .update({ content: sanitizedContent, is_edited: true, updated_at: new Date().toISOString() })
    .eq("id", commentId)
    .eq("user_id", user.id)
    .select(`*, user:users!community_comments_user_id_fkey(id, username, full_name, avatar_url, tier)`)
    .single()

  if (error) return { success: false, error: error.message }

  revalidatePath("/community") // Or specific post page
  return { success: true, comment: data }
}

export async function deleteCommentAction(commentId: number) {
  const supabase = createServerSupabaseClient()
  const user = await getCurrentUser(supabase)

  const { error } = await supabase
    .from("community_comments")
    .update({ is_deleted: true, deleted_at: new Date().toISOString(), content: "[deleted]" }) // Soft delete
    .eq("id", commentId)
    .eq("user_id", user.id)

  if (error) return { success: false, error: error.message }

  revalidatePath("/community") // Or specific post page
  return { success: true }
}

export async function toggleLikeCommentAction(commentId: number) {
  const supabase = createServerSupabaseClient()
  const user = await getCurrentUser(supabase)

  const { data: existingLike, error: fetchError } = await supabase
    .from("community_comment_likes")
    .select("comment_id")
    .eq("comment_id", commentId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (fetchError && fetchError.code !== "PGRST116") {
    // PGRST116 is "Fetched result contains 0 rows"
    return { success: false, error: fetchError.message, liked: false }
  }

  if (existingLike) {
    // Unlike
    const { error: deleteError } = await supabase
      .from("community_comment_likes")
      .delete()
      .eq("comment_id", commentId)
      .eq("user_id", user.id)
    if (deleteError) return { success: false, error: deleteError.message, liked: true }
    revalidatePath("/community")
    return { success: true, liked: false }
  } else {
    // Like
    const { error: insertError } = await supabase
      .from("community_comment_likes")
      .insert({ comment_id: commentId, user_id: user.id })
    if (insertError) return { success: false, error: insertError.message, liked: false }
    revalidatePath("/community")
    return { success: true, liked: true }
  }
}

// --- Report Action ---
export async function createReportAction(
  targetId: number,
  targetType: ReportTargetType,
  reason: ReportReason,
  notes?: string,
) {
  const supabase = createServerSupabaseClient()
  const user = await getCurrentUser(supabase)

  const { error } = await supabase.from("community_reports").insert({
    reporter_user_id: user.id,
    target_id: targetId,
    target_type: targetType,
    reason: reason,
    additional_notes: notes,
  })

  if (error) return { success: false, error: error.message }
  return { success: true, message: "Report submitted successfully." }
}

// --- Fetching Actions (with search) ---
export async function fetchCommunityPosts(
  userId: string | undefined, // Current logged-in user for 'has_voted'
  options: {
    categoryId?: number
    sortOrder?: string
    page?: number
    limit?: number
    searchQuery?: string
  },
) {
  const { categoryId, sortOrder = "newest", page = 1, limit = 10, searchQuery } = options
  const supabase = createServerSupabaseClient()
  const offset = (page - 1) * limit

  let query = supabase
    .from("community_posts")
    .select(`
      *,
      user:users!community_posts_user_id_fkey (id, username, full_name, avatar_url, tier),
      category:community_categories (id, name, slug),
      votes:community_post_votes (user_id)
    `)
    .eq("is_published", true)
    .eq("is_deleted", false)

  if (categoryId) query = query.eq("category_id", categoryId)

  if (searchQuery) {
    // Basic search on content. For better search, use pg_trgm or dedicated search.
    // Or use .textSearch('content_fts', searchQuery) if you have a tsvector column 'content_fts'
    query = query.ilike("content", `%${searchQuery}%`)
  }

  if (sortOrder === "newest") query = query.order("created_at", { ascending: false })
  else if (sortOrder === "oldest") query = query.order("created_at", { ascending: true })
  else if (sortOrder === "top")
    query = query.order("vote_count", { ascending: false }).order("created_at", { ascending: false })

  query = query.range(offset, offset + limit - 1)

  const { data, error, count } =
    await query.returns<Array<CommunityPost & { user: any; category: any; votes: Array<{ user_id: string }> }>>()

  if (error) {
    console.error("Error fetching posts:", error)
    return { posts: [], count: 0, error: error.message }
  }

  const postsWithVoteStatus = data.map((post) => ({
    ...post,
    user: post.user,
    category: post.category,
    has_voted: userId ? post.votes.some((vote) => vote.user_id === userId) : false,
  }))

  return { posts: postsWithVoteStatus, count: count || data.length, error: null } // count might be null if not exact
}

export async function fetchCommentsForPost(postId: number, userId?: string) {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from("community_comments")
    .select(`
      *,
      user:users!community_comments_user_id_fkey(id, username, full_name, avatar_url, tier),
      likes:community_comment_likes(user_id)
    `)
    .eq("post_id", postId)
    .eq("is_deleted", false)
    .is("parent_comment_id", null) // Fetch top-level comments
    .order("created_at", { ascending: true })

  if (error) {
    console.error("Error fetching comments:", error)
    return []
  }

  // Fetch replies for each top-level comment (can lead to N+1, consider optimizing for deep nesting)
  const commentsWithReplies = await Promise.all(
    data.map(async (comment) => {
      const { data: repliesData, error: repliesError } = await supabase
        .from("community_comments")
        .select(`
          *,
          user:users!community_comments_user_id_fkey(id, username, full_name, avatar_url, tier),
          likes:community_comment_likes(user_id)
        `)
        .eq("post_id", postId) // ensure replies are for the same post
        .eq("parent_comment_id", comment.id)
        .eq("is_deleted", false)
        .order("created_at", { ascending: true })

      return {
        ...comment,
        user: comment.user,
        has_liked: userId ? comment.likes.some((like) => like.user_id === userId) : false,
        replies: repliesError
          ? []
          : repliesData.map((r) => ({
              ...r,
              user: r.user,
              has_liked: userId ? r.likes.some((like) => like.user_id === userId) : false,
            })),
      }
    }),
  )
  return commentsWithReplies as CommunityComment[]
}

// searchUsersForMention (from previous, if needed for Tiptap @mention extension)
export async function searchUsersForMention(query: string) {
  // ... (implementation from previous turn)
  if (!query || query.length < 2) return []
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from("users")
    .select("id, username, full_name, avatar_url") // Ensure 'id' here is the one Tiptap expects (e.g., username or UUID)
    .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
    .limit(5)

  if (error) {
    console.error("Error searching users:", error)
    return []
  }
  // Format for Tiptap mention extension if using one that requires specific format
  return data.map((u) => ({ id: u.username, label: u.username, name: u.full_name, avatar: u.avatar_url }))
}
