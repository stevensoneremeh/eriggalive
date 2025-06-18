"use client"

import type React from "react"

import { useState, useRef, useTransition } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/contexts/auth-context"
import { createCommunityPostAction } from "@/lib/community-actions-fixed"
import { useToast } from "@/components/ui/use-toast"
import type { CommunityCategory } from "@/types/database"
import { ImagePlus, Video, Mic, Send, Loader2, X } from "lucide-react"
import { RichTextEditor } from "./rich-text-editor"

interface CreatePostFormProps {
  categories: CommunityCategory[]
  userId: string
}

export function CreatePostForm({ categories, userId }: CreatePostFormProps) {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [content, setContent] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [mediaPreview, setMediaPreview] = useState<string | null>(null)
  const [mediaType, setMediaType] = useState<"image" | "video" | "audio" | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isPending, startTransition] = useTransition()

  const handleMediaChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setMediaFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setMediaPreview(reader.result as string)
      }
      reader.readAsDataURL(file)

      if (file.type.startsWith("image/")) setMediaType("image")
      else if (file.type.startsWith("video/")) setMediaType("video")
      else if (file.type.startsWith("audio/")) setMediaType("audio")
      else setMediaType(null)
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

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
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

    const formData = new FormData()
    formData.set("content", content)
    formData.set("categoryId", selectedCategory)
    if (mediaFile) {
      formData.set("mediaFile", mediaFile)
    }

    startTransition(async () => {
      try {
        const result = await createCommunityPostAction(formData)

        if (result.success) {
          toast({
            title: "Post Created!",
            description: "Your post has been shared with the community.",
          })

          // Reset form
          setContent("")
          setSelectedCategory("")
          removeMedia()
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
      }
    })
  }

  if (!profile) {
    return (
      <Card className="mb-6">
        <CardContent className="p-4 text-center">
          <p className="text-muted-foreground">Please log in to create posts.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mb-6 shadow-md">
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-start space-x-3">
            <Avatar className="mt-1">
              <AvatarImage src={profile.avatar_url || "/placeholder-user.jpg"} alt={profile.username} />
              <AvatarFallback>{profile.username?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <RichTextEditor
                content={content}
                onChange={setContent}
                placeholder={`What's on your mind, ${profile.username}?`}
              />
            </div>
          </div>

          {mediaPreview && (
            <div className="relative group w-full max-h-96 overflow-hidden rounded-lg border">
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
              {mediaType === "audio" && <audio src={mediaPreview} controls className="w-full" />}
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={removeMedia}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                title="Add Media"
              >
                <ImagePlus className="h-5 w-5 text-blue-500" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                title="Add Video"
              >
                <Video className="h-5 w-5 text-red-500" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                title="Add Audio"
              >
                <Mic className="h-5 w-5 text-green-500" />
              </Button>
              <Input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*,video/*,audio/*"
                onChange={handleMediaChange}
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Select value={selectedCategory} onValueChange={setSelectedCategory} required>
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

              <Button type="submit" disabled={isPending} className="bg-primary hover:bg-primary/90">
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Post
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
