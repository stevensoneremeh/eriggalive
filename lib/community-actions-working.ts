"use server"

import {
  createPost as createPostImpl,
  voteOnPost as voteOnPostImpl,
  bookmarkPost as bookmarkPostImpl,
  createComment as createCommentImpl,
  deletePost as deletePostImpl,
  editPost as editPostImpl,
  reportPost as reportPostImpl,
  followUser as followUserImpl,
  unfollowUser as unfollowUserImpl,
} from "./community-actions-final-fix"

// All exports must be async functions in "use server" files
export async function createPost(formData: FormData) {
  return await createPostImpl(formData)
}

export async function voteOnPost(postId: string, voteType: "up" | "down") {
  return await voteOnPostImpl(postId, voteType)
}

export async function bookmarkPost(postId: string) {
  return await bookmarkPostImpl(postId)
}

export async function createComment(postId: string, content: string, parentId?: string) {
  return await createCommentImpl(postId, content, parentId)
}

export async function deletePost(postId: string) {
  return await deletePostImpl(postId)
}

export async function editPost(postId: string, content: string) {
  return await editPostImpl(postId, content)
}

export async function reportPost(postId: string, reason: string) {
  return await reportPostImpl(postId, reason)
}

export async function followUser(userId: string) {
  return await followUserImpl(userId)
}

export async function unfollowUser(userId: string) {
  return await unfollowUserImpl(userId)
}

// Legacy aliases for backward compatibility
export async function createPostAction(formData: FormData) {
  return await createPost(formData)
}

export async function voteOnPostAction(postId: string, voteType: "up" | "down") {
  return await voteOnPost(postId, voteType)
}

export async function bookmarkPostAction(postId: string) {
  return await bookmarkPost(postId)
}
