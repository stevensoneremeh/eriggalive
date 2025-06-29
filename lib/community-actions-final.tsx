"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// Types for better type safety
interface ActionResult<T = any> {
  success: boolean
  error?: string
  data?: T
}

// Helper function to get user's internal ID
async function getUserInternalId() {
  const supabase = await createClient()

  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !authUser) {
    throw new Error("Authentication required")
  }

  // Try to get user's internal ID from users table
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("id")
    .or(`auth_user_id.eq.${authUser.id},id.eq.${authUser.id}`)
    .single()

  if (userError || !userData) {
    throw new Error("User profile not found")
  }

  return { authUser, internalUserId: userData.id }
}

// Helper function to extract hashtags from content
function extractHashtags(content: string): string[] {
  const hashtagRegex = /#[\w]+/g
  const matches = content.match(hashtagRegex)
  return matches ? matches.map((tag) => tag.toLowerCase()) : []
}

/**
 * Create a new community post
 */
export async function createPost(formData: FormData): Promise<ActionResult> {
  try {
    const { internalUserId } = await getUserInternalId()
    const supabase = await createClient()

    // Extract form data
    const content = formData.get("content") as string
    const categoryId = formData.get("categoryId") as string
    const mediaFile = formData.get("mediaFile") as File | null

    if (!content?.trim()) {
      return { success: false, error: "Content is required" }
    }

    // Extract hashtags from content
    const hashtags = extractHashtags(content)

    // Handle media upload if present
    let mediaUrl: string | null = null
    let mediaType: string | null = null

    if (mediaFile && mediaFile.size > 0) {
      const fileExt = mediaFile.name.split(".").pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("community-media")
        .upload(fileName, mediaFile)

      if (uploadError) {
        console.error("Media upload error:", uploadError)
      } else {
        const {
          data: { publicUrl },
        } = supabase.storage.from("community-media").getPublicUrl(fileName)

        mediaUrl = publicUrl
        mediaType = mediaFile.type.startsWith("image/")
          ? "image"
          : mediaFile.type.startsWith("video/")
            ? "video"
            : "audio"
      }
    }

    // Insert the post
    const { data: post, error: postError } = await supabase
      .from("community_posts")
      .insert({
        user_id: internalUserId,
        content: content.trim(),
        category_id: categoryId ? Number.parseInt(categoryId) : null,
        hashtags: hashtags.length > 0 ? hashtags : null,
        media_url: mediaUrl,
        media_type: mediaType,
        is_published: true,
      })
      .select(`
        id,
        content,
        created_at,
        hashtags,
        media_url,
        media_type,
        vote_count,
        comment_count
      `)
      .single()

    if (postError) {
      console.error("Post creation error:", postError)
      return { success: false, error: "Failed to create post" }
    }

    // Update category post count if category was specified
    if (categoryId) {
      await supabase.rpc("increment_category_post_count", {
        category_id: Number.parseInt(categoryId),
      })
    }

    // Update user's post count
    await supabase.rpc("increment_user_post_count", {
      user_id: internalUserId,
    })

    revalidatePath("/community")
    return { success: true, data: post }
  } catch (error) {
    console.error("Create post error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

/**
 * Vote on a post using the handle_post_vote_safe RPC
 */
export async function voteOnPost(postId: number): Promise<ActionResult> {
  try {
    const { internalUserId } = await getUserInternalId()
    const supabase = await createClient()

    if (!postId || postId <= 0) {
      return { success: false, error: "Invalid post ID" }
    }

    // Call the RPC function with 100 coins
    const { data, error } = await supabase.rpc("handle_post_vote_safe", {
      p_post_id: postId,
      p_user_id: internalUserId,
      p_coin_amount: 100,
    })

    if (error) {
      console.error("Vote RPC error:", error)
      return { success: false, error: "Failed to process vote" }
    }

    revalidatePath("/community")
    return {
      success: true,
      data: {
        voted: data?.voted || false,
        newVoteCount: data?.vote_count || 0,
        coinsSpent: data?.coins_spent || 0,
      },
    }
  } catch (error) {
    console.error("Vote on post error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

/**
 * Toggle bookmark status for a post
 */
export async function bookmarkPost(postId: number): Promise<ActionResult<{ bookmarked: boolean }>> {
  try {
    const { internalUserId } = await getUserInternalId()
    const supabase = await createClient()

    if (!postId || postId <= 0) {
      return { success: false, error: "Invalid post ID" }
    }

    // Check if bookmark already exists
    const { data: existingBookmark, error: checkError } = await supabase
      .from("user_bookmarks")
      .select("id")
      .eq("user_id", internalUserId)
      .eq("post_id", postId)
      .single()

    if (checkError && checkError.code !== "PGRST116") {
      console.error("Bookmark check error:", checkError)
      return { success: false, error: "Failed to check bookmark status" }
    }

    let bookmarked: boolean

    if (existingBookmark) {
      // Remove bookmark
      const { error: deleteError } = await supabase
        .from("user_bookmarks")
        .delete()
        .eq("user_id", internalUserId)
        .eq("post_id", postId)

      if (deleteError) {
        console.error("Bookmark delete error:", deleteError)
        return { success: false, error: "Failed to remove bookmark" }
      }
      bookmarked = false
    } else {
      // Add bookmark
      const { error: insertError } = await supabase.from("user_bookmarks").insert({
        user_id: internalUserId,
        post_id: postId,
      })

      if (insertError) {
        console.error("Bookmark insert error:", insertError)
        return { success: false, error: "Failed to add bookmark" }
      }
      bookmarked = true
    }

    revalidatePath("/community")
    return { success: true, data: { bookmarked } }
  } catch (error) {
    console.error("Bookmark post error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

/**
 * Add a comment to a post
 */
export async function addComment(postId: number, content: string, parentCommentId?: number): Promise<ActionResult> {
  try {
    const { internalUserId } = await getUserInternalId()
    const supabase = await createClient()

    if (!postId || postId <= 0) {
      return { success: false, error: "Invalid post ID" }
    }

    if (!content?.trim()) {
      return { success: false, error: "Comment content is required" }
    }

    // Verify post exists
    const { data: post, error: postError } = await supabase
      .from("community_posts")
      .select("id")
      .eq("id", postId)
      .single()

    if (postError || !post) {
      return { success: false, error: "Post not found" }
    }

    // If replying to a comment, verify parent comment exists
    if (parentCommentId) {
      const { data: parentComment, error: parentError } = await supabase
        .from("community_comments")
        .select("id")
        .eq("id", parentCommentId)
        .eq("post_id", postId)
        .single()

      if (parentError || !parentComment) {
        return { success: false, error: "Parent comment not found" }
      }
    }

    // Insert the comment
    const { data: comment, error: commentError } = await supabase
      .from("community_comments")
      .insert({
        post_id: postId,
        user_id: internalUserId,
        content: content.trim(),
        parent_comment_id: parentCommentId || null,
      })
      .select(`
        id,
        content,
        created_at,
        parent_comment_id
      `)
      .single()

    if (commentError) {
      console.error("Comment creation error:", commentError)
      return { success: false, error: "Failed to create comment" }
    }

    // Update post comment count
    await supabase.rpc("increment_post_comment_count", {
      p_post_id: postId,
    })

    revalidatePath("/community")
    return { success: true, data: comment }
  } catch (error) {
    console.error("Add comment error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}
// Optional: Simple form component that uses these server actions
;("use client")

import type React from "react"
import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Send, Video, Music } from "lucide-react"
import { toast } from "sonner"

interface Category {
  id: number
  name: string
  description?: string
}

interface CreatePostFormProps {
  categories?: Category[]
}

export function CreatePostForm({ categories = [] }: CreatePostFormProps) {
  const [content, setContent] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!content.trim()) {
      toast.error("Please enter some content for your post")
      return
    }

    const formData = new FormData()
    formData.append("content", content)
    if (selectedCategory) {
      formData.append("categoryId", selectedCategory)
    }
    if (mediaFile) {
      formData.append("mediaFile", mediaFile)
    }

    startTransition(async () => {
      try {
        const result = await createPost(formData)

        if (result.success) {
          setContent("")
          setSelectedCategory("")
          setMediaFile(null)
          toast.success("Post created successfully!")
        } else {
          toast.error(result.error || "Failed to create post")
        }
      } catch (error) {
        console.error("Form submission error:", error)
        toast.error("An unexpected error occurred")
      }
    })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB")
        return
      }
      setMediaFile(file)
    }
  }

  const getFileIcon = () => {
    if (!mediaFile) return null

    if (mediaFile.type.startsWith("image/")) return <Video className="h-4 w-4" />
    if (mediaFile.type.startsWith("video/")) return <Music className="h-4 w-4" />
    if (mediaFile.type.startsWith("audio/")) return <Video className="h-4 w-4" />
    return null
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create a Post</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="content">What's on your mind?</Label>
            <Textarea
              id="content"
              placeholder="Share your thoughts, use #hashtags to categorize..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[120px] resize-none"
              disabled={isPending}
              maxLength={5000}
            />
            <div className="text-sm text-muted-foreground text-right">{content.length}/5000</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="category">Category (Optional)</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory} disabled={isPending}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
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
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="media">Media (Optional)</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="media"
                  type="file"
                  accept="image/*,video/*,audio/*"
                  onChange={handleFileChange}
                  disabled={isPending}
                  className="flex-1"
                />
                {getFileIcon()}
              </div>
              {mediaFile && (
                <div className="text-sm text-muted-foreground">
                  Selected: {mediaFile.name} ({(mediaFile.size / 1024 / 1024).toFixed(2)} MB)
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setContent("")
                setSelectedCategory("")
                setMediaFile(null)
              }}
              disabled={isPending}
            >
              Clear
            </Button>
            <Button type="submit" disabled={isPending || !content.trim()} className="min-w-[120px]">
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Create Post
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
