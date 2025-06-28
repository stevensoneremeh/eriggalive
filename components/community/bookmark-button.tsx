"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Bookmark, BookmarkCheck } from "lucide-react"
import { bookmarkPost } from "@/lib/community-actions"
import { toast } from "sonner"

interface BookmarkButtonProps {
  postId: number
  initialBookmarked: boolean
}

export function BookmarkButton({ postId, initialBookmarked }: BookmarkButtonProps) {
  const [bookmarked, setBookmarked] = useState(initialBookmarked)
  const [isPending, startTransition] = useTransition()

  const handleBookmark = () => {
    startTransition(async () => {
      const result = await bookmarkPost(postId)

      if (result.success) {
        setBookmarked(result.bookmarked)
        toast.success(result.bookmarked ? "Post bookmarked" : "Bookmark removed")
      } else {
        toast.error(result.error || "Failed to bookmark")
      }
    })
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleBookmark} disabled={isPending}>
      {bookmarked ? <BookmarkCheck className="h-4 w-4 text-blue-500" /> : <Bookmark className="h-4 w-4" />}
    </Button>
  )
}
