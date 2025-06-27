"use server"

/**
 * Legacy shim - keeps old imports alive while delegating
 * to the new canonical helpers in `lib/actions/community.ts`.
 */

import { revalidatePath } from "next/cache"
import {
  createPost,
  voteOnPost,
  bookmarkPost,
  addComment,
  type CreatePostArgs,
  type VoteArgs,
  type BookmarkArgs,
} from "./actions/community"

/* ────────────────────────────────────────────────────────── */
/* Aliases expected by the existing codebase                 */

export async function createCommunityPostAction(args: CreatePostArgs & { path?: string }) {
  const result = await createPost(args)
  // Path may be omitted by callers; default to the community root
  revalidatePath(args.path || "/community")
  return result
}

export async function voteOnPostAction(args: VoteArgs & { path?: string }) {
  const result = await voteOnPost(args)
  revalidatePath(args.path || "/community")
  return result
}

export async function bookmarkPostAction(args: BookmarkArgs & { path?: string }) {
  const result = await bookmarkPost(args)
  revalidatePath(args.path || "/community")
  return result
}

export { addComment } // no revalidation necessary here

/* Backwards-compatibility names */
export { createCommunityPostAction as createPost }
export { voteOnPostAction as voteOnPost }
export { bookmarkPostAction as bookmarkPost }

// This file acts as a compatibility layer.
// It re-exports all actions from the new centralized location
// to ensure older components that import from this path do not break.
export * from "./actions/community"
