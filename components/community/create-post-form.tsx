
"use client"

import type React from "react"
import { useState, useRef, useCallback } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { ImagePlus, Video, Mic, Send, Loader2, X, AtSign } from "lucide-react"
import { createCommunityPostAction, searchUsersForMention } from "@/lib/community-actions"

interface CreatePostFormProps {
  categories: Array<{ id: number; name: string; slug: string }>
  userId: string
  onPostCreated?: (post: any) => void
}

export function CreatePostForm({ categories, userId, onPostCreated }: CreatePostFormProps) {
  const { toast } = useToast()

  const [content, setContent] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [mediaPreview, setMediaPreview] = useState<string | null>(null)
  const [mediaType, setMediaType] = useState<"image" | "video" | "audio" | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showMentions, setShowMentions] = useState(false)
  const [mentionQuery, setMentionQuery] = useState("")
  const [mentionUsers, setMentionUsers] = useState<any[]>([])

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleMediaChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (file) {
        // Validate file size (50MB max)
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
    },
    [toast],
  )

  const removeMedia = useCallback(() => {
    setMediaFile(null)
    setMediaPreview(null)
    setMediaType(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [])

  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value
    setContent(newContent)

    // Check for @ mentions
    const lastAtIndex = newContent.lastIndexOf("@")
    if (lastAtIndex !== -1) {
      const textAfterAt = newContent.slice(lastAtIndex + 1)
      const spaceIndex = textAfterAt.indexOf(" ")
      const query = spaceIndex === -1 ? textAfterAt : textAfterAt.slice(0, spaceIndex)

      if (query.length >= 2) {
        setMentionQuery(query)
        setShowMentions(true)
        searchUsers(query)
      } else {
        setShowMentions(false)
      }
    } else {
      setShowMentions(false)
    }
  }, [])

  const searchUsers = async (query: string) => {
    try {
      const users = await searchUsersForMention(query)
      setMentionUsers(users)
    } catch (error) {
      console.error("Error searching users:", error)
    }
  }

  const insertMention = (user: any) => {
    const lastAtIndex = content.lastIndexOf("@")
    const beforeAt = content.slice(0, lastAtIndex)
    const afterMention = content.slice(lastAtIndex + mentionQuery.length + 1)
    const newContent = `${beforeAt}@${user.label} ${afterMention}`
    setContent(newContent)
    setShowMentions(false)
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

        // Notify parent component
        if (onPostCreated && result.post) {
          onPostCreated(result.post)
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

  return (
    <Card className="mb-6 shadow-md">
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-start space-x-3">
            <Avatar className="mt-1">
              <AvatarImage src="/placeholder-user.jpg" alt="You" />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <div className="flex-1 relative">
              <Textarea
                value={content}
                onChange={handleContentChange}
                placeholder="What's on your mind?"
                className="min-h-[100px] resize-none"
                disabled={isSubmitting}
              />

              {/* Mention dropdown */}
              {showMentions && mentionUsers.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-background border rounded-md shadow-lg z-50 max-h-48 overflow-y-auto">
                  {mentionUsers.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      className="w-full px-3 py-2 text-left hover:bg-muted flex items-center space-x-2"
                      onClick={() => insertMention(user)}
                    >
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={user.avatar || "/placeholder-user.jpg"} alt={user.label} />
                        <AvatarFallback>{user.label.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-sm">{user.label}</div>
                        <div className="text-xs text-muted-foreground">{user.name}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Media Preview */}
          {mediaPreview && (
            <div className="relative group w-full max-h-96 overflow-hidden rounded-lg border">
              {mediaType === "image" && (
                <img
                  src={mediaPreview}
                  alt="Media preview"
                  className="w-full h-auto object-contain max-h-96"
                />
              )}
              {mediaType === "video" && (
                <video src={mediaPreview} controls className="w-full h-auto object-contain max-h-96" />
              )}
              {mediaType === "audio" && (
                <div className="p-4 bg-muted rounded-lg">
                  <audio src={mediaPreview} controls className="w-full" />
                  <p className="text-sm text-muted-foreground mt-2">Audio: {mediaFile?.name}</p>
                </div>
              )}
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

          {/* Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                title="Add Media"
                disabled={isSubmitting}
              >
                <ImagePlus className="h-5 w-5 text-blue-500" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                title="Mention User"
                disabled={isSubmitting}
                onClick={() => {
                  setContent(content + "@")
                }}
              >
                <AtSign className="h-5 w-5 text-purple-500" />
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

              <Button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary/90">
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
