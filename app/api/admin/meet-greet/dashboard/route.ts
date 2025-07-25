import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    // Get current user and verify admin access
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase.from("profiles").select("role, tier").eq("id", user.id).single()

    if (!profile || (profile.role !== "admin" && profile.tier !== "blood")) {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 })
    }

    // Get sessions
    const { data: sessions, error: sessionsError } = await supabase
      .from("meet_greet_sessions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50)

    if (sessionsError) {
      console.error("Sessions fetch error:", sessionsError)
      return NextResponse.json({ success: false, error: "Failed to fetch sessions" }, { status: 500 })
    }

    // Get notifications
    const { data: notifications, error: notificationsError } = await supabase
      .from("admin_notifications")
      .select(`
        *,
        meet_greet_sessions (*)
      `)
      .eq("is_read", false)
      .order("created_at", { ascending: false })

    if (notificationsError) {
      console.error("Notifications fetch error:", notificationsError)
    }

    // Calculate stats
    const stats = {
      totalSessions: sessions.length,
      totalRevenue: sessions
        .filter((s) => s.payment_status === "completed")
        .reduce((sum, s) => sum + Number.parseFloat(s.amount), 0),
      upcomingSessions: sessions.filter((s) => s.session_status === "scheduled").length,
      activeSessions: sessions.filter((s) => s.session_status === "active").length,
    }

    return NextResponse.json({
      success: true,
      sessions,
      notifications: notifications || [],
      stats,
    })
  } catch (error) {
    console.error("Dashboard fetch error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
