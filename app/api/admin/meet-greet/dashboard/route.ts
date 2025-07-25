import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user and verify admin access
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, message: "Authentication required" }, { status: 401 })
    }

    // Check if user is admin (you can adjust this based on your admin system)
    const { data: userProfile } = await supabase.from("users").select("role").eq("auth_user_id", user.id).single()

    if (!userProfile || !["admin", "super_admin"].includes(userProfile.role)) {
      return NextResponse.json({ success: false, message: "Admin access required" }, { status: 403 })
    }

    // Get dashboard statistics
    const [paymentsResult, sessionsResult, notificationsResult] = await Promise.all([
      // Get payment statistics
      supabase
        .from("meet_greet_payments")
        .select("id, amount, status, created_at")
        .order("created_at", { ascending: false })
        .limit(10),

      // Get session statistics
      supabase
        .from("meet_greet_sessions")
        .select(`
          id, status, scheduled_time, started_at, ended_at, duration_minutes,
          user_id, payment_id,
          payment:meet_greet_payments(email, phone, amount)
        `)
        .order("scheduled_time", { ascending: false })
        .limit(10),

      // Get recent notifications
      supabase
        .from("admin_notifications")
        .select("*")
        .eq("type", "meet_greet_booking")
        .order("created_at", { ascending: false })
        .limit(5),
    ])

    // Calculate summary statistics
    const totalRevenue =
      paymentsResult.data?.filter((p) => p.status === "completed").reduce((sum, p) => sum + Number(p.amount), 0) || 0

    const completedSessions = sessionsResult.data?.filter((s) => s.status === "completed").length || 0

    const upcomingSessions =
      sessionsResult.data?.filter((s) => s.status === "confirmed" && new Date(s.scheduled_time) > new Date()).length ||
      0

    const activeSessions = sessionsResult.data?.filter((s) => s.status === "active").length || 0

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalRevenue,
          completedSessions,
          upcomingSessions,
          activeSessions,
          totalBookings: sessionsResult.data?.length || 0,
        },
        recentPayments: paymentsResult.data || [],
        recentSessions: sessionsResult.data || [],
        recentNotifications: notificationsResult.data || [],
      },
    })
  } catch (error) {
    console.error("Admin dashboard error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
