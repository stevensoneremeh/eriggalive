"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Bookmark } from "lucide-react"
import { bookmarkPostAction } from "@/lib/community-actions"
import { useToast } from "@/components/ui/use-toast"

interface BookmarkButtonProps {
  postId: number
  isBookmarked?: boolean
}

export function BookmarkButton({ postId, isBookmarked = false }: BookmarkButtonProps) {
  const [isBookmarking, setIsBookmarking] = useState(false)
  const [bookmarked, setBookmarked] = useState(isBookmarked)
  const { toast } = useToast()

  async function handleBookmark() {
    setIsBookmarking(true)

    try {
      const result = await bookmarkPostAction(postId)

      if (result.success) {
        setBookmarked(result.action === "added")
        toast({
          title: result.action === "added" ? "Post bookmarked" : "Bookmark removed",
          description: result.action === "added" ? "Post saved to your bookmarks" : "Post removed from bookmarks",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to bookmark",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsBookmarking(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleBookmark}
      disabled={isBookmarking}
      className={`transition-colors ${
        bookmarked ? "text-yellow-500 hover:text-yellow-600 bg-yellow-50" : "hover:text-yellow-500 hover:bg-yellow-50"
      }`}
    >
      <Bookmark className={`h-4 w-4 ${bookmarked ? "fill-current" : ""}`} />
    </Button>
  )
}
