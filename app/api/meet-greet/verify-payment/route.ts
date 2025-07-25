import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { reference } = body

    if (!reference) {
      return NextResponse.json({ success: false, message: "Payment reference is required" }, { status: 400 })
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

    // In a real implementation, you would verify with Paystack API
    // For demo purposes, we'll simulate successful verification

    // Update payment status
    const { data: paymentData, error: updateError } = await supabase
      .from("meet_greet_payments")
      .update({
        status: "completed",
        verified_at: new Date().toISOString(),
      })
      .eq("payment_reference", reference)
      .eq("user_id", user.id)
      .select()
      .single()

    if (updateError) {
      console.error("Payment update error:", updateError)
      return NextResponse.json({ success: false, message: "Payment verification failed" }, { status: 500 })
    }

    // Create meet & greet session
    const { data: sessionData, error: sessionError } = await supabase
      .from("meet_greet_sessions")
      .insert({
        user_id: user.id,
        payment_id: paymentData.id,
        status: "confirmed",
        scheduled_time: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes from now
        duration_minutes: 20,
      })
      .select()
      .single()

    if (sessionError) {
      console.error("Session creation error:", sessionError)
      return NextResponse.json({ success: false, message: "Failed to create session" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        payment: paymentData,
        session: sessionData,
      },
    })
  } catch (error) {
    console.error("Payment verification error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
