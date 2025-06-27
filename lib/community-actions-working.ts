"use server"

const load = () => import("./community-actions-final-fix")

export async function createPost(formData: FormData) {
  const { createCommunityPostAction } = await load()
  return createCommunityPostAction(formData)
}

export async function voteOnPost(postId: number, postCreatorAuthId = "") {
  const { voteOnPostAction } = await load()
  return voteOnPostAction(postId, postCreatorAuthId)
}

export async function bookmarkPost(postId: number) {
  const { bookmarkPost } = await load()
  return bookmarkPost(postId)
}

/* --- keep the “*Action” aliases some components expect ------------------ */
export { createPost as createCommunityPostAction }
export { voteOnPost as voteOnPostAction }
export { bookmarkPost as bookmarkPostAction }

export async function fetchCommunityPosts(
  loggedInUserId?: string,
  options?: { categoryFilter?: number; sortOrder?: string; page?: number; limit?: number; searchQuery?: string },
) {
  const { fetchCommunityPosts } = await load()
  return fetchCommunityPosts(loggedInUserId, options)
}

export async function addComment(postId: number, content: string, parentCommentId?: number) {
  const { addComment } = await load()
  return addComment(postId, content, parentCommentId)
}
