"use client"

import type React from "react"
import { useState } from "react"

interface Comment {
  id: number
  author: string
  text: string
  replies?: Comment[]
}

interface EnhancedCommentSectionProps {
  initialComments: Comment[]
}

const EnhancedCommentSection: React.FC<EnhancedCommentSectionProps> = ({ initialComments }) => {
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [newCommentText, setNewCommentText] = useState("")

  const handleAddComment = () => {
    if (newCommentText.trim() !== "") {
      const newComment: Comment = {
        id: Date.now(),
        author: "Anonymous User",
        text: newCommentText,
      }
      setComments([...comments, newComment])
      setNewCommentText("")
    }
  }

  const handleReply = (commentId: number, replyText: string) => {
    if (replyText.trim() !== "") {
      const newReply: Comment = {
        id: Date.now(),
        author: "Anonymous User",
        text: replyText,
      }

      const updatedComments = comments.map((comment) => {
        if (comment.id === commentId) {
          return {
            ...comment,
            replies: comment.replies ? [...comment.replies, newReply] : [newReply],
          }
        }
        return comment
      })

      setComments(updatedComments)
    }
  }

  const renderComments = (commentList: Comment[], level = 0) => {
    return commentList.map((comment) => (
      <div
        key={comment.id}
        style={{ marginLeft: `${level * 20}px`, borderBottom: "1px solid #eee", paddingBottom: "10px" }}
      >
        <div>
          <strong>{comment.author}:</strong> {comment.text}
        </div>
        {comment.replies && comment.replies.length > 0 && renderComments(comment.replies, level + 1)}
        <div>
          <ReplyForm onReply={(replyText) => handleReply(comment.id, replyText)} />
        </div>
      </div>
    ))
  }

  return (
    <div>
      <h3>Comments</h3>
      <div>
        <textarea
          value={newCommentText}
          onChange={(e) => setNewCommentText(e.target.value)}
          placeholder="Add a comment..."
        />
        <button onClick={handleAddComment}>Add Comment</button>
      </div>
      <div>{renderComments(comments)}</div>
    </div>
  )
}

interface ReplyFormProps {
  onReply: (text: string) => void
}

const ReplyForm: React.FC<ReplyFormProps> = ({ onReply }) => {
  const [replyText, setReplyText] = useState("")

  const handleReplySubmit = () => {
    onReply(replyText)
    setReplyText("")
  }

  return (
    <div>
      <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Add a reply..." />
      <button onClick={handleReplySubmit}>Reply</button>
    </div>
  )
}

export { EnhancedCommentSection as CommentSection }
