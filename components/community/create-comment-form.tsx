"use client"

import Link from "next/link"

import type React from "react"

import { useState, useTransition } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { RichTextEditor } from "./rich-text-editor"
import { useAuth } from "@/contexts/auth-context"
import { createCommentAction } from "@/lib/community-actions"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Send } from "lucide-react"
import type { CommunityComment } from "@/types/database"

interface CreateCommentFormProps {
  postId: number
  parentId?: number | null
  onCommentCreated: (newComment: CommunityComment) => void
  placeholder?: string
  autoFocus?: boolean
  onCancel?: () => void
}

export function CreateCommentForm({
  postId,
  parentId = null,
  onCommentCreated,
  placeholder = "Write a comment...",
  autoFocus = false,
  onCancel,
}: CreateCommentFormProps) {
  const { profile, isAuthenticated } = useAuth()
  const [content, setContent] = useState("")
  const [isSubmitting, startSubmitTransition] = useTransition()
  const { toast } = useToast()

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!isAuthenticated || !profile) {
      toast({ title: "Login Required", description: "Please login to comment.", variant: "destructive" })
      return
    }
    if (!content.replace(/<[^>]*>?/gm, "").trim()) {
      toast({ title: "Empty Comment", description: "Comment cannot be empty.", variant: "destructive" })
      return
    }

    startSubmitTransition(async () => {
      const result = await createCommentAction(postId, content, parentId)
      if (result.success && result.comment) {
        onCommentCreated(result.comment as CommunityComment) // Cast needed due to server action return type
        setContent("")
        if (onCancel) onCancel() // Close reply form for example
        toast({ title: "Comment Posted!" })
      } else {
        toast({ title: "Error", description: result.error || "Failed to post comment.", variant: "destructive" })
      }
    })
  }

  if (!isAuthenticated) {
    return (
      <p className="text-sm text-muted-foreground p-3 border rounded-md">
        Please{" "}
        <Link href="/login" className="text-primary hover:underline">
          login
        </Link>{" "}
        to comment.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-start space-x-3 py-3">
      <Avatar className="mt-1 h-8 w-8 sm:h-9 sm:w-9">
        <AvatarImage src={profile?.avatar_url || "/placeholder-user.jpg"} alt={profile?.username} />
        <AvatarFallback>{profile?.username?.charAt(0).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-2">
        <RichTextEditor
          content={content}
          onChange={setContent}
          placeholder={placeholder}
          className="min-h-[60px] text-sm"
        />
        {/* Tiptap editor doesn't need autoFocus prop here, it's handled internally if configured */}
        <div className="flex items-center justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
          )}
          <Button type="submit" size="sm" disabled={isSubmitting || !content.replace(/<[^>]*>?/gm, "").trim()}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            {parentId ? "Reply" : "Comment"}
          </Button>
        </div>
      </div>
    </form>
  )
}
