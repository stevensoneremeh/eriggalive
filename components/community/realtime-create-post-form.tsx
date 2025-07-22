"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Plus, ImageIcon, Video, Link, Smile, Star, Crown, Zap, Flame } from "lucide-react"
import { cn } from "@/lib/utils"

interface Category {
  id: string
  name: string
  slug: string
  color: string
  icon: string
}

interface RealtimeCreatePostFormProps {
  categories: Category[]
}

const TIER_ICONS = {
  grassroot: Star,
  pioneer: Zap,
  elder: Crown,
  blood_brotherhood: Flame,
}

const TIER_COLORS = {
  grassroot: "text-green-500",
  pioneer: "text-blue-500",
  elder: "text-purple-500",
  blood_brotherhood: "text-red-500",
}

export function RealtimeCreatePostForm({ categories }: RealtimeCreatePostFormProps) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const { user, profile } = useAuth()
  const { toast } = useToast()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!profile) {
      toast({
        title: "Sign in required",
        description: "Please sign in to create a post",
        variant: "destructive",
      })
      return
    }

    if (!title.trim() || !content.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide both a title and content for your post",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)

      const postData = {
        title: title.trim(),
        content: content.trim(),
        user_id: profile.id,
        category_id: selectedCategory || null,
        is_published: true,
        is_deleted: false,
        vote_count: 0,
        comment_count: 0,
        media_urls: [],
      }

      const { data, error } = await supabase.from("community_posts").insert(postData).select().single()

      if (error) throw error

      // Reset form
      setTitle("")
      setContent("")
      setSelectedCategory("")
      setIsExpanded(false)

      toast({
        title: "Post created!",
        description: "Your post has been shared with the community",
      })
    } catch (error) {
      console.error("Error creating post:", error)
      toast({
        title: "Error",
        description: "Failed to create post. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getTierIcon = (tier: string) => {
    const Icon = TIER_ICONS[tier as keyof typeof TIER_ICONS] || Star
    return Icon
  }

  const getTierColor = (tier: string) => {
    return TIER_COLORS[tier as keyof typeof TIER_COLORS] || "text-gray-500"
  }

  if (!profile) {
    return (
      <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
        <CardContent className="p-8 text-center">
          <div className="h-16 w-16 rounded-full bg-gray-200 dark:bg-gray-700 mx-auto mb-4 flex items-center justify-center">
            <Plus className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Share with the Community</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">Sign in to create posts and connect with fellow fans</p>
          <Button onClick={() => (window.location.href = "/login")}>Sign In to Post</Button>
        </CardContent>
      </Card>
    )
  }

  const TierIcon = getTierIcon(profile.tier)
  const tierColor = getTierColor(profile.tier)

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 ring-2 ring-white dark:ring-gray-800">
            <AvatarImage src={profile.avatar_url || "/placeholder.svg"} />
            <AvatarFallback>{profile.username.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{profile.full_name || profile.username}</span>
              <TierIcon className={cn("h-4 w-4", tierColor)} />
              <Badge variant="outline" className={cn("text-xs", tierColor)}>
                {profile.tier.charAt(0).toUpperCase() + profile.tier.slice(1)}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">Share your thoughts with the community</p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Quick Post Input */}
          {!isExpanded ? (
            <div
              onClick={() => setIsExpanded(true)}
              className="w-full p-4 text-left text-gray-500 bg-gray-100 dark:bg-gray-800 rounded-lg cursor-text hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              What's on your mind?
            </div>
          ) : (
            <>
              {/* Title Input */}
              <div className="space-y-2">
                <Input
                  placeholder="Give your post a catchy title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-lg font-semibold border-0 bg-transparent px-0 focus-visible:ring-0 placeholder:text-gray-400"
                  maxLength={200}
                />
                <div className="text-xs text-gray-400 text-right">{title.length}/200</div>
              </div>

              {/* Content Input */}
              <div className="space-y-2">
                <Textarea
                  placeholder="Share your thoughts, experiences, or ask questions..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[120px] border-0 bg-transparent px-0 focus-visible:ring-0 placeholder:text-gray-400 resize-none"
                  maxLength={2000}
                />
                <div className="text-xs text-gray-400 text-right">{content.length}/2000</div>
              </div>

              {/* Category Selection */}
              {categories.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Category (optional)</label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose a category..." />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                            {category.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Media Options (Future Enhancement) */}
              <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                <Button type="button" variant="ghost" size="sm" disabled>
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Photo
                </Button>
                <Button type="button" variant="ghost" size="sm" disabled>
                  <Video className="h-4 w-4 mr-2" />
                  Video
                </Button>
                <Button type="button" variant="ghost" size="sm" disabled>
                  <Link className="h-4 w-4 mr-2" />
                  Link
                </Button>
                <Button type="button" variant="ghost" size="sm" disabled>
                  <Smile className="h-4 w-4 mr-2" />
                  Emoji
                </Button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setIsExpanded(false)
                    setTitle("")
                    setContent("")
                    setSelectedCategory("")
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!title.trim() || !content.trim() || isSubmitting}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-lg"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Posting...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Share Post
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
