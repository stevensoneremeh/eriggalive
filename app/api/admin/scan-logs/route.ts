import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    // Verify admin authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase.from("admin_users").select("role").eq("user_id", user.id).single()

    if (!profile || !["admin", "scanner"].includes(profile.role)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    // Get scan logs with ticket and event details
    const { data: logs, error } = await supabase
      .from("scan_logs")
      .select(`
        *,
        tickets(
          id,
          events(title, venue)
        )
      `)
      .order("scanned_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error("Scan logs fetch error:", error)
      return NextResponse.json({ error: "Failed to fetch scan logs" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      logs: logs || [],
    })
  } catch (error) {
    console.error("Scan logs API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
