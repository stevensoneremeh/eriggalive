"use server"

/**
 * Thin compatibility layer – forwards legacy imports to the new
 * canonical implementation in `lib/actions/community.ts`.
 *
 * KEEPING THIS FILE means we can refactor internally without touching
 * dozens of existing import statements across the app.
 */

const load = () => import("./actions/community")

export async function createCommunityPostAction(formData: FormData) {
  const { createCommunityPostAction } = await load()
  return createCommunityPostAction(formData)
}

export async function createPost(formData: FormData) {
  // alias used by some components
  const { createPost } = await load()
  return createPost(formData)
}

export async function voteOnPostAction(postId: number, postCreatorAuthId = "") {
  const { voteOnPostAction } = await load()
  return voteOnPostAction(postId, postCreatorAuthId)
}

export async function voteOnPost(postId: number, postCreatorAuthId = "") {
  // alias
  const { voteOnPost } = await load()
  return voteOnPost(postId, postCreatorAuthId)
}

export async function bookmarkPostAction(postId: number) {
  const { bookmarkPostAction } = await load()
  return bookmarkPostAction(postId)
}

export async function bookmarkPost(postId: number) {
  const { bookmarkPost } = await load()
  return bookmarkPost(postId)
}

export async function addComment(postId: number, content: string, parentCommentId?: number) {
  const { addComment } = await load()
  return addComment(postId, content, parentCommentId)
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
  const { fetchCommunityPosts } = await load()
  return fetchCommunityPosts({ loggedInAuthId, ...opts })
}

/* Re-export everything else (future-proof) */
export * from "./actions/community"
