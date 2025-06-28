––– lib/community-actions.ts –––
// ---------------------------------------------------------------------------
// Compatibility shims for older imports
// ---------------------------------------------------------------------------

/**
 * The UI still imports `createCommentAction`, `editCommentAction`,
 * `deleteCommentAction`, `createReportAction`, and `bookmarkPost`
 * from "@/lib/community-actions".  We alias (or stub) them here so
 * the build succeeds while you finish full implementations.
 */

export { addComment as createCommentAction }
export { fetchCommentsForPost } // already declared above

export async function editCommentAction(commentId: number, content: string) {
  "use server"
  // TODO: replace with real implementation
  return { success: false, error: "Edit comments not yet implemented." }
}

export async function deleteCommentAction(commentId: number) {
  "use server"
  // TODO: replace with real implementation
  return { success: false, error: "Delete comments not yet implemented." }
}

export async function createReportAction(postId: number, reason: string) {
  "use server"
  // TODO: replace with real implementation
  return { success: false, error: "Report posts not yet implemented." }
}

/**
 * Simple placeholder – prevents build failure where bookmarkPost is imported
 * from either this file or community-actions-final.  Wire it up later.
 */
export async function bookmarkPost(postId: number) {
  "use server"
  return { success: false, error: "Bookmark post not yet implemented." }
}

––– lib/community-actions-final.ts –––
// ---------------------------------------------------------------------------
// Back-compat shims – expose legacy names that older pages expect
// ---------------------------------------------------------------------------
"use server"

import { createCommunityPostAction, voteOnPostAction } from "@/lib/community-actions"

export async function createPost(formData: FormData) {
  return createCommunityPostAction(formData)
}

export async function voteOnPost(postId: number, postCreatorAuthId: string) {
  return voteOnPostAction(postId, postCreatorAuthId)
}

// direct re-export for convenience

––– components/community/create-post-form-final.tsx –––
// add **immediately after** the existing export statement(s)
export { CreatePostFormFinal as CreatePostForm }
