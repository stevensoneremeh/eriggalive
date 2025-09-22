
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest, { params }: { params: { id: string, commentId: string } }) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // For now, just return success with random data
    const liked = Math.random() > 0.5
    const newLikeCount = Math.floor(Math.random() * 20) + 1

    return NextResponse.json({
      success: true,
      liked,
      likeCount: newLikeCount
    })
  } catch (error) {
    console.error("Error toggling comment like:", error)
    return NextResponse.json({ success: false, error: "Failed to toggle like" }, { status: 500 })
  }
}
