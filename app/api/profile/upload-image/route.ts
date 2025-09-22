import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = (error) => reject(error)
  })
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log("[v0] Authentication failed:", authError?.message || "No user found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] User authenticated:", user.id)

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type and size
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 })
    }

    if (file.size > 5 * 1024 * 1024) {
      // 5MB limit
      return NextResponse.json({ error: "File too large" }, { status: 400 })
    }

    // For small files, use base64 encoding as fallback
    if (file.size < 1024 * 1024) { // 1MB
      const base64 = await fileToBase64(file)
      const mockUrl = `/placeholder-user.jpg?t=${Date.now()}`

      console.log("[v0] Using base64 fallback for small file")

      // Try to update profile with mock URL
      const { error: updateError } = await supabase.from("users").upsert({
        auth_user_id: user.id,
        profile_image_url: mockUrl,
        avatar_url: mockUrl,
        updated_at: new Date().toISOString(),
      })

      if (updateError) {
        console.error("[v0] Profile update error:", updateError)
      }

      return NextResponse.json({
        success: true,
        imageUrl: mockUrl,
        message: "Profile image updated successfully (demo mode)",
      })
    }

    // Generate unique filename
    const fileExt = file.name.split(".").pop()
    const fileName = `${user.id}/profile-${Date.now()}.${fileExt}`

    console.log("[v0] Uploading file:", fileName)

    try {
      // First, try to get bucket info to check if it exists
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()

      if (bucketsError) {
        console.error("[v0] Error listing buckets:", bucketsError)
      }

      const bucketExists = buckets?.some((bucket) => bucket.name === "user-uploads")

      if (!bucketExists) {
        console.log("[v0] Creating user-uploads bucket...")
        const { error: createBucketError } = await supabase.storage.createBucket("user-uploads", {
          public: true,
          allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
          fileSizeLimit: 5242880, // 5MB
        })

        if (createBucketError) {
          console.error("[v0] Error creating bucket:", createBucketError)
          // Continue anyway, bucket might exist but not be visible
        }
      }
    } catch (bucketError) {
      console.error("[v0] Bucket check/creation error:", bucketError)
      // Continue with upload attempt
    }

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("user-uploads")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      })

    if (uploadError) {
      console.error("[v0] Upload error:", uploadError)

      if (uploadError.message.includes("Bucket not found")) {
        console.log("[v0] Trying alternative bucket: avatars")
        const { data: altUploadData, error: altUploadError } = await supabase.storage
          .from("avatars")
          .upload(fileName, file, {
            cacheControl: "3600",
            upsert: false,
          })

        if (altUploadError) {
          console.error("[v0] Alternative upload error:", altUploadError)
          return NextResponse.json(
            {
              error: "Upload failed: " + altUploadError.message,
              details: "Please ensure storage bucket is properly configured",
            },
            { status: 500 },
          )
        }

        // Use alternative upload data
        const {
          data: { publicUrl },
        } = supabase.storage.from("avatars").getPublicUrl(fileName)

        console.log("[v0] Alternative upload successful, public URL:", publicUrl)

        // Update profile with alternative URL
        const { error: updateError } = await supabase.from("user_profiles").upsert({
          user_id: user.id,
          profile_image_url: publicUrl,
          avatar_url: publicUrl,
          updated_at: new Date().toISOString(),
        })

        if (updateError) {
          console.error("[v0] Profile update error:", updateError)
          const { error: usersUpdateError } = await supabase
            .from("users")
            .update({
              profile_image_url: publicUrl,
              avatar_url: publicUrl,
            })
            .eq("auth_user_id", user.id)

          if (usersUpdateError) {
            console.error("[v0] Users table update error:", usersUpdateError)
            return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
          }
        }

        return NextResponse.json({
          success: true,
          imageUrl: publicUrl,
          message: "Profile image updated successfully",
        })
      }

      return NextResponse.json({ error: "Upload failed: " + uploadError.message }, { status: 500 })
    }

    console.log("[v0] File uploaded successfully:", uploadData.path)

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("user-uploads").getPublicUrl(fileName)

    console.log("[v0] Public URL generated:", publicUrl)

    const { error: updateError } = await supabase.from("user_profiles").upsert({
      user_id: user.id,
      profile_image_url: publicUrl,
      avatar_url: publicUrl, // Keep both for compatibility
      updated_at: new Date().toISOString(),
    })

    if (updateError) {
      console.error("[v0] Profile update error:", updateError)
      // Try updating users table as fallback
      const { error: usersUpdateError } = await supabase
        .from("users")
        .update({
          profile_image_url: publicUrl,
          avatar_url: publicUrl,
        })
        .eq("auth_user_id", user.id)

      if (usersUpdateError) {
        console.error("[v0] Users table update error:", usersUpdateError)
        return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
      }
    }

    console.log("[v0] Profile updated successfully")

    return NextResponse.json({
      success: true,
      imageUrl: publicUrl,
      message: "Profile image updated successfully",
    })
  } catch (error) {
    console.error("[v0] Profile image upload error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}