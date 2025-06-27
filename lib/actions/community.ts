"use server"

/**
 * Centralised community-related server actions.
 * These helpers talk to Supabase directly and are **server-only**.
 */
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

/* ────────────────────────────────────────────────────────── */
/* Types                                                     */
export interface CreatePostArgs {
  communityId: string
  title: string
  content: string
  authorId: string
  path?: string // used by the proxy for revalidatePath
}

export interface VoteArgs {
  postId: string | number
  voterId: string
  type: "upvote" | "downvote"
}

export interface BookmarkArgs {
  postId: string | number
  userId: string
}

export interface AddCommentArgs {
  postId: string | number
  authorId: string
  text: string
}

/* ────────────────────────────────────────────────────────── */
/* Action Implementations                                    */
export async function createPost({ communityId, title, content, authorId }: CreatePostArgs) {
  const { data, error } = await supabase
    .from("community_posts")
    .insert({
      community_id: communityId,
      title,
      content,
      author_id: authorId,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function voteOnPost({ postId, voterId, type }: VoteArgs) {
  const { data, error } = await supabase.rpc("vote_on_post", {
    p_post_id: postId,
    p_voter_id: voterId,
    p_vote_type: type,
  })
  if (error) throw new Error(error.message)
  return data
}

export async function bookmarkPost({ postId, userId }: BookmarkArgs) {
  const { data, error } = await supabase
    .from("post_bookmarks")
    .upsert({ post_id: postId, user_id: userId }, { onConflict: "post_id,user_id" })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function addComment({ postId, authorId, text }: AddCommentArgs) {
  const { data, error } = await supabase
    .from("post_comments")
    .insert({
      post_id: postId,
      author_id: authorId,
      content: text,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}
