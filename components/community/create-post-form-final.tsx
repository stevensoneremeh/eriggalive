"use client"

import type React from "react"

import { useState } from "react"
import { createCommunityPostAction } from "@/lib/community-actions-final-fix"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Send, Loader2, AlertCircle, CheckCircle } from "lucide-react"
import { toast } from "sonner"

interface Category {
  id: number
  name: string
  slug: string
}

interface CreatePostFormProps {
  categories: Category[]
  onPostCreated?: (post: any) => void
}

export function CreatePostForm({ categories, onPostCreated }: CreatePostFormProps) {
  const [content, setContent] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!content.trim()) {
      setError("Content is required")
      return
    }

    if (!selectedCategory) {
      setError("Please select a category")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("content", content.trim())
      formData.append("categoryId", selectedCategory)

      const result = await createCommunityPostAction(formData)

      if (result.success) {
        setContent("")
        setSelectedCategory("")
        setSuccess(true)
        toast.success("Post created successfully!")

        if (onPostCreated && result.post) {
          onPostCreated(result.post)
        }

        // Reset success state after delay
        setTimeout(() => setSuccess(false), 3000)
      } else {
        setError(result.error || "Failed to create post")
        toast.error(result.error || "Failed to create post")
      }
    } catch (error: any) {
      console.error("Error creating post:", error)
      setError(error.message || "Failed to create post")
      toast.error(error.message || "Failed to create post")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full mb-6">
      <CardHeader>
        <CardTitle>Create Post</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Alert */}
          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">Post created successfully!</AlertDescription>
            </Alert>
          )}

          {/* Content Input */}
          <div className="space-y-2">
            <Textarea
              placeholder="What's on your mind? Share your thoughts with the community..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[100px] resize-none"
              disabled={isSubmitting}
              maxLength={2000}
            />
            <div className="flex justify-between items-center text-sm text-gray-500">
              <span>No external links allowed for security</span>
              <span>{content.length}/2000</span>
            </div>
          </div>

          {/* Category Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Category</label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isSubmitting || !content.trim() || !selectedCategory}
              className="min-w-[120px]"
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
