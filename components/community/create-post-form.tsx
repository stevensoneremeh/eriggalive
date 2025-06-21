
"use client"

import type React from "react"
import { useState, useRef, useCallback } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { ImagePlus, Video, Mic, Send, Loader2, X, AlertTriangle } from "lucide-react"
import { createCommunityPostAction } from "@/lib/community-actions"
import { createClient } from "@/lib/supabase/client"

interface CreatePostFormProps {
  categories: Array<{ id: number; name: string; slug: string }>
  userId: string
  onPostCreated?: (post: any) => void
}

export function CreatePostForm({ categories, userId, onPostCreated }: CreatePostFormProps) {
  const { toast } = useToast()
  const supabase = createClient()

  const [content, setContent] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [mediaPreview, setMediaPreview] = useState<string | null>(null)
  const [mediaType, setMediaType] = useState<"image" | "video" | "audio" | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [urlValidationError, setUrlValidationError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // URL validation function
  const validateContent = useCallback((text: string) => {
    const urlPatterns = [
      /https?:\/\/[^\s]+/gi,
      /www\.[^\s]+/gi,
      /[^\s]+\.(com|net|org|edu|gov|mil|int|co\.uk|io|app|dev)[^\s]*/gi
    ]
    
    for (const pattern of urlPatterns) {
      if (pattern.test(text)) {
        return "URLs are not allowed in posts for security reasons. Please remove any links or website addresses."
      }
    }
    return null
  }, [])

  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value
    setContent(newContent)
    
    // Validate content for URLs
    const error = validateContent(newContent)
    setUrlValidationError(error)
  }, [validateContent])

  const handleMediaChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (file) {
        // Validate file size (50MB max)
        if (file.size > 50 * 1024 * 1024) {
          toast({
            title: "File Too Large",
            description: "Please select a file smaller than 50MB.",
            variant: "destructive",
          })
          return
        }

        // Validate file type
        const allowedTypes = [
          'image/jpeg', 'image/png', 'image/gif', 'image/webp',
          'video/mp4', 'video/webm', 'video/ogg',
          'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/mpeg'
        ]

        if (!allowedTypes.includes(file.type)) {
          toast({
            title: "Unsupported File Type",
            description: "Please select an image (JPEG, PNG, GIF, WebP), video (MP4, WebM, OGG), or audio (MP3, WAV, OGG) file.",
            variant: "destructive",
          })
          return
        }

        setMediaFile(file)
        const reader = new FileReader()
        reader.onloadend = () => {
          setMediaPreview(reader.result as string)
        }
        reader.readAsDataURL(file)

        if (file.type.startsWith("image/")) setMediaType("image")
        else if (file.type.startsWith("video/")) setMediaType("video")
        else if (file.type.startsWith("audio/")) setMediaType("audio")
      }
    },
    [toast],
  )

  const removeMedia = useCallback(() => {
    setMediaFile(null)
    setMediaPreview(null)
    setMediaType(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [])

  const uploadMediaToSupabase = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `community_media/${userId}/${fileName}`

      const { data, error } = await supabase.storage
        .from('eriggalive-assets')
        .upload(filePath, file)

      if (error) {
        console.error('Upload error:', error)
        return null
      }

      const { data: publicUrlData } = supabase.storage
        .from('eriggalive-assets')
        .getPublicUrl(data.path)

      return publicUrlData.publicUrl
    } catch (error) {
      console.error('Media upload error:', error)
      return null
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!content.trim() && !mediaFile) {
      toast({
        title: "Empty Post",
        description: "Please write something or add media.",
        variant: "destructive",
      })
      return
    }

    if (urlValidationError) {
      toast({
        title: "Invalid Content",
        description: urlValidationError,
        variant: "destructive",
      })
      return
    }

    if (!selectedCategory) {
      toast({
        title: "No Category",
        description: "Please select a category for your post.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      let mediaUrl: string | null = null

      // Upload media if present
      if (mediaFile) {
        mediaUrl = await uploadMediaToSupabase(mediaFile)
        if (!mediaUrl) {
          toast({
            title: "Upload Failed",
            description: "Failed to upload media. Please try again.",
            variant: "destructive",
          })
          setIsSubmitting(false)
          return
        }
      }

      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        toast({
          title: "Authentication Error",
          description: "Please log in to create a post.",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      // Get user's internal ID
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()

      if (userError || !userData) {
        toast({
          title: "User Error",
          description: "User profile not found. Please try logging in again.",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      // Create post
      const { data: newPost, error: postError } = await supabase
        .from('community_posts')
        .insert({
          user_id: userData.id,
          category_id: parseInt(selectedCategory),
          content: content.trim(),
          media_url: mediaUrl,
          media_type: mediaType,
          is_published: true,
          is_deleted: false
        })
        .select(`
          *,
          user:users!community_posts_user_id_fkey(id, auth_user_id, username, full_name, avatar_url, tier),
          category:community_categories!community_posts_category_id_fkey(id, name, slug)
        `)
        .single()

      if (postError) {
        console.error('Post creation error:', postError)
        toast({
          title: "Error",
          description: "Failed to create post. Please try again.",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      toast({
        title: "Post Created!",
        description: "Your post has been shared with the community.",
      })

      // Reset form
      setContent("")
      setSelectedCategory("")
      removeMedia()
      setUrlValidationError(null)

      // Notify parent component
      if (onPostCreated && newPost) {
        onPostCreated(newPost)
      }

    } catch (error: any) {
      console.error("Submit error:", error)
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="mb-6 shadow-md">
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-start space-x-3">
            <Avatar className="mt-1">
              <AvatarImage src="/placeholder-user.jpg" alt="You" />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Textarea
                value={content}
                onChange={handleContentChange}
                placeholder="What's on your mind? Share your thoughts with the community..."
                className={`min-h-[120px] resize-none ${
                  urlValidationError ? 'border-red-500 focus:border-red-500' : ''
                }`}
                disabled={isSubmitting}
                maxLength={2000}
              />
              <div className="flex justify-between items-center mt-2 text-sm">
                <div>
                  {urlValidationError && (
                    <div className="flex items-center gap-1 text-red-500">
                      <AlertTriangle className="h-4 w-4" />
                      <span>{urlValidationError}</span>
                    </div>
                  )}
                </div>
                <span className="text-muted-foreground">{content.length}/2000</span>
              </div>
            </div>
          </div>

          {/* Media Preview */}
          {mediaPreview && (
            <div className="relative group w-full max-h-96 overflow-hidden rounded-lg border">
              {mediaType === "image" && (
                <img
                  src={mediaPreview}
                  alt="Media preview"
                  className="w-full h-auto object-contain max-h-96"
                />
              )}
              {mediaType === "video" && (
                <video src={mediaPreview} controls className="w-full h-auto object-contain max-h-96" />
              )}
              {mediaType === "audio" && (
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Mic className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{mediaFile?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {mediaFile && (mediaFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <audio src={mediaPreview} controls className="w-full mt-3" />
                </div>
              )}
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={removeMedia}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                title="Add Media"
                disabled={isSubmitting}
              >
                <ImagePlus className="h-5 w-5 text-blue-500" />
              </Button>
              <Input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/ogg,audio/mp3,audio/wav,audio/ogg,audio/mpeg"
                onChange={handleMediaChange}
                disabled={isSubmitting}
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Select value={selectedCategory} onValueChange={setSelectedCategory} required disabled={isSubmitting}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={String(category.id)}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button 
                type="submit" 
                disabled={isSubmitting || !!urlValidationError} 
                className="bg-primary hover:bg-primary/90"
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                {isSubmitting ? "Posting..." : "Post"}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
