import { del } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const url = searchParams.get("url")
    const trackId = searchParams.get("trackId")

    if (!url || !trackId) {
      return NextResponse.json({ error: "Missing URL or track ID" }, { status: 400 })
    }

    // Delete from Vercel Blob
    await del(url)

    // Delete from Supabase
    const { error: dbError } = await supabase.from("tracks").delete().eq("id", trackId).eq("uploaded_by", user.id) // Ensure user can only delete their own tracks

    if (dbError) {
      return NextResponse.json({ error: "Failed to delete track from database" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete error:", error)
    return NextResponse.json({ error: "Delete failed" }, { status: 500 })
  }
}
