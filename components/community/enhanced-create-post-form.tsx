"use client"

import type React from "react"

import { useState, useRef, useCallback, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ImageIcon, Video, Music, X, Send, Loader2, AlertCircle, CheckCircle, Upload, User } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

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
  className?: string
}

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
const MAX_CONTENT_LENGTH = 2000
const ALLOWED_FILE_TYPES = {
  image: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  video: ["video/mp4", "video/webm", "video/ogg"],
  audio: ["audio/mp3", "audio/wav", "audio/ogg", "audio/mpeg"],
}

export function EnhancedCreatePostForm({ categories, onPostCreated, className }: EnhancedCreatePostFormProps) {
  const { user, profile, isAuthenticated } = useAuth()
  const supabase = createClient()

  // Form state
  const [content, setContent] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [mediaPreview, setMediaPreview] = useState<string | null>(null)
  const [mediaType, setMediaType] = useState<string | null>(null)

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = "auto"
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
    }
  }, [])

  useEffect(() => {
    adjustTextareaHeight()
  }, [content, adjustTextareaHeight])

  // Validate file
  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return "File size must be less than 50MB"
    }

    const fileType = file.type
    const isValidType = Object.values(ALLOWED_FILE_TYPES).some((types) => types.includes(fileType))

    if (!isValidType) {
      return "File type not supported. Please upload an image, video, or audio file."
    }

    return null
  }

  // Handle file selection
  const handleFileSelect = useCallback((file: File) => {
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setError(null)
    setMediaFile(file)

    // Determine media type
    let type = "file"
    if (ALLOWED_FILE_TYPES.image.includes(file.type)) type = "image"
    else if (ALLOWED_FILE_TYPES.video.includes(file.type)) type = "video"
    else if (ALLOWED_FILE_TYPES.audio.includes(file.type)) type = "audio"

    setMediaType(type)

    // Create preview
    if (type === "image" || type === "video") {
      const url = URL.createObjectURL(file)
      setMediaPreview(url)
    } else {
      setMediaPreview(null)
    }
  }, [])

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)

      const files = Array.from(e.dataTransfer.files)
      if (files.length > 0) {
        handleFileSelect(files[0])
      }
    },
    [handleFileSelect],
  )

  // Handle file input change
  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (files && files.length > 0) {
        handleFileSelect(files[0])
      }
    },
    [handleFileSelect],
  )

  // Remove media
  const removeMedia = useCallback(() => {
    setMediaFile(null)
    setMediaPreview(null)
    setMediaType(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    if (mediaPreview) {
      URL.revokeObjectURL(mediaPreview)
    }
  }, [mediaPreview])

  // Validate content for URLs
  const validateContent = (text: string): string | null => {
    const urlRegex = /(https?:\/\/[^\s]+)/g
    if (urlRegex.test(text)) {
      return "External links are not allowed in posts for security reasons."
    }
    return null
  }

  // Handle content change
  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value
    if (newContent.length <= MAX_CONTENT_LENGTH) {
      setContent(newContent)
      setError(null)

      // Validate for URLs
      const urlError = validateContent(newContent)
      if (urlError) {
        setError(urlError)
      }
    }
  }, [])

  // Get current user profile
  const getCurrentUserProfile = async () => {
    if (!isAuthenticated || !user) {
      // For non-authenticated users, create a guest profile
      return {
        id: "guest",
        username: "Guest User",
        full_name: "Guest User",
        avatar_url: "/placeholder-user.jpg",
        tier: "grassroot",
      }
    }

    try {
      const { data, error } = await supabase.from("users").select("*").eq("auth_user_id", user.id).single()

      if (error || !data) {
        // Create user profile if it doesn't exist
        const newProfile = {
          auth_user_id: user.id,
          username: user.email?.split("@")[0] || "user",
          full_name: user.user_metadata?.full_name || user.email || "User",
          email: user.email || "",
          avatar_url: user.user_metadata?.avatar_url,
          tier: "grassroot",
          coins: 1000,
        }

        const { data: createdProfile, error: createError } = await supabase
          .from("users")
          .insert(newProfile)
          .select()
          .single()

        if (createError) {
          console.error("Failed to create user profile:", createError)
          return null
        }

        return createdProfile
      }

      return data
    } catch (error) {
      console.error("Error getting user profile:", error)
      return null
    }
  }

  // Submit post
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!content.trim() && !mediaFile) {
      setError("Please add some content or upload media")
      return
    }

    if (!selectedCategory) {
      setError("Please select a category")
      return
    }

    const contentError = validateContent(content)
    if (contentError) {
      setError(contentError)
      return
    }

    setIsSubmitting(true)
    setError(null)
    setUploadProgress(0)

    try {
      const userProfile = await getCurrentUserProfile()

      if (!userProfile) {
        throw new Error("Unable to get user profile")
      }

      let media_url: string | undefined = undefined
      let media_type: string | undefined = undefined
      let media_metadata: Record<string, any> | undefined = undefined

      // Upload media if present
      if (mediaFile) {
        setUploadProgress(25)

        const fileExt = mediaFile.name.split(".").pop()
        const fileName = `${userProfile.id || "guest"}-${Date.now()}.${fileExt}`
        const filePath = `community_media/${fileName}`

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("eriggalive-assets")
          .upload(filePath, mediaFile, {
            onUploadProgress: (progress) => {
              setUploadProgress(25 + (progress.loaded / progress.total) * 50)
            },
          })

        if (uploadError) {
          throw new Error(`Media upload failed: ${uploadError.message}`)
        }

        const { data: publicUrlData } = supabase.storage.from("eriggalive-assets").getPublicUrl(uploadData.path)

        media_url = publicUrlData.publicUrl
        media_type = mediaType || undefined
        media_metadata = {
          name: mediaFile.name,
          size: mediaFile.size,
          type: mediaFile.type,
        }
      }

      setUploadProgress(75)

      // Create post data
      const postData = {
        user_id: userProfile.id,
        category_id: Number.parseInt(selectedCategory),
        content: content.trim(),
        media_url,
        media_type,
        media_metadata,
        is_published: true,
        is_deleted: false,
        is_edited: false,
      }

      // Insert post
      const { data: newPost, error: postError } = await supabase
        .from("community_posts")
        .insert(postData)
        .select(`
          *,
          user:users!community_posts_user_id_fkey(id, username, full_name, avatar_url, tier),
          category:community_categories!community_posts_category_id_fkey(id, name, slug)
        `)
        .single()

      if (postError) {
        throw new Error(`Failed to create post: ${postError.message}`)
      }

      setUploadProgress(100)
      setSuccess(true)

      // Reset form
      setContent("")
      setSelectedCategory("")
      removeMedia()

      // Call callback with new post
      onPostCreated(newPost)

      toast.success("Post created successfully!")

      // Reset success state after a delay
      setTimeout(() => setSuccess(false), 3000)
    } catch (error: any) {
      console.error("Error creating post:", error)
      setError(error.message || "Failed to create post")
      toast.error(error.message || "Failed to create post")
    } finally {
      setIsSubmitting(false)
      setUploadProgress(0)
    }
  }

  // Get character count color
  const getCharCountColor = () => {
    const remaining = MAX_CONTENT_LENGTH - content.length
    if (remaining < 50) return "text-red-500"
    if (remaining < 100) return "text-yellow-500"
    return "text-gray-500"
  }

  return (
    <Card className={cn("w-full mb-6", className)}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center space-x-2">
          <User className="h-5 w-5" />
          <span>Create Post</span>
        </CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* User Info */}
          <div className="flex items-center space-x-3 pb-3 border-b">
            <Avatar className="h-10 w-10">
              <AvatarImage src={profile?.avatar_url || "/placeholder-user.jpg"} />
              <AvatarFallback>{profile?.username?.charAt(0).toUpperCase() || "G"}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm">{profile?.username || "Guest User"}</p>
              <Badge variant="secondary" className="text-xs">
                {profile?.tier || "grassroot"}
              </Badge>
            </div>
          </div>

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
              ref={textareaRef}
              placeholder="What's on your mind? Share your thoughts with the community..."
              value={content}
              onChange={handleContentChange}
              className="min-h-[100px] resize-none border-gray-200 focus:border-blue-500 transition-colors"
              disabled={isSubmitting}
              maxLength={MAX_CONTENT_LENGTH}
            />
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">No external links allowed for security</span>
              <span className={getCharCountColor()}>
                {content.length}/{MAX_CONTENT_LENGTH}
              </span>
            </div>
          </div>

          {/* Media Upload Area */}
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-6 transition-colors",
              isDragOver ? "border-blue-500 bg-blue-50" : "border-gray-300",
              isSubmitting && "opacity-50 pointer-events-none",
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {mediaFile ? (
              <div className="space-y-4">
                {/* Media Preview */}
                {mediaPreview && mediaType === "image" && (
                  <div className="relative">
                    <img
                      src={mediaPreview || "/placeholder.svg"}
                      alt="Preview"
                      className="max-h-64 w-auto mx-auto rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={removeMedia}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {mediaPreview && mediaType === "video" && (
                  <div className="relative">
                    <video src={mediaPreview} controls className="max-h-64 w-auto mx-auto rounded-lg" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={removeMedia}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {mediaType === "audio" && (
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Music className="h-8 w-8 text-blue-500" />
                      <div>
                        <p className="font-medium">{mediaFile.name}</p>
                        <p className="text-sm text-gray-500">{(mediaFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <Button type="button" variant="destructive" size="sm" onClick={removeMedia}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">Drag and drop media here, or click to select</p>
                <p className="text-sm text-gray-500 mb-4">Supports images, videos, and audio files (max 50MB)</p>
                <div className="flex justify-center space-x-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Image
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                    <Video className="h-4 w-4 mr-2" />
                    Video
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                    <Music className="h-4 w-4 mr-2" />
                    Audio
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*,audio/*"
            onChange={handleFileInputChange}
            className="hidden"
          />

          {/* Upload Progress */}
          {isSubmitting && uploadProgress > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

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
          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              disabled={isSubmitting || (!content.trim() && !mediaFile) || !selectedCategory || !!error}
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
