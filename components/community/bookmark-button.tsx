"use client"

import { useTransition } from "react"
import { bookmarkPost } from "@/lib/community-actions"
import { Button } from "@/components/ui/button"
import { Bookmark } from "lucide-react"

interface Props {
  postId: number
}
export function BookmarkButton({ postId }: Props) {
  const [isPending, start] = useTransition()
  return (
    <Button
      size="sm"
      variant="ghost"
      disabled={isPending}
      onClick={() => start(() => bookmarkPost(postId))}
      className="hover:text-purple-600"
    >
      <Bookmark className="h-4 w-4" />
    </Button>
  )
}
