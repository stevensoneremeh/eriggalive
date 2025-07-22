"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ImageIcon, Send, X, Loader2 } from "lucide-react"

interface Category {
  id: string
  name: string
  slug: string
  color: string
  icon: string
}

interface RealtimeCreatePostFormProps {
  categories: Category[]
  onPostCreated: (post: {
    user: {
      username: string
      display_name?: string
      avatar_url?: string
      tier: string
    }
    title?: string
    content: string
    media_url?: string
    media_type?: string
  }) => void
}

const TIER_ICONS = {
  grassroot: "Star",
  pioneer: "Zap",
  elder: "Crown",
  blood_brotherhood: "Flame",
}

const TIER_COLORS = {
  grassroot: "text-green-500",
  pioneer: "text-blue-500",
  elder: "text-purple-500",
  blood_brotherhood: "text-red-500",
}

export function RealtimeCreatePostForm({ categories, onPostCreated }: RealtimeCreatePostFormProps) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [mediaPreview, setMediaPreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user, profile } = useAuth()
  const supabase = createClient()

  const handleMediaUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setMediaFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setMediaPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeMedia = () => {
    setMediaFile(null)
    setMediaPreview(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!profile) {
      // Handle sign in required logic here
      return
    }

    if (!content.trim()) {
      // Handle missing content logic here
      return
    }

    setIsSubmitting(true)

    try {
      const postData = {
        title: title.trim() || undefined,
        content: content.trim(),
        user_id: profile.id,
        category_id: selectedCategory || null,
        is_published: true,
        is_deleted: false,
        vote_count: 0,
        comment_count: 0,
        media_urls: mediaPreview ? [mediaPreview] : [],
      }

      const { data, error } = await supabase.from("community_posts").insert(postData).select().single()

      if (error) throw error

      // Call the onPostCreated callback with the new post data
      onPostCreated({
        user: {
          username: profile.username,
          display_name: profile.display_name || profile.full_name,
          avatar_url: profile.avatar_url,
          tier: profile.tier,
        },
        title: title.trim() || undefined,
        content: content.trim(),
        media_url: mediaPreview || undefined,
        media_type: mediaFile ? (mediaFile.type.startsWith("image/") ? "image" : "video") : undefined,
      })

      // Reset form
      setTitle("")
      setContent("")
      setSelectedCategory("")
      setMediaFile(null)
      setMediaPreview(null)
    } catch (error) {
      console.error("Error creating post:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!profile) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Please sign in to create posts</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gradient-to-r from-background to-muted/20">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>Create New Post</span>
          <Badge variant="secondary">Share your thoughts</Badge>
        </CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* User Info */}
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={profile.avatar_url || "/placeholder.svg"} />
              <AvatarFallback>{(profile.display_name || profile.username).charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm">{profile.display_name || profile.username}</p>
              <Badge variant="outline" className="text-xs">
                {profile.tier}
              </Badge>
            </div>
          </div>

          {/* Title Input */}
          <Input
            placeholder="Post title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
          />

          {/* Content Input */}
          <Textarea
            placeholder="What's on your mind? Share your thoughts with the community..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            maxLength={1000}
            required
          />

          {/* Character Count */}
          <div className="text-right">
            <span className="text-xs text-muted-foreground">{content.length}/1000 characters</span>
          </div>

          {/* Media Preview */}
          {mediaPreview && (
            <div className="relative">
              <div className="rounded-lg overflow-hidden border">
                {mediaFile?.type.startsWith("image/") ? (
                  <img src={mediaPreview || "/placeholder.svg"} alt="Preview" className="w-full h-48 object-cover" />
                ) : (
                  <video src={mediaPreview} className="w-full h-48 object-cover" controls />
                )}
              </div>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={removeMedia}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleMediaUpload}
                className="hidden"
                id="media-upload"
              />
              <label htmlFor="media-upload">
                <Button type="button" variant="outline" size="sm" asChild>
                  <span className="cursor-pointer">
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Add Media
                  </span>
                </Button>
              </label>
            </div>

            <Button
              type="submit"
              disabled={!content.trim() || isSubmitting}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Posting...
                </>
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
