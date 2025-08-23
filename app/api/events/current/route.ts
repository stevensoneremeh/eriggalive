import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    // Get current event ID from settings
    const { data: setting } = await supabase
      .from("settings")
      .select("value_json")
      .eq("key", "current_event_id")
      .single()

    if (!setting?.value_json || setting.value_json === null) {
      return NextResponse.json({
        success: true,
        event: null,
        message: "No current event set",
      })
    }

    const currentEventId = setting.value_json

    // Get the current event
    const { data: event, error } = await supabase
      .from("events")
      .select("*")
      .eq("id", currentEventId)
      .eq("status", "active")
      .single()

    if (error || !event) {
      return NextResponse.json({
        success: true,
        event: null,
        message: "Current event not found or inactive",
      })
    }

    return NextResponse.json({
      success: true,
      event,
    })
  } catch (error) {
    console.error("Current event API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
