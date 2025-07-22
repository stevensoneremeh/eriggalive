"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"
import { Camera, Trash2 } from "lucide-react"

interface ProfilePictureUploadProps {
  currentImageUrl?: string | null
  onUploadSuccess?: () => void
}

export function ProfilePictureUpload({ currentImageUrl, onUploadSuccess }: ProfilePictureUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [imageUrl, setImageUrl] = useState(currentImageUrl)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { profile } = useAuth()
  const supabase = createClient()

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      uploadImage(file)
    }
  }

  const uploadImage = async (file: File) => {
    if (!profile) {
      toast.error("Please log in to upload a profile picture")
      return
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file")
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB")
      return
    }

    setUploading(true)

    try {
      // Create unique filename
      const fileExt = file.name.split(".").pop()
      const fileName = `${profile.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("user-uploads")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        })

      if (uploadError) {
        throw uploadError
      }

      // Get public URL
      const { data: urlData } = supabase.storage.from("user-uploads").getPublicUrl(filePath)

      if (!urlData?.publicUrl) {
        throw new Error("Failed to get public URL")
      }

      // Update user profile in database
      const { error: updateError } = await supabase
        .from("users")
        .update({ avatar_url: urlData.publicUrl })
        .eq("id", profile.id)

      if (updateError) {
        throw updateError
      }

      setImageUrl(urlData.publicUrl)
      toast.success("Profile picture updated successfully!")

      if (onUploadSuccess) {
        onUploadSuccess()
      }
    } catch (error: any) {
      console.error("Upload error:", error)
      toast.error(error.message || "Failed to upload image")
    } finally {
      setUploading(false)
    }
  }

  const removeImage = async () => {
    if (!profile) return

    try {
      setUploading(true)

      // Update user profile to remove avatar
      const { error } = await supabase.from("users").update({ avatar_url: null }).eq("id", profile.id)

      if (error) {
        throw error
      }

      setImageUrl(null)
      toast.success("Profile picture removed")

      if (onUploadSuccess) {
        onUploadSuccess()
      }
    } catch (error: any) {
      console.error("Remove error:", error)
      toast.error("Failed to remove profile picture")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <Avatar className="h-20 w-20">
          <AvatarImage src={imageUrl || "/placeholder-user.jpg"} />
          <AvatarFallback className="text-2xl">{profile?.username?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
        </Avatar>

        <div className="space-y-2">
          <div className="flex space-x-2">
            <Button onClick={() => fileInputRef.current?.click()} disabled={uploading} size="sm">
              {uploading ? (
                "Uploading..."
              ) : (
                <>
                  <Camera className="h-4 w-4 mr-2" />
                  {imageUrl ? "Change" : "Upload"}
                </>
              )}
            </Button>

            {imageUrl && (
              <Button onClick={removeImage} disabled={uploading} variant="outline" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Remove
              </Button>
            )}
          </div>

          <p className="text-xs text-muted-foreground">JPG, PNG or GIF. Max size 5MB.</p>
        </div>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
    </div>
  )
}
