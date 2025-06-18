"use client"

import { useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { MessageSquare, Heart, Share2, Play, Pause } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { UserTierBadge } from "@/components/user-tier-badge"
import type { PostWithUser } from "@/lib/db-operations"

interface PostCardProps {
  post: PostWithUser
  onLike?: (postId: number) => void
  onComment?: (postId: number) => void
  onShare?: (postId: number) => void
}

export function PostCard({ post, onLike, onComment, onShare }: PostCardProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null)

  const hasAudio = post.media_types.includes("audio")
  const hasImage = post.media_types.includes("image")

  const handlePlayPause = () => {
    if (!audioElement && hasAudio) {
      const audio = new Audio(post.media_urls[post.media_types.indexOf("audio")])
      audio.addEventListener("ended", () => setIsPlaying(false))
      setAudioElement(audio)
      audio.play()
      setIsPlaying(true)
    } else if (audioElement) {
      if (isPlaying) {
        audioElement.pause()
      } else {
        audioElement.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const formattedDate = formatDistanceToNow(new Date(post.created_at), { addSuffix: true })

  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-4">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={post.user.avatar_url || "/placeholder-user.jpg"} alt={post.user.username} />
            <AvatarFallback>{post.user.full_name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-medium">{post.user.full_name}</span>
              <UserTierBadge tier={post.user.tier} size="sm" />
            </div>
            <span className="text-xs text-muted-foreground">
              @{post.user.username} • {formattedDate}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-0">
        <div className="whitespace-pre-wrap mb-4">{post.content}</div>

        {hasImage && (
          <div className="rounded-md overflow-hidden mb-4">
            <img
              src={post.media_urls[post.media_types.indexOf("image")] || "/placeholder.svg"}
              alt="Post image"
              className="w-full h-auto object-cover"
            />
          </div>
        )}

        {hasAudio && (
          <div className="bg-muted/30 rounded-md p-3 flex items-center gap-3 mb-4">
            <Button variant="outline" size="icon" className="h-10 w-10 rounded-full" onClick={handlePlayPause}>
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <div className="flex-1">
              <div className="h-2 bg-muted-foreground/20 rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: isPlaying ? "30%" : "0%" }}></div>
              </div>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-0 flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-primary"
          onClick={() => onLike?.(post.id)}
        >
          <Heart className="h-4 w-4 mr-1" />
          <span>{post.like_count}</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-primary"
          onClick={() => onComment?.(post.id)}
        >
          <MessageSquare className="h-4 w-4 mr-1" />
          <span>{post.comment_count}</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-primary"
          onClick={() => onShare?.(post.id)}
        >
          <Share2 className="h-4 w-4 mr-1" />
          <span>Share</span>
        </Button>
      </CardFooter>
    </Card>
  )
}
