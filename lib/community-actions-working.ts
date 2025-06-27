"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import {
  createCommunityPostAction as _createPost,
  voteOnPostAction as _voteOnPost,
  bookmarkPostAction as _bookmarkPost,
  addComment as _addComment,
  fetchCommunityPosts as _fetchPosts,
} from "./community-actions-final-fix"

/* ---------------------------------------------------------------------- */
/* Every public export MUST be an async function.                         */
/* ---------------------------------------------------------------------- */

export async function createPost(formData: FormData) {
  const result = await _createPost(formData)
  return result
}

export async function voteOnPost(postId: number, postCreatorAuthId = "") {
  const result = await _voteOnPost(postId, postCreatorAuthId)
  return result
}

export async function bookmarkPost(postId: number) {
  const result = await _bookmarkPost(postId)
  return result
}

export async function addComment(postId: number, content: string, parentCommentId?: number) {
  return _addComment(postId, content, parentCommentId)
}

export async function fetchCommunityPosts(
  loggedInAuthId?: string,
  opts?: {
    categoryFilter?: number
    sortOrder?: string
    page?: number
    limit?: number
    searchQuery?: string
  },
) {
  return _fetchPosts(loggedInAuthId, opts)
}
