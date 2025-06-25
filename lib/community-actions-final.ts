"use server"

/**
 * This proxy keeps legacy import paths working while making sure
 * *only* async functions are exported (Next.js `use server` rule)
 * and no static `next/cache` import leaks to the client bundle.
 */
export async function createPost(formData: FormData) {
  const { createCommunityPostAction } = await import("./community-actions-final-fix")
  return createCommunityPostAction(formData)
}

export async function voteOnPost(postId: number, postCreatorAuthId?: string) {
  const { voteOnPostAction } = await import("./community-actions-final-fix")
  return voteOnPostAction(postId, postCreatorAuthId)
}

export async function bookmarkPost(postId: number) {
  const { bookmarkPost } = await import("./community-actions-working")
  return bookmarkPost(postId)
}
