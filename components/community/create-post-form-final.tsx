"use client"

import type React from "react"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Send } from "lucide-react"
import { createPost } from "@/lib/community-actions-final"
import { toast } from "sonner"

interface Category {
  id: number
  name: string
  color?: string
}

interface CreatePostFormProps {
  categories: Category[]
}

export function CreatePostForm({ categories = [] }: CreatePostFormProps) {
  const [content, setContent] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("none")
  const [isPending, startTransition] = useTransition()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!content.trim()) {
      toast.error("Please enter some content for your post")
      return
    }

    startTransition(async () => {
      try {
        const result = await createPost(content, selectedCategory !== "none" ? Number(selectedCategory) : undefined)

        if (result.success) {
          setContent("")
          setSelectedCategory("none")
          toast.success("Post created successfully!")
        } else {
          toast.error(result.error || "Failed to create post")
        }
      } catch (error) {
        console.error("Error creating post:", error)
        toast.error("An unexpected error occurred")
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create a Post</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            placeholder="What's on your mind?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[100px] resize-none"
            disabled={isPending}
          />

          {categories.length > 0 && (
            <Select value={selectedCategory} onValueChange={setSelectedCategory} disabled={isPending}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No category</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={isPending || !content.trim()}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
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

// Named export for compatibility
