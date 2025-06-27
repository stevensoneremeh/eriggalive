"use server"

/**
 * Legacy proxy — keeps older import paths working.
 * Each export is an async wrapper that dynamically loads
 * the real implementation from community-actions-final-fix.ts
 */
export async function createPost(formData: FormData) {
  const { createCommunityPostAction } = await import("./community-actions-final-fix")
  return createCommunityPostAction(formData)
}

export async function voteOnPost(postId: number, postCreatorAuthId = "") {
  const { voteOnPostAction } = await import("./community-actions-final-fix")
  return voteOnPostAction(postId, postCreatorAuthId)
}

export async function bookmarkPost(postId: number) {
  const { bookmarkPost } = await import("./community-actions-final-fix")
  return bookmarkPost(postId)
}

/* full API re-exports */
export { createPost as createCommunityPostAction }
export { voteOnPost as voteOnPostAction }
export async function fetchCommunityPosts(
  loggedInUserId?: string,
  options?: { categoryFilter?: number; sortOrder?: string; page?: number; limit?: number; searchQuery?: string },
) {
  const { fetchCommunityPosts } = await import("./community-actions-final-fix")
  return fetchCommunityPosts(loggedInUserId, options)
}
