"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSearchParams } from "next/navigation"
import type { Post } from "@/types"
import { createPost, voteOnPost, bookmarkPost, addComment } from "@/lib/actions/community"

interface CommunityPageClientProps {
  initialPosts: Post[]
}

const CommunityPageClient: React.FC<CommunityPageClientProps> = ({ initialPosts }) => {
  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [newPostContent, setNewPostContent] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    setPosts(initialPosts)
  }, [initialPosts])

  const handleCreatePost = async () => {
    if (newPostContent.trim() === "") {
      return
    }

    try {
      const newPost = await createPost(newPostContent)
      setPosts([newPost, ...posts])
      setNewPostContent("")
    } catch (error) {
      console.error("Error creating post:", error)
    }
  }

  const handleVote = async (postId: string, voteType: "upvote" | "downvote") => {
    try {
      await voteOnPost(postId, voteType)

      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId
            ? {
                ...post,
                upvotes: voteType === "upvote" ? post.upvotes + 1 : post.upvotes,
                downvotes: voteType === "downvote" ? post.downvotes + 1 : post.downvotes,
              }
            : post,
        ),
      )
      router.refresh()
    } catch (error) {
      console.error("Error voting on post:", error)
    }
  }

  const handleBookmark = async (postId: string) => {
    try {
      await bookmarkPost(postId)
      setPosts((prevPosts) =>
        prevPosts.map((post) => (post.id === postId ? { ...post, bookmarked: !post.bookmarked } : post)),
      )
      router.refresh()
    } catch (error) {
      console.error("Error bookmarking post:", error)
    }
  }

  const handleAddComment = async (postId: string, commentContent: string) => {
    if (commentContent.trim() === "") {
      return
    }

    try {
      await addComment(postId, commentContent)
      router.refresh()
    } catch (error) {
      console.error("Error adding comment:", error)
    }
  }

  return (
    <div>
      <h2>Community Page</h2>
      <div>
        <textarea
          value={newPostContent}
          onChange={(e) => setNewPostContent(e.target.value)}
          placeholder="Write a new post..."
        />
        <button onClick={handleCreatePost}>Create Post</button>
      </div>

      {posts.map((post) => (
        <div key={post.id}>
          <h3>{post.title}</h3>
          <p>{post.content}</p>
          <button onClick={() => handleVote(post.id, "upvote")}>Upvote ({post.upvotes})</button>
          <button onClick={() => handleVote(post.id, "downvote")}>Downvote ({post.downvotes})</button>
          <button onClick={() => handleBookmark(post.id)}>{post.bookmarked ? "Unbookmark" : "Bookmark"}</button>
          <div>
            <input
              type="text"
              placeholder="Add a comment..."
              onKeyDown={async (e) => {
                if (e.key === "Enter") {
                  await handleAddComment(post.id, (e.target as HTMLInputElement).value)
                  ;(e.target as HTMLInputElement).value = ""
                }
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export default CommunityPageClient
