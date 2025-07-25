import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase-utils"

export async function POST(request: NextRequest) {
  try {
    const { session_id, status, duration_used } = await request.json()

    if (!session_id || !status) {
      return NextResponse.json({ success: false, message: "Session ID and status are required" }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    }

    if (status === "active") {
      updateData.started_at = new Date().toISOString()
    } else if (status === "completed") {
      updateData.ended_at = new Date().toISOString()
      if (duration_used) {
        updateData.actual_duration = duration_used
      }
    }

    const { data, error } = await supabase
      .from("meet_greet_sessions")
      .update(updateData)
      .eq("id", session_id)
      .select()
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ success: false, message: "Failed to update session" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error("Session update error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
