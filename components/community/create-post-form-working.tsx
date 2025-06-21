
"use client"

import React, { useState, useRef, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { User } from "@supabase/supabase-js"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { ImagePlus, Video, Mic, Send, Loader2, X, AlertTriangle, Upload, FileImage, Music, Film } from "lucide-react"

interface CreatePostFormProps {
  categories: Array<{ id: number; name: string; slug: string }>
  userProfile: any
  supabaseUser?: User | null
  onPostCreated?: () => void
}

export function CreatePostFormWorking({ categories, userProfile, supabaseUser, onPostCreated }: CreatePostFormProps) {
  const supabase = createClient()

  const [content, setContent] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [mediaFiles, setMediaFiles] = useState<File[]>([])
  const [mediaPreviews, setMediaPreviews] = useState<Array<{ url: string; type: string; name: string }>>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [urlValidationError, setUrlValidationError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Monitor auth state
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setCurrentUser(session?.user || null)
      } catch (error) {
        console.error("Auth check error:", error)
      }
    }

    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setCurrentUser(session?.user || null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // URL validation function
  const validateContent = (text: string) => {
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
  }

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value
    setContent(newContent)
    
    // Validate content for URLs
    const error = validateContent(newContent)
    setUrlValidationError(error)
  }

  const getMediaIcon = (type: string) => {
    if (type.startsWith('image/')) return <FileImage className="h-4 w-4" />
    if (type.startsWith('video/')) return <Film className="h-4 w-4" />
    if (type.startsWith('audio/')) return <Music className="h-4 w-4" />
    return <Upload className="h-4 w-4" />
  }

  const handleMediaChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    
    if (files.length === 0) return

    // Validate total files
    if (mediaFiles.length + files.length > 5) {
      toast.error("Maximum 5 media files allowed per post.")
      return
    }

    const validFiles: File[] = []
    const newPreviews: Array<{ url: string; type: string; name: string }> = []

    files.forEach(file => {
      // Validate file size (50MB max)
      if (file.size > 50 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Maximum size is 50MB.`)
        return
      }

      // Validate file type
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg',
        'video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov',
        'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/mpeg', 'audio/m4a'
      ]

      if (!allowedTypes.includes(file.type)) {
        toast.error(`${file.name} has an unsupported file type.`)
        return
      }

      validFiles.push(file)

      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        newPreviews.push({
          url: reader.result as string,
          type: file.type,
          name: file.name
        })
        
        if (newPreviews.length === validFiles.length) {
          setMediaPreviews(prev => [...prev, ...newPreviews])
        }
      }
      reader.readAsDataURL(file)
    })

    setMediaFiles(prev => [...prev, ...validFiles])
  }

  const removeMedia = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index))
    setMediaPreviews(prev => prev.filter((_, i) => i !== index))
    
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const uploadMediaToSupabase = async (file: File, userId: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `community_media/${userId}/${fileName}`

      setUploadProgress(25)

      const { data, error } = await supabase.storage
        .from('eriggalive-assets')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('Upload error:', error)
        return null
      }

      setUploadProgress(75)

      const { data: publicUrlData } = supabase.storage
        .from('eriggalive-assets')
        .getPublicUrl(data.path)

      setUploadProgress(100)
      return publicUrlData.publicUrl
    } catch (error) {
      console.error('Media upload error:', error)
      return null
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const activeUser = currentUser || supabaseUser
    const activeProfile = userProfile

    if (!activeUser) {
      toast.error("Please log in to create posts.")
      return
    }

    if (!content.trim() && mediaFiles.length === 0) {
      toast.error("Please write something or add media.")
      return
    }

    if (urlValidationError) {
      toast.error(urlValidationError)
      return
    }

    if (!selectedCategory) {
      toast.error("Please select a category for your post.")
      return
    }

    setIsSubmitting(true)
    setUploadProgress(0)

    try {
      let mediaUrls: string[] = []

      // Upload media files if present
      if (mediaFiles.length > 0) {
        toast.info("Uploading media files...")
        
        for (let i = 0; i < mediaFiles.length; i++) {
          const file = mediaFiles[i]
          const mediaUrl = await uploadMediaToSupabase(file, activeUser.id)
          
          if (!mediaUrl) {
            toast.error(`Failed to upload ${file.name}. Please try again.`)
            setIsSubmitting(false)
            return
          }
          
          mediaUrls.push(mediaUrl)
        }
      }

      // Determine primary media for backward compatibility
      const primaryMediaUrl = mediaUrls.length > 0 ? mediaUrls[0] : null
      const primaryMediaType = primaryMediaUrl && mediaFiles.length > 0 
        ? mediaFiles[0].type.split('/')[0] 
        : null

      // Create the post data
      const postData = {
        content: content.trim(),
        category_id: parseInt(selectedCategory),
        media_url: primaryMediaUrl,
        media_type: primaryMediaType,
        is_published: true,
        is_deleted: false
      }

      // Add user_id based on available profile
      if (activeProfile?.id) {
        postData.user_id = activeProfile.id
      } else {
        // Create or get user profile for Supabase auth user
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('auth_user_id', activeUser.id)
          .single()

        if (existingUser) {
          postData.user_id = existingUser.id
        } else {
          // Create new user profile
          const { data: newUser, error: userError } = await supabase
            .from('users')
            .insert({
              auth_user_id: activeUser.id,
              username: activeUser.email?.split('@')[0] || 'user',
              full_name: activeUser.user_metadata?.full_name || activeUser.email?.split('@')[0] || 'User',
              email: activeUser.email || '',
              tier: 'grassroot'
            })
            .select('id')
            .single()

          if (userError || !newUser) {
            toast.error("Failed to create user profile. Please try again.")
            setIsSubmitting(false)
            return
          }

          postData.user_id = newUser.id
        }
      }

      // Create post
      const { data: newPost, error: postError } = await supabase
        .from('community_posts')
        .insert(postData)
        .select(`
          *,
          user:users!community_posts_user_id_fkey(id, auth_user_id, username, full_name, avatar_url, tier),
          category:community_categories!community_posts_category_id_fkey(id, name, slug)
        `)
        .single()

      if (postError) {
        console.error('Post creation error:', postError)
        toast.error("Failed to create post. Please try again.")
        setIsSubmitting(false)
        return
      }

      toast.success("Post created successfully!")

      // Reset form
      setContent("")
      setSelectedCategory("")
      setMediaFiles([])
      setMediaPreviews([])
      setUrlValidationError(null)
      setUploadProgress(0)

      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }

      // Notify parent component to refresh feed
      if (onPostCreated) {
        onPostCreated()
      }

    } catch (error: any) {
      console.error("Submit error:", error)
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsSubmitting(false)
      setUploadProgress(0)
    }
  }

  // Show login prompt if no user
  if (!currentUser && !supabaseUser && !userProfile) {
    return (
      <Card className="mb-8 shadow-md">
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground mb-4">Please log in to create posts and join the community.</p>
          <Button asChild className="bg-primary hover:bg-primary/90">
            <a href="/login?redirect=/community">Log In</a>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const displayUser = userProfile || {
    username: currentUser?.email?.split('@')[0] || supabaseUser?.email?.split('@')[0] || 'User',
    avatar_url: currentUser?.user_metadata?.avatar_url || supabaseUser?.user_metadata?.avatar_url
  }

  return (
    <Card className="mb-8 shadow-md">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-start space-x-3">
            <Avatar className="mt-1">
              <AvatarImage src={displayUser.avatar_url || "/placeholder-user.jpg"} alt={displayUser.username} />
              <AvatarFallback>{displayUser.username?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
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

          {/* Media Previews */}
          {mediaPreviews.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {mediaPreviews.map((preview, index) => (
                <div key={index} className="relative group border rounded-lg overflow-hidden">
                  {preview.type.startsWith("image/") && (
                    <img
                      src={preview.url}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover"
                    />
                  )}
                  {preview.type.startsWith("video/") && (
                    <video src={preview.url} className="w-full h-32 object-cover" muted />
                  )}
                  {preview.type.startsWith("audio/") && (
                    <div className="p-4 bg-muted h-32 flex items-center justify-center">
                      <div className="text-center">
                        <Music className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm font-medium truncate">{preview.name}</p>
                      </div>
                    </div>
                  )}
                  
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6"
                    onClick={() => removeMedia(index)}
                    disabled={isSubmitting}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                  
                  <div className="absolute bottom-2 left-2">
                    <div className="bg-black/50 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                      {getMediaIcon(preview.type)}
                      {preview.type.split('/')[0]}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Upload Progress */}
          {isSubmitting && uploadProgress > 0 && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${uploadProgress}%` }}
              />
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
                title="Add Media (Images, Videos, Audio)"
                disabled={isSubmitting || mediaFiles.length >= 5}
              >
                <ImagePlus className="h-5 w-5 text-blue-500" />
              </Button>
              <Input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/jpeg,image/png,image/gif,image/webp,image/jpg,video/mp4,video/webm,video/ogg,video/avi,video/mov,audio/mp3,audio/wav,audio/ogg,audio/mpeg,audio/m4a"
                onChange={handleMediaChange}
                disabled={isSubmitting}
                multiple
              />
              
              {mediaFiles.length > 0 && (
                <span className="text-sm text-muted-foreground">
                  {mediaFiles.length}/5 files
                </span>
              )}
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
                disabled={isSubmitting || !!urlValidationError || (!content.trim() && mediaFiles.length === 0)} 
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
