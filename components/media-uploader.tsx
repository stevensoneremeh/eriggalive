"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/components/ui/use-toast"
import { ImageIcon, Music, FileText, Video, X, Upload } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface MediaUploadResult {
  success: boolean
  url?: string
  error?: string
}

interface MediaUploaderProps {
  userId: number
  postId?: number
  commentId?: number
  onUploadComplete: (results: MediaUploadResult[]) => void
  maxFiles?: number
}

export function MediaUploader({ userId, postId, commentId, onUploadComplete, maxFiles = 5 }: MediaUploaderProps) {
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const uploadMedia = async (file: File): Promise<MediaUploadResult> => {
    try {
      const fileExt = file.name.split(".").pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`
      const filePath = `community/${fileName}`

      const { data, error } = await supabase.storage.from("eriggalive-assets").upload(filePath, file)

      if (error) throw error

      const { data: urlData } = supabase.storage.from("eriggalive-assets").getPublicUrl(data.path)

      return {
        success: true,
        url: urlData.publicUrl,
      }
    } catch (error) {
      console.error("Error uploading file:", error)
      return {
        success: false,
        error: "Failed to upload file",
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return

    const selectedFiles = Array.from(e.target.files)

    // Check if adding these files would exceed the limit
    if (files.length + selectedFiles.length > maxFiles) {
      toast({
        title: "Too many files",
        description: `You can only upload a maximum of ${maxFiles} files at once.`,
        variant: "destructive",
      })
      return
    }

    // Add new files to the list
    setFiles((prev) => [...prev, ...selectedFiles])

    // Generate previews for the new files
    selectedFiles.forEach((file) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader()
        reader.onload = (e) => {
          setPreviews((prev) => [...prev, e.target?.result as string])
        }
        reader.readAsDataURL(file)
      } else if (file.type.startsWith("video/")) {
        setPreviews((prev) => [...prev, "/placeholder.svg?height=100&width=100&text=Video"])
      } else if (file.type.startsWith("audio/")) {
        setPreviews((prev) => [...prev, "/placeholder.svg?height=100&width=100&text=Audio"])
      } else {
        setPreviews((prev) => [...prev, "/placeholder.svg?height=100&width=100&text=Document"])
      }
    })

    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
    setPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (!files.length) return

    setUploading(true)
    setProgress(0)

    const results: MediaUploadResult[] = []

    for (let i = 0; i < files.length; i++) {
      const result = await uploadMedia(files[i])
      results.push(result)

      // Update progress
      setProgress(Math.round(((i + 1) / files.length) * 100))
    }

    // Call the callback with all results
    onUploadComplete(results)

    // Reset the state
    setFiles([])
    setPreviews([])
    setUploading(false)
    setProgress(0)
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) return <ImageIcon className="h-5 w-5" />
    if (file.type.startsWith("video/")) return <Video className="h-5 w-5" />
    if (file.type.startsWith("audio/")) return <Music className="h-5 w-5" />
    return <FileText className="h-5 w-5" />
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || files.length >= maxFiles}
        >
          <Upload className="h-4 w-4 mr-2" />
          Add Media
        </Button>
        {files.length > 0 && (
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={handleUpload}
            disabled={uploading}
            className="bg-orange-500 hover:bg-orange-600 text-black"
          >
            {uploading ? "Uploading..." : "Upload Files"}
          </Button>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        multiple
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx"
      />

      {uploading && <Progress value={progress} className="h-2" />}

      {previews.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {previews.map((preview, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-md overflow-hidden bg-muted flex items-center justify-center">
                {preview.startsWith("data:image/") ? (
                  <img src={preview || "/placeholder.svg"} alt="Preview" className="object-cover w-full h-full" />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full">
                    {getFileIcon(files[index])}
                    <span className="text-xs mt-1 text-center px-1 truncate max-w-full">
                      {files[index].name.length > 15 ? files[index].name.substring(0, 12) + "..." : files[index].name}
                    </span>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                disabled={uploading}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
