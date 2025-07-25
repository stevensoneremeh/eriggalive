import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, paymentReference } = body

    if (!userId || !paymentReference) {
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

    // Verify payment exists and is completed
    const { data: paymentData, error: paymentError } = await supabase
      .from("meet_greet_payments")
      .select("*")
      .eq("payment_reference", paymentReference)
      .eq("user_id", user.id)
      .eq("status", "completed")
      .single()

    if (paymentError || !paymentData) {
      return NextResponse.json({ success: false, message: "Payment not found or not completed" }, { status: 404 })
    }

    // In a real implementation, you would create a Daily.co room here
    // For demo purposes, we'll create a mock room URL
    const roomName = `erigga-meetgreet-${Date.now()}`
    const mockRoomUrl = `https://erigga.daily.co/${roomName}`

    // Create or update session with room details
    const { data: sessionData, error: sessionError } = await supabase
      .from("meet_greet_sessions")
      .upsert({
        user_id: user.id,
        payment_id: paymentData.id,
        status: "confirmed",
        scheduled_time: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes from now
        duration_minutes: 20,
        room_url: mockRoomUrl,
        room_name: roomName,
      })
      .select()
      .single()

    if (sessionError) {
      console.error("Session creation error:", sessionError)
      return NextResponse.json({ success: false, message: "Failed to create session" }, { status: 500 })
    }

    // Notify admin about new booking
    await supabase.from("admin_notifications").insert({
      type: "meet_greet_booking",
      title: "New Meet & Greet Session Booked",
      message: `User ${user.email} has booked a meet & greet session`,
      data: {
        sessionId: sessionData.id,
        userId: user.id,
        userEmail: user.email,
        scheduledTime: sessionData.scheduled_time,
        roomUrl: mockRoomUrl,
      },
    })

    return NextResponse.json({
      success: true,
      sessionId: sessionData.id,
      roomUrl: mockRoomUrl,
      scheduledTime: sessionData.scheduled_time,
    })
  } catch (error) {
    console.error("Room creation error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
