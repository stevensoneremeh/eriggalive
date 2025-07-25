import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { transaction_reference } = await request.json()
    const supabase = createClient()

    // Verify payment with Paystack
    const paystackResponse = await fetch(`https://api.paystack.co/transaction/verify/${transaction_reference}`, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    })

    const paystackData = await paystackResponse.json()

    if (paystackData.status && paystackData.data.status === "success") {
      // Update session status
      const { data: session, error: updateError } = await supabase
        .from("meet_greet_sessions")
        .update({
          payment_status: "completed",
          session_status: "scheduled",
        })
        .eq("transaction_reference", transaction_reference)
        .select()
        .single()

      if (updateError) {
        console.error("Session update error:", updateError)
        return NextResponse.json({ success: false, error: "Failed to update session" }, { status: 500 })
      }

      // Create Daily.co room
      const roomResponse = await fetch("/api/meet-greet/create-daily-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: session.id }),
      })

      const roomData = await roomResponse.json()

      if (roomData.success) {
        // Update session with room details
        await supabase
          .from("meet_greet_sessions")
          .update({
            daily_room_name: roomData.room_name,
            daily_room_url: roomData.room_url,
          })
          .eq("id", session.id)

        // Create admin notification
        await supabase.from("admin_notifications").insert({
          session_id: session.id,
          message: `New Meet & Greet session booked by ${session.user_name}`,
          notification_type: "payment_received",
        })

        return NextResponse.json({
          success: true,
          session: {
            ...session,
            daily_room_name: roomData.room_name,
            daily_room_url: roomData.room_url,
          },
        })
      }

      return NextResponse.json({ success: true, session })
    } else {
      return NextResponse.json({ success: false, error: "Payment verification failed" }, { status: 400 })
    }
  } catch (error) {
    console.error("Payment verification error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
