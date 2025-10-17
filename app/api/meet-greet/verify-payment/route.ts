import { NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@/lib/supabase-utils"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const { reference } = await request.json()

    // Verify payment with Paystack
    const paystackResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    )

    if (!paystackResponse.ok) {
      throw new Error("Payment verification failed")
    }

    const paystackData = await paystackResponse.json()

    if (paystackData.data.status === "success") {
      // Create Daily.co room for video call
      let dailyRoomData = {}
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
              },
            }),
          })

          if (dailyResponse.ok) {
            const dailyData = await dailyResponse.json()
            dailyRoomData = {
              daily_room_name: dailyData.name,
              daily_room_url: dailyData.url,
            }
          }
        } catch (dailyError) {
          console.error("Daily.co error:", dailyError)
        }
      }

      // Update booking
      const { data: booking, error } = await supabase
        .from("meet_greet_bookings")
        .update({
          payment_status: "paid",
          status: "confirmed",
          ...dailyRoomData,
        })
        .eq("payment_reference", reference)
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({ booking, verified: true })
    }

    return NextResponse.json({ verified: false })
  } catch (error: any) {
    console.error("Verification error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
