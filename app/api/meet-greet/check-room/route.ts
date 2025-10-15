import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

// Force dynamic rendering - uses cookies which requires runtime evaluation  
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { searchParams } = new URL(request.url)
    const bookingId = searchParams.get("bookingId")

    if (!bookingId) {
      return NextResponse.json({ error: "Booking ID required" }, { status: 400 })
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user profile
    const { data: profile } = await supabase
      .from("users")
      .select("id")
      .eq("auth_user_id", user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    // Get booking
    const { data: booking, error } = await supabase
      .from("meet_greet_bookings")
      .select("id, status, daily_room_url, daily_room_name")
      .eq("id", bookingId)
      .eq("user_id", profile.id)
      .single()

    if (error || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    return NextResponse.json({
      status: booking.status,
      roomUrl: booking.daily_room_url,
      roomName: booking.daily_room_name,
      isReady: booking.status === "in_progress" && !!booking.daily_room_url,
    })
  } catch (error) {
    console.error("Check room error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
