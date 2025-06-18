"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MediaUploader } from "@/components/media-uploader"
import { useAuth } from "@/contexts/auth-context"
import { createClient } from "@/lib/supabase/client"
import { extractAndValidateUrls } from "@/utils/media-upload"

interface Category {
  id: number
  name: string
  slug: string
  required_tier: string
}

interface CreatePostProps {
  categories: Category[]
  onPostCreated?: () => void
}

export function CreatePost({ categories, onPostCreated }: CreatePostProps) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [category, setCategory] = useState("")
  const [mediaResults, setMediaResults] = useState<any[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user, profile } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  const handleMediaUpload = (results: any[]) => {
    setMediaResults(results.filter((r) => r.success))
  }

  const submitPost = async () => {
    if (!user || !profile || !content.trim()) return

    try {
      setIsSubmitting(true)

      // Check for external links and sanitize
      const { hasExternalLinks, sanitizedText } = extractAndValidateUrls(content)
      const finalContent = hasExternalLinks ? sanitizedText : content

      // Prepare media arrays
      const mediaUrls = mediaResults.map((r) => r.fileUrl)
      const mediaTypes = mediaResults.map((r) => r.metadata?.contentType || "unknown")
      const thumbnailUrls = mediaResults.filter((r) => r.thumbnailUrl).map((r) => r.thumbnailUrl)

      // Insert post
      const { data, error } = await supabase
        .from("community_posts")
        .insert({
          user_id: profile.id,
          title: title.trim() || null,
          content: finalContent,
          category,
          media_urls: mediaUrls,
          media_types: mediaTypes,
          thumbnail_urls: thumbnailUrls,
        })
        .select()
        .single()

      if (error) throw error

      // Reset form
      setTitle("")
      setContent("")
      setCategory("")
      setMediaResults([])

      // Notify parent component
      if (onPostCreated) {
        onPostCreated()
      }
    } catch (error) {
      console.error("Error creating post:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!user || !profile) {
    return (
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="text-center py-4">
            <p className="text-muted-foreground mb-2">Sign in to create a post</p>
            <Button asChild className="bg-orange-500 hover:bg-orange-600 text-black">
              <a href="/login?redirect=community">Sign In</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="flex gap-3">
          <Avatar className="h-10 w-10 border-2 border-orange-500/50">
            <AvatarImage src={profile.avatar_url || "/placeholder.svg?height=40&width=40&text=User"} />
            <AvatarFallback>{profile.username?.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-4">
            <Input
              placeholder="Title (optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="font-medium"
            />
            <Textarea
              placeholder="What's on your mind?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[120px] resize-none"
            />
            <div className="flex flex-col sm:flex-row gap-4">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem
                      key={cat.id}
                      value={cat.slug}
                      disabled={
                        (cat.required_tier === "pioneer" && profile.tier === "grassroot") ||
                        (cat.required_tier === "elder" &&
                          (profile.tier === "grassroot" || profile.tier === "pioneer")) ||
                        (cat.required_tier === "blood" && profile.tier !== "blood")
                      }
                    >
                      {cat.name}
                      {cat.required_tier !== "grassroot" && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          ({cat.required_tier.charAt(0).toUpperCase() + cat.required_tier.slice(1)}+)
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <MediaUploader userId={profile.id} onUploadComplete={handleMediaUpload} maxFiles={5} />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button
          onClick={submitPost}
          disabled={!content.trim() || isSubmitting}
          className="bg-orange-500 hover:bg-orange-600 text-black"
        >
          {isSubmitting ? "Posting..." : "Post"}
        </Button>
      </CardFooter>
    </Card>
  )
}
