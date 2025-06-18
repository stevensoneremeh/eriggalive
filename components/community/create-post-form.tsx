"use client"

import type React from "react"

import { useState, useRef, useTransition } from "react"
import { useFormState, useFormStatus } from "react-dom"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/contexts/auth-context"
import { createCommunityPostAction, searchUsersForMention } from "@/lib/community-actions"
import { useToast } from "@/components/ui/use-toast"
import type { CommunityCategory } from "@/types/database"
import { ImagePlus, Video, Mic, Send, Loader2, X } from "lucide-react"
import { MentionsInput, Mention, type SuggestionDataItem } from "react-mentions" // Using react-mentions
import styles from "./mention-input.module.css" // Custom styles for react-mentions

interface CreatePostFormProps {
  categories: CommunityCategory[]
  userId: string
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="bg-primary hover:bg-primary/90 text-primary-foreground">
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
      Post
    </Button>
  )
}

export function CreatePostForm({ categories, userId }: CreatePostFormProps) {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [formState, formAction] = useFormState(createCommunityPostAction, { success: false, error: null })
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

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!content.trim() && !mediaFile) {
      toast({ title: "Empty Post", description: "Please write something or add media.", variant: "destructive" })
      return
    }
    if (!selectedCategory) {
      toast({ title: "No Category", description: "Please select a category for your post.", variant: "destructive" })
      return
    }

    const formData = new FormData(event.currentTarget)
    formData.set("content", content) // Ensure content from MentionsInput is included
    // mediaFile is already part of formData if input name="mediaFile"

    startTransition(async () => {
      const result = await createCommunityPostAction(formData)
      if (result.success) {
        toast({ title: "Post Created!", description: "Your post has been shared with the community." })
        setContent("")
        setSelectedCategory("")
        removeMedia()
        // Optionally, trigger a feed refresh or add post to feed optimistically
      } else {
        toast({ title: "Error", description: result.error || "Failed to create post.", variant: "destructive" })
      }
    })
  }

  const fetchUsers = async (query: string, callback: (data: SuggestionDataItem[]) => void) => {
    if (!query) return
    const users = await searchUsersForMention(query)
    callback(users.map((user) => ({ id: user.id, display: user.display, ...user })))
  }

  if (!profile) return null // Or a login prompt

  return (
    <Card className="mb-6 shadow-md">
      <CardContent className="p-4">
        <form action={formAction} onSubmit={handleFormSubmit} className="space-y-4">
          <div className="flex items-start space-x-3">
            <Avatar className="mt-1">
              <AvatarImage src={profile.avatar_url || "/placeholder-user.jpg"} alt={profile.username} />
              <AvatarFallback>{profile.username?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <input type="hidden" name="userId" value={userId} />
              <Label htmlFor="content" className="sr-only">
                What's on your mind?
              </Label>
              <MentionsInput
                id="content"
                name="content" // This name might not be picked up by formData if not a standard input. We'll handle it.
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={`What's on your mind, ${profile.username}? Use @ to mention users.`}
                className={styles.mentionsInput} // Apply custom styling
                classNames={styles} // For internal elements
                a11ySuggestionsListLabel="Suggested mentions"
              >
                <Mention
                  trigger="@"
                  data={fetchUsers}
                  className={styles.mention}
                  appendSpaceOnAdd
                  renderSuggestion={(suggestion, search, highlightedDisplay, index, focused) => (
                    <div className={`p-2 hover:bg-muted ${focused ? "bg-muted" : ""} flex items-center gap-2`}>
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={(suggestion as any).avatar_url || "/placeholder-user.jpg"} />
                        <AvatarFallback>{(suggestion.display || "").charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-sm">{(suggestion as any).full_name || suggestion.display}</div>
                        <div className="text-xs text-muted-foreground">@{suggestion.display}</div>
                      </div>
                    </div>
                  )}
                />
              </MentionsInput>
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
                title="Add Image"
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
                name="mediaFile"
                ref={fileInputRef}
                className="hidden"
                accept="image/*,video/*,audio/*"
                onChange={handleMediaChange}
              />
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Select name="categoryId" value={selectedCategory} onValueChange={setSelectedCategory} required>
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
              <SubmitButton />
            </div>
          </div>
          {formState?.error && <p className="text-sm text-destructive">{formState.error}</p>}
        </form>
      </CardContent>
    </Card>
  )
}
