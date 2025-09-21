import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()

    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const postId = params.id

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(postId)) {
      return NextResponse.json({ error: "Invalid post ID format" }, { status: 400 })
    }

    // Use the database function to toggle vote
    const { data, error } = await supabase.rpc("toggle_post_vote", {
      post_id_param: postId,
    })

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to toggle vote" }, { status: 500 })
    }

    if (data.error) {
      return NextResponse.json({ error: data.error }, { status: 400 })
    }

    return NextResponse.json({
      voted: data.voted,
      message: data.message,
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
