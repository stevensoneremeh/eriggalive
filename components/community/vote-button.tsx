"use client"

import { useTransition } from "react"
import { voteOnPost } from "@/lib/community-actions"
import { Button } from "@/components/ui/button"
import { ThumbsUp } from "lucide-react"

interface Props {
  postId: number
  voteCount: number
}
export function VoteButton({ postId, voteCount }: Props) {
  const [isPending, start] = useTransition()
  return (
    <Button
      size="sm"
      variant="ghost"
      disabled={isPending}
      onClick={() => start(() => voteOnPost(postId))}
      className="flex items-center gap-1 hover:text-blue-600"
    >
      <ThumbsUp className="h-4 w-4" />
      <span className="font-medium tabular-nums">{voteCount}</span>
    </Button>
  )
}
