import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const postId = params.id

    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Use the database function to toggle vote
    const { data: result, error } = await supabase.rpc("toggle_post_vote", {
      post_id_param: postId,
    })

    if (error) {
      console.error("Error toggling vote:", error)
      return NextResponse.json({ error: "Failed to toggle vote" }, { status: 500 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error in vote API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
