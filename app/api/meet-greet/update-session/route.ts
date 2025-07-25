import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, status, endedAt } = body

    if (!sessionId || !status) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, message: "Authentication required" }, { status: 401 })
    }

    // Update session status
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    }

    if (endedAt) {
      updateData.ended_at = endedAt
    }

    if (status === "active") {
      updateData.started_at = new Date().toISOString()
    }

    const { data: sessionData, error: updateError } = await supabase
      .from("meet_greet_sessions")
      .update(updateData)
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .select()
      .single()

    if (updateError) {
      console.error("Session update error:", updateError)
      return NextResponse.json({ success: false, message: "Failed to update session" }, { status: 500 })
    }

    // If session ended, notify admin
    if (status === "completed") {
      await supabase.from("admin_notifications").insert({
        type: "meet_greet_completed",
        title: "Meet & Greet Session Completed",
        message: `Session with ${user.email} has been completed`,
        data: {
          sessionId: sessionData.id,
          userId: user.id,
          userEmail: user.email,
          duration: sessionData.duration_minutes,
          completedAt: updateData.ended_at || updateData.updated_at,
        },
      })
    }

    return NextResponse.json({
      success: true,
      session: sessionData,
    })
  } catch (error) {
    console.error("Session update error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
