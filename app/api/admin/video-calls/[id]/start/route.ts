import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || user.email !== "info@eriggalive.com") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const bookingId = params.id

    // Get booking
    const { data: booking, error: bookingError } = await supabase
      .from("meet_greet_bookings")
      .select("*")
      .eq("id", bookingId)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    // Create Daily.co room if Daily API key exists
    let dailyRoomData: any = {}

    if (process.env.DAILY_API_KEY) {
      try {
        const dailyResponse = await fetch("https://api.daily.co/v1/rooms", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
          },
          body: JSON.stringify({
            properties: {
              enable_screenshare: true,
              enable_chat: true,
              start_video_off: false,
              start_audio_off: false,
              max_participants: 2,
              exp: Math.floor(Date.now() / 1000) + (booking.duration * 60) + 600, // Duration + 10 min buffer
            },
          }),
        })

        if (dailyResponse.ok) {
          const dailyData = await dailyResponse.json()
          dailyRoomData = {
            daily_room_name: dailyData.name,
            daily_room_url: dailyData.url,
          }
        } else {
          throw new Error("Failed to create Daily.co room")
        }
      } catch (dailyError) {
        console.error("Daily.co error:", dailyError)
        return NextResponse.json({ error: "Failed to create video room" }, { status: 500 })
      }
    } else {
      return NextResponse.json({ error: "Video service not configured" }, { status: 500 })
    }

    // Update booking
    const { data: updatedBooking, error: updateError } = await supabase
      .from("meet_greet_bookings")
      .update({
        status: "in_progress",
        started_at: new Date().toISOString(),
        ...dailyRoomData,
      })
      .eq("id", bookingId)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: "Failed to update booking" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      booking: updatedBooking,
      room_url: dailyRoomData.daily_room_url,
    })
  } catch (error: any) {
    console.error("Start call error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}