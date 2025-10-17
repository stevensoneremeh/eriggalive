
import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    // Check authentication and admin privileges
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify admin access
    const { data: profile } = await supabase
      .from("users")
      .select("role, tier")
      .eq("auth_user_id", user.id)
      .single()

    if (!profile || (profile.role !== "admin" && profile.role !== "super_admin" && user.email !== "info@eriggalive.com")) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const thumbnail = formData.get("thumbnail") as File
    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const type = formData.get("type") as string
    const category = formData.get("category") as string
    const tier_required = formData.get("tier_required") as string
    const is_premium = formData.get("is_premium") === "true"
    const unlock_price_coins = parseInt(formData.get("unlock_price_coins") as string) || 0
    const unlock_price_naira = parseInt(formData.get("unlock_price_naira") as string) || 0

    if (!file || !title?.trim()) {
      return NextResponse.json({ error: "File and title are required" }, { status: 400 })
    }

    // Upload main file to Supabase Storage
    const fileExt = file.name.split(".").pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `vault/${type}s/${fileName}`

    const { data: fileData, error: fileError } = await supabase.storage
      .from("media")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      })

    if (fileError) {
      console.error("File upload error:", fileError)
      return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
    }

    // Get public URL for the file
    const { data: { publicUrl } } = supabase.storage
      .from("media")
      .getPublicUrl(filePath)

    let thumbnailUrl = null
    if (thumbnail) {
      const thumbExt = thumbnail.name.split(".").pop()
      const thumbName = `thumb-${Date.now()}.${thumbExt}`
      const thumbPath = `vault/thumbnails/${thumbName}`

      const { data: thumbData, error: thumbError } = await supabase.storage
        .from("media")
        .upload(thumbPath, thumbnail)

      if (!thumbError) {
        const { data: { publicUrl: thumbPublicUrl } } = supabase.storage
          .from("media")
          .getPublicUrl(thumbPath)
        thumbnailUrl = thumbPublicUrl
      }
    }

    // Create slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")

    // Insert media record
    const { data: mediaItem, error: dbError } = await supabase
      .from("vault_media")
      .insert({
        title: title.trim(),
        description: description?.trim() || "",
        slug,
        type,
        category: category?.trim() || "General",
        file_url: publicUrl,
        thumbnail_url: thumbnailUrl,
        tier_required,
        is_premium,
        unlock_price_coins: is_premium ? unlock_price_coins : null,
        unlock_price_naira: is_premium ? unlock_price_naira : null,
        views: 0,
        likes: 0,
        dislikes: 0,
        comments_count: 0,
        is_featured: false,
        is_published: true,
        file_size: file.size,
        duration_seconds: null, // Will be updated if it's a video/audio file
        quality: "HD",
        tags: [],
        metadata: {
          original_filename: file.name,
          content_type: file.type,
          uploaded_by: profile.id,
        },
      })
      .select()
      .single()

    if (dbError) {
      console.error("Database error:", dbError)
      // Clean up uploaded file
      await supabase.storage.from("media").remove([filePath])
      if (thumbnailUrl) {
        await supabase.storage.from("media").remove([`vault/thumbnails/${thumbName}`])
      }
      return NextResponse.json({ error: "Failed to save media record" }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      mediaItem,
      message: "Media uploaded successfully"
    })

  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
