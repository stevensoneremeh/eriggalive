"use client"

import type React from "react"
import { useState } from "react"
import { useSession } from "next-auth/react"
import { addComment } from "@/lib/actions/community"

interface EnhancedCommentSectionProps {
  postId: string
}

const EnhancedCommentSection: React.FC<EnhancedCommentSectionProps> = ({ postId }) => {
  const { data: session } = useSession()
  const [commentText, setCommentText] = useState("")
  const [comments, setComments] = useState<any[]>([]) // Replace 'any' with your comment type

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!session?.user) {
      alert("You must be logged in to comment.")
      return
    }

    if (!commentText.trim()) {
      return // Prevent submitting empty comments
    }

    try {
      const newComment = await addComment({
        postId: postId,
        text: commentText,
        authorId: session.user.id,
      })

      setComments((prevComments) => [...prevComments, newComment])
      setCommentText("") // Clear the input field after successful submission
    } catch (error) {
      console.error("Error adding comment:", error)
      alert("Failed to add comment. Please try again.")
    }
  }

  return (
    <div>
      <h3>Comments</h3>
      {session?.user ? (
        <form onSubmit={handleSubmit}>
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Add a comment..."
            rows={4}
            cols={50}
          />
          <button type="submit">Post Comment</button>
        </form>
      ) : (
        <p>Log in to leave a comment.</p>
      )}

      {comments.map((comment) => (
        <div key={comment.id}>
          <p>{comment.text}</p>
          <p>By: {comment.authorName}</p>
        </div>
      ))}
    </div>
  )
}

export default EnhancedCommentSection
export { EnhancedCommentSection as CommentSection }
