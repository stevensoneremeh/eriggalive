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

    // Delete Daily.co room if exists
    if (process.env.DAILY_API_KEY && booking.daily_room_name) {
      try {
        await fetch(`https://api.daily.co/v1/rooms/${booking.daily_room_name}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
          },
        })
      } catch (dailyError) {
        console.error("Daily.co deletion error:", dailyError)
      }
    }

    // Update booking
    const { data: updatedBooking, error: updateError } = await supabase
      .from("meet_greet_bookings")
      .update({
        status: "completed",
        ended_at: new Date().toISOString(),
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
    })
  } catch (error: any) {
    console.error("End call error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}