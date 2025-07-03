"use client"

import { Button } from "@/components/ui/button"
import { Heart, MessageSquare, Share2, Bookmark } from "lucide-react"

interface PostActionsProps {
  post: any
  onLike: () => void
  onBookmark: () => void
  onShare: () => void
  isAuthenticated: boolean
}

export function PostActions({ post, onLike, onBookmark, onShare, isAuthenticated }: PostActionsProps) {
  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onLike}
          disabled={!isAuthenticated}
          className={`${post.isLiked ? "text-red-500 hover:text-red-600" : "text-muted-foreground hover:text-red-500"} transition-colors`}
        >
          <Heart className={`h-4 w-4 mr-1 ${post.isLiked ? "fill-current" : ""}`} />
          <span>{post.likes}</span>
        </Button>

        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-blue-500">
          <MessageSquare className="h-4 w-4 mr-1" />
          <span>{post.comments}</span>
        </Button>

        <Button variant="ghost" size="sm" onClick={onShare} className="text-muted-foreground hover:text-green-500">
          <Share2 className="h-4 w-4 mr-1" />
          <span>{post.shares}</span>
        </Button>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={onBookmark}
        disabled={!isAuthenticated}
        className={`${post.isBookmarked ? "text-orange-500 hover:text-orange-600" : "text-muted-foreground hover:text-orange-500"} transition-colors`}
      >
        <Bookmark className={`h-4 w-4 ${post.isBookmarked ? "fill-current" : ""}`} />
      </Button>
    </div>
  )
}
