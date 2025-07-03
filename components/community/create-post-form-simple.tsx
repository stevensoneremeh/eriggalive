"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { ImagePlus, Video, Mic, Send, Loader2, X } from "lucide-react"

interface CreatePostFormProps {
  categories: Array<{ id: number; name: string; slug: string }>
  onPostCreated?: () => void
}

export function CreatePostFormSimple({ categories, onPostCreated }: CreatePostFormProps) {
  const { profile } = useAuth()
  const { toast } = useToast()

  const [content, setContent] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [mediaPreview, setMediaPreview] = useState<string | null>(null)
  const [mediaType, setMediaType] = useState<"image" | "video" | "audio" | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleMediaChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select a file smaller than 50MB.",
          variant: "destructive",
        })
        return
      }

      setMediaFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setMediaPreview(reader.result as string)
      }
      reader.readAsDataURL(file)

      if (file.type.startsWith("image/")) setMediaType("image")
      else if (file.type.startsWith("video/")) setMediaType("video")
      else if (file.type.startsWith("audio/")) setMediaType("audio")
      else {
        toast({
          title: "Unsupported File Type",
          description: "Please select an image, video, or audio file.",
          variant: "destructive",
        })
        setMediaType(null)
      }
    }
  }

  const removeMedia = () => {
    setMediaFile(null)
    setMediaPreview(null)
    setMediaType(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!content.trim() && !mediaFile) {
      toast({
        title: "Empty Post",
        description: "Please write something or add media.",
        variant: "destructive",
      })
      return
    }

    if (!selectedCategory) {
      toast({
        title: "No Category",
        description: "Please select a category for your post.",
        variant: "destructive",
      })
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
        toast({
          title: "Post Created!",
          description: "Your post has been shared with the community.",
        })

        // Reset form
        setContent("")
        setSelectedCategory("")
        removeMedia()

        // Trigger refresh
        if (onPostCreated) {
          onPostCreated()
        }
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create post.",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("Submit error:", error)
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!profile) {
    return (
      <Card className="mb-8">
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Please log in to create posts.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mb-8 shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-semibold">Start a Conversation</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-start space-x-4">
            <Avatar className="mt-1 h-12 w-12">
              <AvatarImage src={profile.avatar_url || "/placeholder-user.jpg"} alt={profile.username} />
              <AvatarFallback className="text-lg">{profile.username?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={`What's on your mind, ${profile.username}?`}
                className="min-h-[120px] resize-none border-2 focus:border-primary"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Media Preview */}
          {mediaPreview && (
            <div className="relative group w-full max-h-96 overflow-hidden rounded-lg border-2 border-dashed border-muted-foreground/25">
              {mediaType === "image" && (
                <img
                  src={mediaPreview || "/placeholder.svg"}
                  alt="Media preview"
                  className="w-full h-auto object-contain max-h-96"
                />
              )}
              {mediaType === "video" && (
                <video src={mediaPreview} controls className="w-full h-auto object-contain max-h-96" />
              )}
              {mediaType === "audio" && (
                <div className="p-6 bg-muted/50 rounded-lg">
                  <audio src={mediaPreview} controls className="w-full" />
                  <p className="text-sm text-muted-foreground mt-2 text-center">Audio: {mediaFile?.name}</p>
                </div>
              )}
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                onClick={removeMedia}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting}
                className="flex items-center gap-2"
              >
                <ImagePlus className="h-4 w-4 text-blue-500" />
                Image
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting}
                className="flex items-center gap-2"
              >
                <Video className="h-4 w-4 text-red-500" />
                Video
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting}
                className="flex items-center gap-2"
              >
                <Mic className="h-4 w-4 text-green-500" />
                Audio
              </Button>
              <Input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*,video/*,audio/*"
                onChange={handleMediaChange}
                disabled={isSubmitting}
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Select value={selectedCategory} onValueChange={setSelectedCategory} required disabled={isSubmitting}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={String(category.id)}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary/90 px-8">
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                {isSubmitting ? "Posting..." : "Post"}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
