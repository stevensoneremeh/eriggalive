"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { UserTierBadge } from "@/components/user-tier-badge"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Send, Hash } from "lucide-react"

interface CreatePostFormProps {
  categories: any[]
  profile: any
}

export function CreatePostForm({ categories, profile }: CreatePostFormProps) {
  const [content, setContent] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

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

      // Create post
      const { data, error } = await supabase
        .from("community_posts")
        .insert({
          user_id: profile.id,
          category_id: Number.parseInt(categoryId),
          content: content.trim(),
          hashtags,
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      // Update user post count
      await supabase
        .from("users")
        .update({
          posts_count: profile.posts_count + 1,
        })
        .eq("id", profile.id)

      toast({
        title: "Post Created! 🎉",
        description: "Your post has been shared with the community.",
      })

      // Reset form
      setContent("")
      setCategoryId("")

      // Refresh page to show new post
      router.refresh()
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

  const getTierColor = (tier: string) => {
    const colors = {
      admin: "bg-red-500",
      blood_brotherhood: "bg-red-600",
      elder: "bg-purple-500",
      pioneer: "bg-blue-500",
      grassroot: "bg-green-500",
    }
    return colors[tier as keyof typeof colors] || "bg-gray-500"
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
              <span className="font-semibold">{profile?.full_name}</span>
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
