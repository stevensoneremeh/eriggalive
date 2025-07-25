import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase-utils"

export async function POST(request: NextRequest) {
  try {
    const { reference } = await request.json()

    if (!reference) {
      return NextResponse.json({ success: false, message: "Payment reference is required" }, { status: 400 })
    }

    // In a real implementation, you would verify with Paystack API
    // For demo purposes, we'll simulate successful verification
    const supabase = createServerSupabaseClient()

    // Update session status to paid
    const { data, error } = await supabase
      .from("meet_greet_sessions")
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
      })
      .eq("payment_reference", reference)
      .select()
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ success: false, message: "Failed to verify payment" }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ success: false, message: "Payment record not found" }, { status: 404 })
    }

    // Create admin notification
    await supabase.from("admin_notifications").insert({
      type: "new_booking",
      title: "New Meet & Greet Booking",
      message: `${data.user_name} has booked a Meet & Greet session`,
      data: {
        session_id: data.id,
        user_name: data.user_name,
        user_email: data.user_email,
        amount: data.amount,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        session_id: data.id,
        status: data.status,
        amount: data.amount,
      },
    })
  } catch (error) {
    console.error("Payment verification error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
