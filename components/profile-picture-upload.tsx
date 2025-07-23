"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/contexts/auth-context"
import { Camera, Upload, X, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { createClientSupabase } from "@/lib/supabase/client"

interface ProfilePictureUploadProps {
  onUploadSuccess?: () => void
}

export function ProfilePictureUpload({ onUploadSuccess }: ProfilePictureUploadProps) {
  const { user, profile, refreshProfile } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClientSupabase()

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file")
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB")
      return
    }

    setSelectedFile(file)

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleUpload = async () => {
    if (!selectedFile || !user) return

    setUploading(true)

    try {
      // Create unique filename
      const fileExt = selectedFile.name.split(".").pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("user-uploads")
        .upload(filePath, selectedFile, {
          cacheControl: "3600",
          upsert: true,
        })

      if (uploadError) {
        console.error("Upload error:", uploadError)
        toast.error("Failed to upload image")
        return
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("user-uploads").getPublicUrl(filePath)

      // Update user profile
      const { error: updateError } = await supabase
        .from("user_profiles")
        .update({ avatar_url: publicUrl })
        .eq("user_id", user.id)

      if (updateError) {
        console.error("Profile update error:", updateError)
        toast.error("Failed to update profile")
        return
      }

      toast.success("Profile picture updated successfully!")

      // Reset state
      setPreview(null)
      setSelectedFile(null)
      setIsOpen(false)

      // Refresh profile data
      await refreshProfile()
      onUploadSuccess?.()
    } catch (error) {
      console.error("Upload error:", error)
      toast.error("Failed to upload image")
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = async () => {
    if (!user) return

    setUploading(true)

    try {
      // Update user profile to remove avatar
      const { error: updateError } = await supabase
        .from("user_profiles")
        .update({ avatar_url: null })
        .eq("user_id", user.id)

      if (updateError) {
        console.error("Profile update error:", updateError)
        toast.error("Failed to remove profile picture")
        return
      }

      toast.success("Profile picture removed successfully!")
      setIsOpen(false)

      // Refresh profile data
      await refreshProfile()
      onUploadSuccess?.()
    } catch (error) {
      console.error("Remove error:", error)
      toast.error("Failed to remove profile picture")
    } finally {
      setUploading(false)
    }
  }

  const resetDialog = () => {
    setPreview(null)
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open)
        if (!open) resetDialog()
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center space-x-2 bg-transparent">
          <Camera className="h-4 w-4" />
          <span>Change Picture</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Profile Picture</DialogTitle>
          <DialogDescription>Upload a new profile picture or remove your current one.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current/Preview Avatar */}
          <div className="flex justify-center">
            <Avatar className="h-32 w-32">
              <AvatarImage src={preview || profile?.avatar_url || "/placeholder-user.jpg"} />
              <AvatarFallback className="text-2xl">{profile?.username?.charAt(0)?.toUpperCase() || "U"}</AvatarFallback>
            </Avatar>
          </div>

          {/* File Input */}
          <div className="space-y-4">
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />

            <div className="flex flex-col space-y-2">
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="w-full"
                disabled={uploading}
              >
                <Upload className="h-4 w-4 mr-2" />
                Choose New Picture
              </Button>

              {selectedFile && (
                <div className="text-sm text-muted-foreground text-center">Selected: {selectedFile.name}</div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2">
              {selectedFile && (
                <Button onClick={handleUpload} disabled={uploading} className="flex-1">
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Picture
                    </>
                  )}
                </Button>
              )}

              {profile?.avatar_url && (
                <Button
                  onClick={handleRemove}
                  variant="destructive"
                  disabled={uploading}
                  className={selectedFile ? "flex-1" : "w-full"}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Removing...
                    </>
                  ) : (
                    <>
                      <X className="h-4 w-4 mr-2" />
                      Remove Picture
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Guidelines */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Image must be less than 5MB</p>
            <p>• Supported formats: JPG, PNG, GIF</p>
            <p>• Square images work best</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
