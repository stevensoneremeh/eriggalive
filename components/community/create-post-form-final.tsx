"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { createCommunityPostAction } from "@/lib/community-actions"
import { Loader2, Plus } from "lucide-react"

interface Category {
  id: number
  name: string
  slug: string
  color?: string
  icon?: string
}

interface CreatePostFormProps {
  categories: Category[]
  profile?: any
}

export function CreatePostFormFinal({ categories, profile }: CreatePostFormProps) {
  const [content, setContent] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!content.trim() || !categoryId) {
      toast({
        title: "Missing information",
        description: "Please provide content and select a category.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    const formData = new FormData()
    formData.append("content", content.trim())
    formData.append("categoryId", categoryId)

    try {
      const result = await createCommunityPostAction(formData)

      if (result.success) {
        toast({
          title: "Post created successfully!",
          description: "Your post has been shared with the community.",
        })
        setContent("")
        setCategoryId("")
        router.refresh()
      } else {
        toast({
          title: "Failed to create post",
          description: result.error || "Something went wrong.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Plus className="h-5 w-5 text-blue-600" />
          Share Your Thoughts
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind? Share your thoughts about Erigga's music, use #hashtags, and connect with the community..."
            className="min-h-[120px] border-gray-200 focus:border-blue-500 focus:ring-blue-500 resize-none"
            required
          />
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <Select value={categoryId} onValueChange={setCategoryId} required>
              <SelectTrigger className="w-full sm:w-64 border-gray-200 focus:border-blue-500">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    <span className="flex items-center gap-2">
                      {category.icon} {category.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="submit"
              disabled={isSubmitting || !content.trim() || !categoryId}
              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium px-8"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Posting...
                </>
              ) : (
                "Share Post"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

// Export as CreatePostForm for backward compatibility
export const CreatePostForm = CreatePostFormFinal
