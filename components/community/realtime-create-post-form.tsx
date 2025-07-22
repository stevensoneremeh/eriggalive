"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ImageIcon, VideoIcon, FileIcon, Send } from "lucide-react"
import { publishEvent, ABLY_CHANNELS } from "@/lib/ably"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface Category {
  id: number
  name: string
  slug: string
  color?: string
  icon?: string
}

interface RealtimeCreatePostFormProps {
  categories: Category[]
}

export function RealtimeCreatePostForm({ categories }: RealtimeCreatePostFormProps) {
  const { profile, isAuthenticated } = useAuth()
  const [content, setContent] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const getTierColor = (tier: string) => {
    switch (tier?.toLowerCase()) {
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

  const handleMediaSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB")
        return
      }
      setMediaFile(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isAuthenticated || !profile) {
      toast.error("Please sign in to create a post")
      return
    }

    if (!content.trim() && !mediaFile) {
      toast.error("Please add some content or upload media")
      return
    }

    if (!selectedCategory) {
      toast.error("Please select a category")
      return
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append("content", content)
      formData.append("categoryId", selectedCategory)
      if (mediaFile) {
        formData.append("mediaFile", mediaFile)
      }

      const response = await fetch("/api/community/posts", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        // Publish real-time event
        await publishEvent(ABLY_CHANNELS.COMMUNITY_FEED, "post:created", {
          post: result.post,
          categoryId: selectedCategory,
        })

        // Reset form
        setContent("")
        setSelectedCategory("")
        setMediaFile(null)

        toast.success("Post created successfully!")
      } else {
        toast.error(result.error || "Failed to create post")
      }
    } catch (error) {
      console.error("Create post error:", error)
      toast.error("Failed to create post")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <h3 className="text-lg font-semibold mb-2">Join the Community</h3>
          <p className="text-muted-foreground mb-4">Sign in to create posts and engage with other fans.</p>
          <Button asChild>
            <a href="/login">Sign In</a>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={profile.avatar_url || "/placeholder-user.jpg"} />
            <AvatarFallback>{profile.username.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <span className="text-lg">What's on your mind?</span>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={cn("text-xs", getTierColor(profile.tier))}>{profile.tier}</Badge>
            </div>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share your thoughts with the community..."
            className="min-h-[120px] resize-none"
            disabled={isSubmitting}
          />

          {mediaFile && (
            <div className="p-3 bg-muted rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                {mediaFile.type.startsWith("image/") && <ImageIcon className="h-4 w-4" />}
                {mediaFile.type.startsWith("video/") && <VideoIcon className="h-4 w-4" />}
                {!mediaFile.type.startsWith("image/") && !mediaFile.type.startsWith("video/") && (
                  <FileIcon className="h-4 w-4" />
                )}
                <span className="text-sm">{mediaFile.name}</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setMediaFile(null)}
                disabled={isSubmitting}
              >
                Remove
              </Button>
            </div>
          )}

          <div className="flex items-center gap-4">
            <Select value={selectedCategory} onValueChange={setSelectedCategory} disabled={isSubmitting}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <input
                type="file"
                accept="image/*,video/*,audio/*"
                onChange={handleMediaSelect}
                className="hidden"
                id="media-upload"
                disabled={isSubmitting}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById("media-upload")?.click()}
                disabled={isSubmitting}
              >
                <ImageIcon className="h-4 w-4 mr-2" />
                Media
              </Button>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting || (!content.trim() && !mediaFile) || !selectedCategory}>
              {isSubmitting ? (
                "Posting..."
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Post
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
