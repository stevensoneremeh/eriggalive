import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const title = formData.get("title") as string
    const artist = formData.get("artist") as string
    const moodCategory = formData.get("moodCategory") as string

    if (!file || !title || !artist || !moodCategory) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Upload audio file to Vercel Blob
    const blob = await put(`radio/tracks/${Date.now()}-${file.name}`, file, {
      access: "public",
    })

    // Save track metadata to Supabase
    const { data: track, error: dbError } = await supabase
      .from("tracks")
      .insert({
        title,
        artist,
        audio_url: blob.url,
        mood_category: moodCategory,
        duration_ms: 0, // Will be updated when audio is processed
        artwork_url: "/abstract-soundscape.png",
        uploaded_by: user.id,
      })
      .select()
      .single()

    if (dbError) {
      // Clean up blob if database insert fails
      await fetch(`/api/radio/delete-track?url=${blob.url}`, { method: "DELETE" })
      return NextResponse.json({ error: "Failed to save track" }, { status: 500 })
    }

    return NextResponse.json({
      track,
      message: "Track uploaded successfully",
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
