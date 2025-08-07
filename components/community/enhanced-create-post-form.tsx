"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { Send, Hash, AtSign, Image, Smile } from 'lucide-react'

interface Category {
  id: number
  name: string
  slug: string
  description?: string
  is_active: boolean
}

interface EnhancedCreatePostFormProps {
  categories: Category[]
  onPostCreated: (post: any) => void
}

export function EnhancedCreatePostForm({ categories, onPostCreated }: EnhancedCreatePostFormProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [content, setContent] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to create a post.",
        variant: "destructive",
      })
      return
    }

    if (!content.trim() || !selectedCategory) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const hashtags = content.match(/#\w+/g)?.map(tag => tag.slice(1)) || []
      
      const { data, error } = await supabase
        .from("community_posts")
        .insert({
          user_id: user.id,
          category_id: parseInt(selectedCategory),
          content: content.trim(),
          hashtags,
          is_published: true
        })
        .select(`
          *,
          users!inner (
            id, username, full_name, avatar_url, tier
          ),
          community_categories!inner (
            id, name, slug, color, icon
          )
        `)
        .single()

      if (error) throw error

      toast({
        title: "Post Created! 🎉",
        description: "Your post has been shared with the community.",
      })

      onPostCreated(data)
      setContent("")
      setSelectedCategory("")
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
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground mb-4">Sign in to share your thoughts with the community</p>
          <Button asChild>
            <a href="/login">Sign In</a>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={user.user_metadata?.avatar_url || "/placeholder-user.jpg"} />
            <AvatarFallback>
              {user.user_metadata?.full_name?.charAt(0) || user.email?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-lg">Share Your Thoughts</CardTitle>
            <p className="text-sm text-muted-foreground">
              What's on your mind about Erigga's music?
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your thoughts... Use #hashtags and @mentions!"
              className="min-h-[120px] resize-none"
              maxLength={2000}
            />
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <Hash className="h-4 w-4" />
                  Hashtags
                </span>
                <span className="flex items-center gap-1">
                  <AtSign className="h-4 w-4" />
                  Mentions
                </span>
              </div>
              <span className={content.length > 1800 ? "text-destructive" : ""}>
                {content.length}/2000
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    <div className="flex items-center gap-2">
                      <span>📂</span>
                      <span>{category.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
              >
                <Image className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
              >
                <Smile className="h-4 w-4" />
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !content.trim() || !selectedCategory}
                className="px-6"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Posting...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Send className="h-4 w-4" />
                    Post
                  </div>
                )}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
