import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("role")
      .eq("auth_user_id", user.id)
      .single()

    if (profileError || !profile || profile.role !== "admin") {
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 })
    }

    // Fetch admin notifications
    const { data: notifications, error } = await supabase
      .from("admin_notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) {
      console.error("Error fetching notifications:", error)
      return NextResponse.json({ success: false, error: "Failed to fetch notifications" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      notifications: notifications || [],
    })
  } catch (error) {
    console.error("Admin notifications API error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("role")
      .eq("auth_user_id", user.id)
      .single()

    if (profileError || !profile || profile.role !== "admin") {
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 })
    }

    const { notificationIds } = await request.json()

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return NextResponse.json({ success: false, error: "Invalid notification IDs" }, { status: 400 })
    }

    // Mark notifications as read
    const { error: updateError } = await supabase
      .from("admin_notifications")
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
        read_by: user.id,
      })
      .in("id", notificationIds)

    if (updateError) {
      console.error("Error marking notifications as read:", updateError)
      return NextResponse.json({ success: false, error: "Failed to mark notifications as read" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Notifications marked as read",
    })
  } catch (error) {
    console.error("Admin notifications update API error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}