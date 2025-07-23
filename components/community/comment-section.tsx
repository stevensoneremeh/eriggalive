"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import { MessageCircle, Send, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import Link from "next/link"

interface Comment {
  id: number
  content: string
  created_at: string
  user: {
    id: number
    username: string
    full_name: string
    avatar_url?: string
    tier: string
  }
}

interface CommentSectionProps {
  postId: number
  commentCount: number
  onCommentCountChange: (newCount: number) => void
}

export function CommentSection({ postId, commentCount, onCommentCountChange }: CommentSectionProps) {
  const { user, profile, isAuthenticated } = useAuth()
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [newComment, setNewComment] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const loadComments = async () => {
    if (!showComments) return

    setLoading(true)
    try {
      const response = await fetch(`/api/community/posts/${postId}/comments`)
      const result = await response.json()

      if (result.success) {
        setComments(result.comments)
      } else {
        console.error("Failed to load comments:", result.error)
      }
    } catch (error) {
      console.error("Failed to load comments:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (showComments) {
      loadComments()
    }
  }, [showComments, postId])

  const handleSubmitComment = async () => {
    if (!user || !newComment.trim()) return

    setSubmitting(true)

    try {
      const response = await fetch(`/api/community/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newComment.trim(),
        }),
      })

      const result = await response.json()

      if (result.success) {
        setComments((prev) => [...prev, result.comment])
        setNewComment("")
        onCommentCountChange(commentCount + 1)
        toast.success("Comment posted!")
      } else {
        toast.error(result.error || "Failed to post comment")
      }
    } catch (error) {
      toast.error("Failed to post comment")
    } finally {
      setSubmitting(false)
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case "blood_brotherhood":
      case "blood":
        return "bg-red-500 text-white"
      case "elder":
        return "bg-purple-500 text-white"
      case "pioneer":
        return "bg-blue-500 text-white"
      case "grassroot":
        return "bg-green-500 text-white"
      default:
        return "bg-gray-500 text-white"
    }
  }

  const getTierDisplayName = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case "blood_brotherhood":
      case "blood":
        return "Blood"
      case "elder":
        return "Elder"
      case "pioneer":
        return "Pioneer"
      case "grassroot":
        return "Grassroot"
      default:
        return "Fan"
    }
  }

  return (
    <div className="space-y-4">
      {/* Comments Toggle */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowComments(!showComments)}
        className="flex items-center space-x-1"
      >
        <MessageCircle className="h-4 w-4" />
        <span>
          {commentCount} {commentCount === 1 ? "comment" : "comments"}
        </span>
      </Button>

      {/* Comments Section */}
      {showComments && (
        <div className="space-y-4 border-t pt-4">
          {/* New Comment Form */}
          {isAuthenticated && profile ? (
            <div className="flex space-x-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile.avatar_url || "/placeholder-user.jpg"} />
                <AvatarFallback>{profile.username?.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  className="min-h-[60px] text-sm"
                />
                <div className="flex justify-end mt-2">
                  <Button size="sm" onClick={handleSubmitComment} disabled={!newComment.trim() || submitting}>
                    {submitting ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Send className="h-3 w-3 mr-1" />}
                    Comment
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              <p>
                <Link href="/login" className="text-primary hover:underline">
                  Sign in
                </Link>{" "}
                to comment on this post.
              </p>
            </div>
          )}

          {/* Comments List */}
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : comments.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No comments yet. Be the first to comment!</p>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex space-x-3">
                  <Link href={`/profile/${comment.user.username}`}>
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={comment.user.avatar_url || "/placeholder-user.jpg"}
                        alt={comment.user.username}
                      />
                      <AvatarFallback>{comment.user.username.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Link>

                  <div className="flex-1 min-w-0">
                    <div className="bg-muted rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Link href={`/profile/${comment.user.username}`} className="hover:underline">
                          <span className="font-semibold text-sm">
                            {comment.user.full_name || comment.user.username}
                          </span>
                        </Link>
                        <span className="text-xs text-muted-foreground">@{comment.user.username}</span>
                        <Badge className={cn("text-xs", getTierColor(comment.user.tier))}>
                          {getTierDisplayName(comment.user.tier)}
                        </Badge>
                      </div>
                      <p className="text-sm leading-relaxed">{comment.content}</p>
                    </div>

                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
