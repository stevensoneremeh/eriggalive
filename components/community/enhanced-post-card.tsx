"use client"

import type React from "react"
import { Card, CardContent, CardActions, Typography, IconButton } from "@mui/material"
import ThumbUpIcon from "@mui/icons-material/ThumbUp"
import ThumbDownIcon from "@mui/icons-material/ThumbDown"
import BookmarkIcon from "@mui/icons-material/Bookmark"
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder"
import { useState } from "react"
import { voteOnPost, bookmarkPost } from "@/lib/actions/community"

interface EnhancedPostCardProps {
  postId: string
  title: string
  content: string
  upvotes: number
  downvotes: number
  isBookmarked: boolean
}

const EnhancedPostCard: React.FC<EnhancedPostCardProps> = ({
  postId,
  title,
  content,
  upvotes,
  downvotes,
  isBookmarked,
}) => {
  const [upvoteCount, setUpvoteCount] = useState(upvotes)
  const [downvoteCount, setDownvoteCount] = useState(downvotes)
  const [bookmarked, setBookmarked] = useState(isBookmarked)

  const handleUpvote = async () => {
    try {
      await voteOnPost(postId, "upvote")
      setUpvoteCount(upvoteCount + 1)
    } catch (error) {
      console.error("Error upvoting post:", error)
    }
  }

  const handleDownvote = async () => {
    try {
      await voteOnPost(postId, "downvote")
      setDownvoteCount(downvoteCount + 1)
    } catch (error) {
      console.error("Error downvoting post:", error)
    }
  }

  const handleBookmark = async () => {
    try {
      await bookmarkPost(postId)
      setBookmarked(!bookmarked)
    } catch (error) {
      console.error("Error bookmarking post:", error)
    }
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" component="div">
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {content}
        </Typography>
      </CardContent>
      <CardActions disableSpacing>
        <IconButton aria-label="upvote" onClick={handleUpvote}>
          <ThumbUpIcon />
          <Typography variant="body2">{upvoteCount}</Typography>
        </IconButton>
        <IconButton aria-label="downvote" onClick={handleDownvote}>
          <ThumbDownIcon />
          <Typography variant="body2">{downvoteCount}</Typography>
        </IconButton>
        <IconButton aria-label="bookmark" onClick={handleBookmark}>
          {bookmarked ? <BookmarkIcon /> : <BookmarkBorderIcon />}
        </IconButton>
      </CardActions>
    </Card>
  )
}

export function PostCardSkeleton() {
  return <div className="w-full rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse h-44" />
}

export default EnhancedPostCard
