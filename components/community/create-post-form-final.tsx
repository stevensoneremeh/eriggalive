"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createPost } from "@/lib/community-actions"
import { toast } from "sonner"

interface CreatePostFormProps {
  categories: Array<{ id: number; name: string }>
}

export function CreatePostForm({ categories }: CreatePostFormProps) {
  const [content, setContent] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [isPending, startTransition] = useTransition()

  const handleSubmit = async (formData: FormData) => {
    startTransition(async () => {
      const result = await createPost(formData)

      if (result.success) {
        setContent("")
        setCategoryId("")
        toast.success("Post created successfully!")
      } else {
        toast.error(result.error || "Failed to create post")
      }
    })
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Create a Post</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          <div>
            <Select name="categoryId" value={categoryId} onValueChange={setCategoryId} required>
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

          <div>
            <Textarea
              name="content"
              placeholder="What's on your mind? Use #hashtags to categorize your post..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[120px]"
              required
            />
          </div>

          <Button type="submit" disabled={isPending || !content.trim() || !categoryId}>
            {isPending ? "Posting..." : "Post"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

// Default export for compatibility
export default CreatePostForm
