import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { sessionId, status, endedAt } = await request.json()
    const supabase = createClient()

    const updateData: any = { session_status: status }
    if (endedAt) {
      updateData.ended_at = endedAt
    }

    const { error } = await supabase.from("meet_greet_sessions").update(updateData).eq("id", sessionId)

    if (error) {
      console.error("Session update error:", error)
      return NextResponse.json({ success: false, error: "Failed to update session" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Session update error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
