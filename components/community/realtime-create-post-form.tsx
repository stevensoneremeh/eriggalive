"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ImageIcon, VideoIcon, MusicIcon, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface Category {
  id: number
  name: string
  slug: string
  icon?: string
  color?: string
}

interface RealtimeCreatePostFormProps {
  categories?: Category[]
}

export function RealtimeCreatePostForm({ categories = [] }: RealtimeCreatePostFormProps) {
  const [content, setContent] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [user, setUser] = useState<any>(null)

  const supabase = createClient()
  const router = useRouter()

  // Get current user on component mount
  useState(() => {
    const getCurrentUser = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()
      if (authUser) {
        const { data: userProfile } = await supabase.from("users").select("*").eq("auth_user_id", authUser.id).single()

        setUser(userProfile)
      }
    }
    getCurrentUser()
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast.error("Please log in to create a post")
      router.push("/login")
      return
    }

    if (!content.trim() && !mediaFile) {
      toast.error("Please provide content or upload media")
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
        toast.success("Post created successfully!")
        setContent("")
        setSelectedCategory("")
        setMediaFile(null)
        // Reset file input
        const fileInput = document.getElementById("media-upload") as HTMLInputElement
        if (fileInput) fileInput.value = ""
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB")
        return
      }
      setMediaFile(file)
    }
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground mb-4">Please log in to create a post</p>
          <Button onClick={() => router.push("/login")}>Log In</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.avatar_url || "/placeholder.svg"} />
            <AvatarFallback>{user?.username?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
          </Avatar>
          Create a Post
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    <span className="flex items-center gap-2">
                      {category.icon && <span>{category.icon}</span>}
                      {category.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Textarea
              placeholder="What's on your mind?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[100px] resize-none"
              maxLength={2000}
            />
            <div className="text-right text-sm text-muted-foreground mt-1">{content.length}/2000</div>
          </div>

          {mediaFile && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {mediaFile.type.startsWith("image/") && <ImageIcon className="h-4 w-4" />}
                  {mediaFile.type.startsWith("video/") && <VideoIcon className="h-4 w-4" />}
                  {mediaFile.type.startsWith("audio/") && <MusicIcon className="h-4 w-4" />}
                  <span className="text-sm">{mediaFile.name}</span>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => setMediaFile(null)}>
                  Remove
                </Button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                id="media-upload"
                type="file"
                accept="image/*,video/*,audio/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById("media-upload")?.click()}
              >
                <ImageIcon className="h-4 w-4 mr-2" />
                Add Media
              </Button>
            </div>

            <Button type="submit" disabled={isSubmitting || (!content.trim() && !mediaFile) || !selectedCategory}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isSubmitting ? "Posting..." : "Post"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
