"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { Loader2, ImageIcon, Video, X } from "lucide-react"

interface Category {
  id: number
  name: string
  slug: string
  color?: string
}

interface RealtimeCreatePostFormProps {
  categories: Category[]
  onPostCreated?: (post: any) => void
}

export function RealtimeCreatePostForm({ categories, onPostCreated }: RealtimeCreatePostFormProps) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [categoryId, setCategoryId] = useState<string>("")
  const [mediaFiles, setMediaFiles] = useState<File[]>([])
  const [mediaUrls, setMediaUrls] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user } = useAuth()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      setMediaFiles((prev) => [...prev, ...files])

      // Create preview URLs
      files.forEach((file) => {
        const url = URL.createObjectURL(file)
        setMediaUrls((prev) => [...prev, url])
      })
    }
  }

  const removeMedia = (index: number) => {
    setMediaFiles((prev) => prev.filter((_, i) => i !== index))
    setMediaUrls((prev) => {
      const newUrls = prev.filter((_, i) => i !== index)
      // Revoke the removed URL to free memory
      URL.revokeObjectURL(prev[index])
      return newUrls
    })
  }

  const uploadMedia = async (files: File[]): Promise<string[]> => {
    const uploadedUrls: string[] = []

    for (const file of files) {
      const formData = new FormData()
      formData.append("file", file)

      try {
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (response.ok) {
          const data = await response.json()
          uploadedUrls.push(data.url)
        } else {
          console.error("Failed to upload file:", file.name)
        }
      } catch (error) {
        console.error("Error uploading file:", error)
      }
    }

    return uploadedUrls
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to create a post.",
        variant: "destructive",
      })
      return
    }

    if (!title.trim() || !content.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide both a title and content for your post.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      let uploadedMediaUrls: string[] = []
      let mediaType: string | null = null

      // Upload media files if any
      if (mediaFiles.length > 0) {
        uploadedMediaUrls = await uploadMedia(mediaFiles)

        // Determine media type based on first file
        if (mediaFiles[0].type.startsWith("image/")) {
          mediaType = "image"
        } else if (mediaFiles[0].type.startsWith("video/")) {
          mediaType = "video"
        }
      }

      const response = await fetch("/api/community/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          category_id: categoryId ? Number.parseInt(categoryId) : null,
          media_urls: uploadedMediaUrls,
          media_type: mediaType,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create post")
      }

      const data = await response.json()

      // Reset form
      setTitle("")
      setContent("")
      setCategoryId("")
      setMediaFiles([])
      setMediaUrls((prev) => {
        // Revoke all preview URLs
        prev.forEach((url) => URL.revokeObjectURL(url))
        return []
      })

      toast({
        title: "Post created!",
        description: "Your post has been published successfully.",
      })

      // Call callback if provided
      if (onPostCreated) {
        onPostCreated(data.post)
      }
    } catch (error) {
      console.error("Error creating post:", error)
      toast({
        title: "Error",
        description: "Failed to create post. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Please log in to create a post.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create a New Post</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              placeholder="Post title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              disabled={isSubmitting}
            />
          </div>

          <div>
            <Textarea
              placeholder="What's on your mind?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              maxLength={2000}
              disabled={isSubmitting}
            />
          </div>

          {categories.length > 0 && (
            <div>
              <Select value={categoryId} onValueChange={setCategoryId} disabled={isSubmitting}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      <div className="flex items-center gap-2">
                        {category.color && (
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                        )}
                        {category.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Media Upload */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById("image-upload")?.click()}
                disabled={isSubmitting}
              >
                <ImageIcon className="h-4 w-4 mr-1" />
                Add Image
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById("video-upload")?.click()}
                disabled={isSubmitting}
              >
                <Video className="h-4 w-4 mr-1" />
                Add Video
              </Button>
            </div>

            <input
              id="image-upload"
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
            <input id="video-upload" type="file" accept="video/*" onChange={handleFileChange} className="hidden" />

            {/* Media Previews */}
            {mediaUrls.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {mediaUrls.map((url, index) => (
                  <div key={index} className="relative">
                    {mediaFiles[index]?.type.startsWith("image/") ? (
                      <img
                        src={url || "/placeholder.svg"}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    ) : (
                      <video src={url} className="w-full h-32 object-cover rounded-lg" />
                    )}
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-1 right-1 h-6 w-6 p-0"
                      onClick={() => removeMedia(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting || !title.trim() || !content.trim()}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isSubmitting ? "Publishing..." : "Publish Post"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
