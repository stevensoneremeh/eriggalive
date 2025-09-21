import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const postId = params.id

    if (!postId) {
      return NextResponse.json({ error: "Post ID is required" }, { status: 400 })
    }

    // Use the database function to toggle vote
    const { data, error } = await supabase.rpc("toggle_post_vote", {
      post_id_param: postId,
    })

    if (error) {
      console.error("Error toggling vote:", error)
      return NextResponse.json({ error: "Failed to toggle vote" }, { status: 500 })
    }

    // Check if the response indicates an error
    if (data && typeof data === "object" && "error" in data) {
      return NextResponse.json({ error: data.error }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in vote API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
