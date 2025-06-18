import { createClient } from "@/lib/supabase/client"

export type MediaType = "image" | "video" | "audio" | "document"

export interface MediaUploadResult {
  success: boolean
  fileUrl?: string
  thumbnailUrl?: string
  error?: string
  mediaId?: number
  metadata?: Record<string, any>
}

export async function uploadMedia(
  file: File,
  userId: number,
  postId?: number,
  commentId?: number,
): Promise<MediaUploadResult> {
  try {
    const supabase = createClient()

    // Validate file type
    const mediaType = getMediaType(file.type)
    if (!mediaType) {
      return {
        success: false,
        error: "Unsupported file type. Please upload an image, video, audio, or document.",
      }
    }

    // Validate file size (10MB limit for images, 50MB for videos/audio, 5MB for documents)
    const maxSizeMap = {
      image: 10 * 1024 * 1024, // 10MB
      video: 50 * 1024 * 1024, // 50MB
      audio: 50 * 1024 * 1024, // 50MB
      document: 5 * 1024 * 1024, // 5MB
    }

    if (file.size > maxSizeMap[mediaType]) {
      return {
        success: false,
        error: `File too large. Maximum size for ${mediaType} is ${maxSizeMap[mediaType] / (1024 * 1024)}MB.`,
      }
    }

    // Generate a unique file name
    const fileExt = file.name.split(".").pop()
    const fileName = `${mediaType}_${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`
    const filePath = `community/${userId}/${mediaType}s/${fileName}`

    // Upload file to Supabase Storage
    const { data: fileData, error: fileError } = await supabase.storage.from("media").upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    })

    if (fileError) {
      console.error("Error uploading file:", fileError)
      return { success: false, error: "Failed to upload file. Please try again." }
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("media").getPublicUrl(filePath)

    // Generate metadata based on media type
    const metadata: Record<string, any> = {
      fileName: file.name,
      contentType: file.type,
      size: file.size,
    }

    // For images and videos, try to get dimensions
    let thumbnailUrl = null
    if (mediaType === "image" || mediaType === "video") {
      if (mediaType === "image") {
        // For images, use the same URL as thumbnail
        thumbnailUrl = publicUrl
      } else if (mediaType === "video") {
        // For videos, we'd ideally generate a thumbnail
        // This would require server-side processing
        // For now, use a placeholder
        thumbnailUrl = `/placeholder.svg?height=300&width=500&text=Video+Thumbnail`
      }
    }

    // Record the upload in the database
    const { data: mediaRecord, error: dbError } = await supabase
      .from("community_media")
      .insert({
        user_id: userId,
        post_id: postId || null,
        comment_id: commentId || null,
        media_type: mediaType,
        file_name: file.name,
        file_size: file.size,
        file_url: publicUrl,
        thumbnail_url: thumbnailUrl,
        metadata,
      })
      .select("id")
      .single()

    if (dbError) {
      console.error("Error recording media upload:", dbError)
      return {
        success: true,
        fileUrl: publicUrl,
        thumbnailUrl,
        error: "File uploaded but not properly recorded. Some features may be limited.",
      }
    }

    return {
      success: true,
      fileUrl: publicUrl,
      thumbnailUrl,
      mediaId: mediaRecord.id,
      metadata,
    }
  } catch (error) {
    console.error("Media upload error:", error)
    return { success: false, error: "An unexpected error occurred. Please try again." }
  }
}

// Helper function to determine media type from MIME type
function getMediaType(mimeType: string): MediaType | null {
  if (mimeType.startsWith("image/")) return "image"
  if (mimeType.startsWith("video/")) return "video"
  if (mimeType.startsWith("audio/")) return "audio"
  if (
    mimeType.match(
      /application\/(pdf|msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document|vnd\.ms-excel|vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet)/,
    )
  ) {
    return "document"
  }
  return null
}

// Function to extract URLs from text and validate them
export function extractAndValidateUrls(text: string): {
  hasExternalLinks: boolean
  sanitizedText: string
} {
  // Regular expression to find URLs
  const urlRegex = /(https?:\/\/[^\s]+)/g

  // Find all URLs in the text
  const urls = text.match(urlRegex) || []

  // Check if there are any external links
  const hasExternalLinks = urls.length > 0

  // Replace URLs with placeholder text
  const sanitizedText = text.replace(urlRegex, "[External link removed for security]")

  return { hasExternalLinks, sanitizedText }
}
