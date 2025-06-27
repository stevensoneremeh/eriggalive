"use server"

export async function createPost(formData: FormData) {
  const { createCommunityPostAction } = await import("./community-actions-final-fix")
  return createCommunityPostAction(formData)
}

export async function voteOnPost(postId: number, postCreatorAuthId?: string) {
  const { voteOnPostAction } = await import("./community-actions-final-fix")
  return voteOnPostAction(postId, postCreatorAuthId || "")
}

export async function bookmarkPost(postId: number) {
  const { bookmarkPost } = await import("./community-actions-final-fix")
  return bookmarkPost(postId)
}

export async function createCommunityPostAction(formData: FormData) {
  const { createCommunityPostAction } = await import("./community-actions-final-fix")
  return createCommunityPostAction(formData)
}

export async function voteOnPostAction(postId: number, postCreatorAuthId?: string) {
  const { voteOnPostAction } = await import("./community-actions-final-fix")
  return voteOnPostAction(postId, postCreatorAuthId || "")
}

export async function fetchCommunityPosts(
  loggedInUserId?: string,
  options?: { categoryFilter?: number; sortOrder?: string; page?: number; limit?: number; searchQuery?: string },
) {
  const { fetchCommunityPosts } = await import("./community-actions-final-fix")
  return fetchCommunityPosts(loggedInUserId, options)
}
