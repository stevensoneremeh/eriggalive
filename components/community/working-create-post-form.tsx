"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { UserTierBadge } from "@/components/user-tier-badge"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { Send, Hash } from "lucide-react"

interface CreatePostFormProps {
  onPostCreated?: (post: any) => void
}

export function WorkingCreatePostForm({ onPostCreated }: CreatePostFormProps) {
  const [content, setContent] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [categories, setCategories] = useState<any[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const { user, profile } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/community/categories")
      const data = await response.json()

      if (data.success) {
        setCategories(data.categories)
      } else {
        throw new Error(data.error || "Failed to fetch categories")
      }
    } catch (error) {
      console.error("Error fetching categories:", error)
      toast({
        title: "Error",
        description: "Failed to load categories.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to create a post.",
        variant: "destructive",
      })
      return
    }

    if (!content.trim() || !categoryId) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Extract hashtags from content
      const hashtags = content.match(/#\w+/g)?.map((tag) => tag.slice(1)) || []

      const response = await fetch("/api/community/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: content.trim(),
          categoryId,
          hashtags,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Post Created! 🎉",
          description: "Your post has been shared with the community.",
        })

        // Reset form
        setContent("")
        setCategoryId("")

        // Call callback if provided
        if (onPostCreated) {
          onPostCreated(data.post)
        }

        // Refresh page to show new post
        router.refresh()
      } else {
        throw new Error(data.error || "Failed to create post")
      }
    } catch (error) {
      console.error("Error creating post:", error)
      toast({
        title: "Failed to Create Post",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!user) {
    return (
      <Card className="shadow-lg border-0 bg-white dark:bg-gray-800">
        <CardContent className="p-6 text-center">
          <p className="text-gray-500">Please login to create a post.</p>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card className="shadow-lg border-0 bg-white dark:bg-gray-800">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="flex items-center space-x-4">
              <div className="rounded-full bg-gray-300 h-12 w-12"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-300 rounded w-24"></div>
                <div className="h-3 bg-gray-300 rounded w-16"></div>
              </div>
            </div>
            <div className="h-32 bg-gray-300 rounded"></div>
            <div className="h-10 bg-gray-300 rounded w-48"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-lg border-0 bg-white dark:bg-gray-800">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={profile?.avatar_url || "/placeholder-user.jpg"} alt={profile?.username} />
            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold">
              {profile?.username?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">{profile?.full_name || profile?.username}</span>
              <UserTierBadge tier={profile?.tier} size="sm" />
            </div>
            <p className="text-sm text-gray-500">@{profile?.username}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind? Share your thoughts with the community... Use #hashtags and @mentions!"
              className="min-h-[120px] resize-none border-0 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500"
              maxLength={2000}
              required
            />
            <div className="flex justify-between items-center mt-2 text-sm text-gray-500">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <Hash className="h-4 w-4" />
                  Use hashtags
                </span>
              </div>
              <span>{content.length}/2000</span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <Select value={categoryId} onValueChange={setCategoryId} required>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    <div className="flex items-center gap-2">
                      <span>{category.icon}</span>
                      <span>{category.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button type="submit" disabled={isSubmitting || !content.trim() || !categoryId} className="px-8">
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Posting...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  Share Post
                </div>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
